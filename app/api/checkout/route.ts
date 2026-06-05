import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerClient } from '@/lib/supabase/server';
import { createCheckoutUrl } from '@/lib/lemonsqueezy';
import { initializePayment } from '@/lib/xpay';

/**
 * Smart checkout handler
 * Routes to Lemon Squeezy (global cards) or XPay (Pakistani local payments)
 */

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from DB
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await req.json() as {
      plan: 'BASIC' | 'PRO' | 'TEAM';
      paymentMethod: 'CARD' | 'PAKISTAN';
    };

    const { plan, paymentMethod } = body;

    if (!plan || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing plan or paymentMethod' },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: dbUser.id },
    });

    if (existingSubscription && existingSubscription.status === 'ACTIVE') {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      );
    }

    // Route based on payment method
    if (paymentMethod === 'CARD') {
      // Global card payment via Lemon Squeezy
      try {
        const checkout = await createCheckoutUrl(
          dbUser.id,
          plan,
          user.email!
        );

        return NextResponse.json(
          { checkoutUrl: checkout.checkoutUrl },
          { status: 200 }
        );
      } catch (error) {
        console.error('Lemon Squeezy error:', error);
        return NextResponse.json(
          { error: 'Failed to create checkout' },
          { status: 500 }
        );
      }
    } else if (paymentMethod === 'PAKISTAN') {
      // Local Pakistani payment via XPay
      try {
        // Map plan to PKR amount
        const pKRPerUSD = parseFloat(process.env.PKR_PER_USD || '280');
        const usdPrices = {
          BASIC: 3,
          PRO: 9,
          TEAM: 19,
        };

        const usdPrice = usdPrices[plan];
        const pkrAmount = Math.round(usdPrice * pKRPerUSD);

        // Initialize XPay payment
        const xpayPayment = await initializePayment({
          amount: pkrAmount,
          orderId: `${dbUser.id}-${plan}-${Date.now()}`,
          customerEmail: user.email!,
          customerPhone: user.user_metadata?.phone || '',
          description: `EnvArmor ${plan} Plan - ${pkrAmount} PKR`,
          callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/xpay`,
        });

        return NextResponse.json(
          {
            paymentUrl: xpayPayment.paymentUrl,
            amountPKR: pkrAmount,
            transactionId: xpayPayment.transactionId,
          },
          { status: 200 }
        );
      } catch (error) {
        console.error('XPay error:', error);
        return NextResponse.json(
          { error: 'Failed to initialize XPay payment' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check checkout status
 * Can be used to verify subscription after redirect
 */
export async function GET(req: NextRequest) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! }, select: { id: true } });
  const subscription = dbUser
    ? await prisma.subscription.findUnique({ where: { userId: dbUser.id } })
    : null;

  return NextResponse.json({
    hasActiveSubscription: subscription?.status === 'ACTIVE',
    plan: subscription?.plan || 'FREE',
  });
}
