// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

// FIX: Only initialize the app if it doesn't already exist.
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

// NOTE: This route seems to be different from your '/api/stripe/extension-checkout' route.
// This file likely contains logic to interact with Stripe directly.
// The rest of this file is an assumption based on a standard Stripe checkout flow.

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { priceId, uid } = await req.json();

        if (!uid) {
            return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            metadata: {
                firebaseUID: uid,
            },
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${req.nextUrl.origin}/success`,
            cancel_url: `${req.nextUrl.origin}/translator`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Stripe checkout error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
}