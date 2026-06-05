import crypto from 'crypto';

/**
 * Lemon Squeezy subscription management for EnvArmor
 * Handles checkout creation, customer portal access, and webhook verification
 */

const API_BASE = 'https://api.lemonsqueezy.com/v1';

export interface CheckoutOptions {
  userId: string;
  plan: 'BASIC' | 'PRO' | 'TEAM';
}

export interface LemonsqueezyCheckout {
  checkoutUrl: string;
  checkoutId: string;
}

export interface LemonsqueezyCustomer {
  email: string;
  lemonsqueezyId: string;
  plan: 'FREE' | 'BASIC' | 'PRO' | 'TEAM';
  currentPeriodEnd: Date;
  status: 'active' | 'cancelled' | 'expired';
}

// Map of plan to Lemon Squeezy variant IDs (from environment)
const VARIANT_MAP: Record<string, string> = {
  BASIC: process.env.LEMONSQUEEZY_BASIC_VARIANT_ID || '',
  PRO: process.env.LEMONSQUEEZY_PRO_VARIANT_ID || '',
  TEAM: process.env.LEMONSQUEEZY_TEAM_VARIANT_ID || '',
};

const STORE_ID = process.env.LEMONSQUEEZY_STORE_ID || '';
const API_KEY = process.env.LEMONSQUEEZY_API_KEY || '';

/**
 * Create a checkout URL for Lemon Squeezy
 * Returns a unique checkout link that redirects to LS hosted page
 */
export async function createCheckoutUrl(
  userId: string,
  plan: 'BASIC' | 'PRO' | 'TEAM',
  userEmail: string
): Promise<LemonsqueezyCheckout> {
  const variantId = VARIANT_MAP[plan];

  if (!variantId) {
    throw new Error(`No variant configured for plan: ${plan}`);
  }

  if (!STORE_ID || !API_KEY) {
    throw new Error('Lemon Squeezy credentials not configured');
  }

  try {
    const response = await fetch(`${API_BASE}/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: userEmail,
              name: userId,
            },
            product_options: {
              redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings`,
            },
            custom_data: {
              userId,
              plan,
            },
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: STORE_ID,
              },
            },
            variant: {
              data: {
                type: 'variants',
                id: variantId,
              },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Lemon Squeezy API error: ${JSON.stringify(error)}`);
    }

    const data = (await response.json()) as {
      data: {
        id: string;
        attributes: {
          url: string;
        };
      };
    };

    return {
      checkoutUrl: data.data.attributes.url,
      checkoutId: data.data.id,
    };
  } catch (error) {
    throw new Error(`Failed to create checkout: ${String(error)}`);
  }
}

/**
 * Get Lemon Squeezy customer portal URL
 * Allows user to manage their subscription
 */
export async function getCustomerPortalUrl(customerId: string): Promise<string> {
  if (!API_KEY) {
    throw new Error('Lemon Squeezy API key not configured');
  }

  try {
    const response = await fetch(`${API_BASE}/customers/${customerId}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Customer not found: ${customerId}`);
    }

    const data = (await response.json()) as {
      data: {
        attributes: {
          urls: {
            customer_portal: string;
          };
        };
      };
    };

    return data.data.attributes.urls.customer_portal;
  } catch (error) {
    throw new Error(`Failed to get customer portal: ${String(error)}`);
  }
}

/**
 * Verify Lemon Squeezy webhook signature
 * Ensures webhook payloads are authentic
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!secret) {
    console.error('LEMONSQUEEZY_WEBHOOK_SECRET not configured');
    return false;
  }

  const hash = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

/**
 * Parse Lemon Squeezy webhook payload
 */
export interface WebhookPayload {
  meta: {
    event_name: string;
    custom_data?: {
      userId: string;
      plan: string;
    };
  };
  data: {
    id: string;
    type: string;
    attributes: {
      customer_id: number;
      status: string;
      current_period_end: string;
      ends_at?: string;
    };
  };
}

export type WebhookEvent =
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'subscription_resumed'
  | 'subscription_expired'
  | 'subscription_paused';

