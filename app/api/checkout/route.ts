// app/api/checkout/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: Request) {
  try {
    // Initialize Stripe only at runtime
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2025-02-24.acacia", // Use a stable API version
    });

    const { priceId } = await request.json();

    // Create a Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${
        request.headers.get("origin") || process.env._SITE_URL
      }/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${
        request.headers.get("origin") || process.env._SITE_URL
      }/cancel`,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error: unknown) {
    console.error("Stripe error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
