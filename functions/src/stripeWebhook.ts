// functions/src/stripeWebhook.ts
import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import admin from 'firebase-admin';
admin.initializeApp();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

export const stripeWebhook = functions
  .region('europe-central2')
  .https.onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature']!;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err}`);
      return;
    }

    if (event.type === 'checkout.session.completed') {
      const cs = event.data.object as Stripe.Checkout.Session;
      const snap = await admin.firestore().collection('users')
        .where('email', '==', cs.customer_details!.email).limit(1).get();
      if (!snap.empty) {
        snap.docs[0].ref.update({
          subscription: {
            id: cs.subscription,
            status: 'active',
            current_period_end: (cs.expires_at! * 1000)
          }
        });
      }
    }
    // handle subscription.updated, .canceled likewise
    res.json({ received: true });
  });