import { NextRequest } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

export async function POST(req: NextRequest) {
    try {
        const { uid, email } = await req.json();
        if (!uid || !email) {
            return new Response(JSON.stringify({ error: 'Missing uid or email' }), { status: 400 });
        }

        const priceId = process.env.STRIPE_PRO_PRICE_ID;
        const successUrl = process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/success';
        const cancelUrl = process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/cancel';

        // Create a checkout session document in Firestore
        // The Stripe extension will automatically add the checkout URL
        const checkoutSessionRef = admin
            .firestore()
            .collection('customers')
            .doc(uid)
            .collection('checkout_sessions')
            .doc();

        await checkoutSessionRef.set({
            price: priceId,
            success_url: successUrl,
            cancel_url: cancelUrl,
            mode: 'subscription',
        });

        // Wait for the extension to add the checkout URL
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
            const doc = await checkoutSessionRef.get();
            const data = doc.data();
            
            if (data?.url) {
                return new Response(JSON.stringify({ url: data.url }), { status: 200 });
            }
            
            if (data?.error) {
                return new Response(JSON.stringify({ error: data.error.message }), { status: 500 });
            }
            
            attempts++;
        }

        return new Response(JSON.stringify({ error: 'Timeout waiting for checkout URL' }), { status: 500 });

    } catch (err) {
        console.error('[Stripe Extension Checkout]', err);
        return new Response(JSON.stringify({ error: 'Failed to create checkout session' }), { status: 500 });
    }
}
