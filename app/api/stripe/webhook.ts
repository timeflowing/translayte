import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(process.env.FIREBASE_SERVICE_ACCOUNT as admin.ServiceAccount) });
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig!,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        return res.status(400).send(`Webhook Error: ${errorMessage}`);
    }


    if (event.type === 'checkout.session.completed' || event.type === 'customer.subscription.updated') {
        const session = event.data.object;
        const firebaseUid = session.metadata?.firebaseUid;
        if (firebaseUid) {
            await admin.firestore().collection('users').doc(firebaseUid).set(
                { subscription: { status: 'active', stripeId: session.customer } },
                { merge: true }
            );
        }
    }
    res.status(200).json({ received: true });
}