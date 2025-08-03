/**
 * Billing API Route
 * ------------------
 * Endpoint:   GET /api/billing
 * Purpose:    Returns current user's Stripe subscription status and billing history.
 *
 * Navigation:
 *   - Method: GET
 *   - URL:    /api/billing
 *   - Auth:   Bearer token in Authorization header (Firebase ID token)
 *   - Example:
 *       fetch('/api/billing', { headers: { Authorization: `Bearer <idToken>` } })
 *
 * Details:
 *   - Reads Stripe customer ID from Firestore (customers/{uid}.stripeId)
 *   - Fetches subscription and invoice data from Stripe
 *   - Returns: { subscription, billingHistory }
 *
 * Maintainer notes:
 *   - Stripe API version: 2024-06-20
 *   - Requires STRIPE_SECRET_KEY in environment
 *   - Used by billing page for transparency and legal compliance
 */
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDB } from '@/app/lib/firebaseAdmin';
import { Stripe } from 'stripe';

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const idToken = authHeader.replace('Bearer ', '');
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;


    // Get user's Stripe customer ID from Firestore Stripe extension (customers/{uid})
    const customerDoc = await adminDB.collection('customers').doc(userId).get();
    const customerData = customerDoc.data();
    const stripeCustomerId = customerData?.stripeId;

    if (!stripeCustomerId) {
      // User might not have a subscription yet, which is not an error.
      return NextResponse.json({
        subscription: null,
        billingHistory: [],
      });
    }

    // Fetch subscription details
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'all',
      limit: 1, // Get the most recent subscription
    });

    let subscriptionData = null;
    if (subscriptions.data.length > 0) {
      const sub = subscriptions.data[0];
      let plan = sub.items.data[0]?.price.nickname;
      if (!plan || plan === 'Unknown Plan') plan = 'Pro';
      subscriptionData = {
        plan: plan,
        status: sub.status,
        nextBillingDate: sub.current_period_end ? new Date(sub.current_period_end * 1000).toLocaleDateString() : null,
      };
    }

    // Fetch billing history (invoices)
    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 12, // Last 12 months
    });

    const billingHistory = invoices.data.map(invoice => ({
      date: new Date(invoice.created * 1000).toLocaleDateString(),
      amount: `$${(invoice.amount_paid / 100).toFixed(2)}`,
      status: invoice.status || 'unknown',
      invoiceUrl: invoice.hosted_invoice_url,
    }));

    return NextResponse.json({
      subscription: subscriptionData,
      billingHistory: billingHistory,
    });

  } catch (error) {
    console.error('Billing API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
