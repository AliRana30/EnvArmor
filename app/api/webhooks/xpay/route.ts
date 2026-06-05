import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature, mapPKRToplan, type XPayWebhookPayload } from '@/lib/xpay';

/**
 * XPay webhook handler for Pakistani payments
 * Processes local payment events: SUCCESS, FAILED, PENDING
 *
 * Flow:
 * 1. Pakistani user selects "Pay with JazzCash/EasyPaisa"
 * 2. Gets redirected to XPay payment page
 * 3. Completes payment in PKR
 * 4. XPay calls this webhook with payment.success
 * 5. We activate subscription and credit user
 */

export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('x-xpay-signature');

    if (!signature) {
      console.error('Missing X-XPAY-SIGNATURE header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid XPay webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse payload
    const payload: XPayWebhookPayload = JSON.parse(body);

    console.log(`🪗 XPay webhook: ${payload.event} - ${payload.transactionId}`);

    // Only process successful payments
    if (payload.status !== 'SUCCESS') {
      console.log(`⏭️  Skipping non-successful payment: ${payload.status}`);
      return NextResponse.json({ success: true });
    }

    // Extract custom data
    const userId = payload.customData?.userId;
    const orderId = payload.orderId;

    if (!userId) {
      console.error('Missing userId in XPay webhook');
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.error(`User not found: ${userId}`);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Map PKR amount to plan tier
    const plan = mapPKRToplan(payload.amount);

    if (!plan) {
      console.error(
        `Could not map PKR amount ${payload.amount} to a plan tier`
      );
      return NextResponse.json(
        { error: 'Invalid payment amount' },
        { status: 400 }
      );
    }

    // Create or update subscription
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    await prisma.subscription.upsert({
      where: { userId },
      update: {
        status: 'ACTIVE',
        plan,
        xpayTransactionId: payload.transactionId,
        currency: 'PKR',
        amountPaid: payload.amount,
        currentPeriodEnd,
      },
      create: {
        userId,
        status: 'ACTIVE',
        plan,
        xpayTransactionId: payload.transactionId,
        currency: 'PKR',
        amountPaid: payload.amount,
        currentPeriodEnd,
      },
    });

    // Update user plan
    await prisma.user.update({
      where: { id: userId },
      data: { plan },
    });

    console.log(
      `✅ XPay subscription activated for user ${userId}: ${plan} (${payload.amount} PKR)`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('XPay webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
