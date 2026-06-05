/**
 * Payoneer helper for EnvArmor founder
 * Payoneer is used as a RECEIVING account, not a payment processor
 *
 * Flow:
 * 1. Lemon Squeezy collects global card payments
 * 2. LS pays out to your Payoneer USD balance
 * 3. XPay collects local PKR payments (JazzCash/EasyPaisa/etc)
 * 4. You withdraw PKR to your local bank via XPay
 * 5. Payoneer allows USD → PKR conversion at competitive rates
 */

export interface PayoneerPaymentRequest {
  amount: number;
  currency: 'USD' | 'PKR';
  description: string;
  recipientEmail?: string;
}

/**
 * Generate a Payoneer payment request link
 * Used for enterprise/manual deals where you invoice customers
 *
 * Users can pay via:
 * - Direct bank transfer to your Payoneer account
 * - Payoneer eWallet transfer
 * - Card payment (processed by Payoneer)
 */
export function createPayoneerRequestLink(params: PayoneerPaymentRequest): string {
  const { amount, currency, description } = params;

  // Payoneer request payment URL format
  // Note: This creates a "Request Money" link
  const baseUrl = 'https://www.payoneer.com/request-payment/';

  const query = new URLSearchParams({
    amount: amount.toString(),
    currency: currency,
    description: description,
  });

  return `${baseUrl}?${query.toString()}`;
}

/**
 * Get Payoneer account email from environment
 */
export function getPayoneerAccountEmail(): string {
  const email = process.env.PAYONEER_ACCOUNT_EMAIL;

  if (!email) {
    throw new Error(
      'PAYONEER_ACCOUNT_EMAIL not configured. Set it in your .env'
    );
  }

  return email;
}

/**
 * Information about Payoneer setup for documentation
 */
export const PAYONEER_SETUP_GUIDE = `
PAYONEER SETUP FOR PAKISTAN-BASED FOUNDERS

1. Create a Payoneer account:
   - Go to https://www.payoneer.com
   - Sign up with your Pakistani phone number and email
   - Verify your identity with passport/CNIC

2. Link bank account for withdrawals:
   - Add your Pakistani bank account details
   - Payoneer supports all major Pakistani banks
   - Withdrawal fees are ~1.5-2% + flat fee

3. USD to PKR conversion:
   - Payoneer offers competitive exchange rates
   - Convert USD to PKR for local use
   - Or withdraw USD directly (some banks support this)

4. Lemon Squeezy payout setup:
   - In LS dashboard: https://app.lemonsqueezy.com
   - Go to Settings → Payout Method
   - Add your Payoneer email
   - Select payout frequency (weekly/monthly)

5. Environmental setup in EnvArmor:
   - PAYONEER_ACCOUNT_EMAIL: your@payoneer.email
   - This is displayed on pricing page for custom deals

6. Withdrawal workflow:
   - LS pays out to Payoneer USD balance (weekly)
   - XPay deposits PKR from local payments directly to bank
   - Withdraw from Payoneer to Pakistani bank account
   - Exchange rate: Payoneer → bank is ~${process.env.PKR_PER_USD || 280} PKR/USD

REVENUE SUMMARY:
- Global customers: Card payments → Lemon Squeezy → Payoneer USD
- Pakistani customers: JazzCash/EasyPaisa → XPay → Your bank PKR
- Founder: All revenue consolidated in Payoneer + bank account
`;

/**
 * Validate Payoneer email format
 */
export function validatePayoneerEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
