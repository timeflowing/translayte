// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';

admin.initializeApp();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!,  { apiVersion: "2025-02-24.acacia" }
);

export async function POST(req: NextRequest) {
  const { token } = await req.json();               // Firebase ID token
  const fbUser    = await getAuth().verifyIdToken(token);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    success_url: `${process.env._HOST}/billing/success`,
    cancel_url:  `${process.env._HOST}/billing/cancel`,
    payment_method_types: ['card'],
    customer_email: fbUser.email!,
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
  });

  return NextResponse.json({ url: session.url });
}