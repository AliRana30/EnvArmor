import crypto from 'crypto';

/**
 * XPay integration for local Pakistani payments
 * Supports JazzCash, EasyPaisa, and Pakistani bank cards
 * Registered at xpay.postexglobal.com
 */

const API_BASE = 'https://api.xstak.com/v1';

export interface XPayInitializeOptions {
  amount: number; // in PKR
  orderId: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  callbackUrl: string;
}

export interface XPayInitializeResponse {
  paymentUrl: string;
  transactionId: string;
  expiresAt: string;
}

export interface XPayVerifyResponse {
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  amount: number;
  transactionId: string;
  timestamp: string;
}

const API_KEY = process.env.XPAY_API_KEY || '';
const WEBHOOK_SECRET = process.env.XPAY_WEBHOOK_SECRET || '';

/**
 * Initialize a payment with XPay
 * Creates a payment session for Pakistani users
 */
export async function initializePayment(
  options: XPayInitializeOptions
): Promise<XPayInitializeResponse> {
  if (!API_KEY) {
    throw new Error('XPAY_API_KEY not configured');
  }

  try {
    const response = await fetch(`${API_BASE}/payment/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': API_KEY,
      },
      body: JSON.stringify({
        amount: options.amount,
        currency: 'PKR',
        orderId: options.orderId,
        customer: {
          email: options.customerEmail,
          phone: options.customerPhone,
        },
        description: options.description,
        callbackUrl: options.callbackUrl,
        methods: ['JazzCash', 'EasyPaisa', 'BankCard'], // Available payment methods
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`XPay error: ${JSON.stringify(error)}`);
    }

    const data = (await response.json()) as {
      paymentUrl: string;
      transactionId: string;
      expiresAt: string;
    };

    return {
      paymentUrl: data.paymentUrl,
      transactionId: data.transactionId,
      expiresAt: data.expiresAt,
    };
  } catch (error) {
    throw new Error(`Failed to initialize payment: ${String(error)}`);
  }
}

/**
 * Verify a XPay payment
 * Checks the status of a transaction
 */
export async function verifyPayment(
  transactionId: string
): Promise<XPayVerifyResponse> {
  if (!API_KEY) {
    throw new Error('XPAY_API_KEY not configured');
  }

  try {
    const response = await fetch(
      `${API_BASE}/payment/verify/${transactionId}`,
      {
        method: 'GET',
        headers: {
          'X-API-KEY': API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }

    const data = (await response.json()) as {
      status: string;
      amount: number;
      transactionId: string;
      timestamp: string;
    };

    return {
      status: data.status as 'SUCCESS' | 'PENDING' | 'FAILED',
      amount: data.amount,
      transactionId: data.transactionId,
      timestamp: data.timestamp,
    };
  } catch (error) {
    throw new Error(`Failed to verify payment: ${String(error)}`);
  }
}

/**
 * Verify XPay webhook signature
 * Ensures webhook payloads are authentic
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  if (!WEBHOOK_SECRET) {
    console.error('XPAY_WEBHOOK_SECRET not configured');
    return false;
  }

  const hash = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

/**
 * Parse XPay webhook payload
 */
export interface XPayWebhookPayload {
  event: string;
  transactionId: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  amount: number;
  orderId: string;
  timestamp: string;
  customerEmail: string;
  customData?: {
    userId: string;
    plan: string;
  };
}

/**
 * Map PKR amounts to plans
 * Exchange rates should be updated periodically
 */
export function mapPKRToplan(amountPKR: number): 'BASIC' | 'PRO' | 'TEAM' | null {
  const pKRPerUSD = parseFloat(process.env.PKR_PER_USD || '280');

  // USD prices (same as global)
  const BASIC_USD = 3;
  const PRO_USD = 9;
  const TEAM_USD = 19;

  // Convert to PKR
  const BASIC_PKR = BASIC_USD * pKRPerUSD;
  const PRO_PKR = PRO_USD * pKRPerUSD;
  const TEAM_PKR = TEAM_USD * pKRPerUSD;

  // Allow ±5% tolerance for rounding
  const tolerance = 0.05;

  if (
    amountPKR >= BASIC_PKR * (1 - tolerance) &&
    amountPKR <= BASIC_PKR * (1 + tolerance)
  ) {
    return 'BASIC';
  }
  if (
    amountPKR >= PRO_PKR * (1 - tolerance) &&
    amountPKR <= PRO_PKR * (1 + tolerance)
  ) {
    return 'PRO';
  }
  if (
    amountPKR >= TEAM_PKR * (1 - tolerance) &&
    amountPKR <= TEAM_PKR * (1 + tolerance)
  ) {
    return 'TEAM';
  }

  return null;
}

