// app/api/checkout/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(request: Request) {
  try {
    const { priceId } = await request.json();

    // Create a Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription", // Change to "payment" for one-time payments
      line_items: [
        {
          price: priceId, // Use your actual Price ID from Stripe Dashboard
          quantity: 1,
        },
      ],
      success_url: `${request.headers.get(
        "origin"
      )}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get("origin")}/cancel`,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error: unknown) {
    console.error("Stripe Checkout error:", error.message);
    return NextResponse.error();
  }
}
