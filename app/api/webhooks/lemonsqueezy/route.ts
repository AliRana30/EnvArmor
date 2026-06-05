import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature, type WebhookPayload, type WebhookEvent } from '@/lib/lemonsqueezy';

/**
 * Lemon Squeezy webhook handler
 * Processes subscription events: created, updated, cancelled, expired
 *
 * Webhook events flow:
 * 1. User clicks "Subscribe" → redirected to LS checkout
 * 2. Completes payment → LS calls this webhook with subscription_created
 * 3. Should create Subscription row + update User.plan
 * 4. User can manage subscription on settings page
 * 5. On cancellation → subscription_cancelled → set status = CANCELLED
 * 6. User keeps access until period end + grace period
 */

export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('x-signature');

    if (!signature) {
      console.error('Missing signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse payload
    const payload: WebhookPayload = JSON.parse(body);
    const eventName = payload.meta.event_name as WebhookEvent;

    console.log(`🪗 Lemon Squeezy webhook: ${eventName}`);

    // Extract subscription ID and custom data
    const subscriptionId = payload.data.id;
    const customerId = payload.data.attributes.customer_id.toString();
    const userId = payload.meta.custom_data?.userId;
    const plan = payload.meta.custom_data?.plan as 'BASIC' | 'PRO' | 'TEAM' | undefined;

    if (!userId) {
      console.error('Missing userId in webhook custom_data');
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Find or create user
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

    // Handle different webhook events
    switch (eventName) {
      case 'subscription_created':
        await handleSubscriptionCreated(
          userId,
          subscriptionId,
          customerId,
          payload,
          plan
        );
        break;

      case 'subscription_updated':
        await handleSubscriptionUpdated(userId, subscriptionId, payload, plan);
        break;

      case 'subscription_cancelled':
        await handleSubscriptionCancelled(userId, subscriptionId);
        break;

      case 'subscription_resumed':
        await handleSubscriptionResumed(userId, subscriptionId);
        break;

      case 'subscription_expired':
        await handleSubscriptionExpired(userId);
        break;

      default:
        console.log(`Ignoring event: ${eventName}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(
  userId: string,
  subscriptionId: string,
  customerId: string,
  payload: WebhookPayload,
  plan?: string
) {
  const currentPeriodEnd = new Date(payload.data.attributes.current_period_end);

  // Upsert subscription (in case webhook arrives twice)
  await prisma.subscription.upsert({
    where: { userId },
    update: {
      lemonsqueezyId: subscriptionId,
      status: 'ACTIVE',
      plan: (plan || 'BASIC') as 'BASIC' | 'PRO' | 'TEAM',
      currentPeriodEnd,
    },
    create: {
      userId,
      lemonsqueezyId: subscriptionId,
      status: 'ACTIVE',
      plan: (plan || 'BASIC') as 'BASIC' | 'PRO' | 'TEAM',
      currentPeriodEnd,
    },
  });

  // Update user plan
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: (plan || 'BASIC') as 'BASIC' | 'PRO' | 'TEAM',
    },
  });

  console.log(`✅ Subscription created for user ${userId}: ${plan}`);
}

async function handleSubscriptionUpdated(
  userId: string,
  subscriptionId: string,
  payload: WebhookPayload,
  plan?: string
) {
  const currentPeriodEnd = new Date(payload.data.attributes.current_period_end);

  // Update subscription
  await prisma.subscription.update({
    where: { userId },
    data: {
      status: payload.data.attributes.status === 'cancelled' ? 'CANCELLED' : 'ACTIVE',
      plan: (plan || 'BASIC') as 'BASIC' | 'PRO' | 'TEAM',
      currentPeriodEnd,
    },
  });

  console.log(`✅ Subscription updated for user ${userId}: ${plan}`);
}

async function handleSubscriptionCancelled(userId: string, subscriptionId: string) {
  const endsAt = new Date();

  // Mark subscription as cancelled
  // User keeps access until current_period_end
  await prisma.subscription.update({
    where: { userId },
    data: {
      status: 'CANCELLED',
    },
  });

  console.log(`✅ Subscription cancelled for user ${userId}. Access until period end.`);
}

async function handleSubscriptionResumed(userId: string, subscriptionId: string) {
  // Reactivate subscription
  await prisma.subscription.update({
    where: { userId },
    data: {
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Subscription resumed for user ${userId}`);
}

async function handleSubscriptionExpired(userId: string) {
  // Downgrade user to FREE plan
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: 'FREE',
    },
  });

  await prisma.subscription.updateMany({
    where: { userId },
    data: {
      status: 'EXPIRED',
    },
  });

  console.log(`✅ Subscription expired for user ${userId}. Downgraded to FREE.`);
}
