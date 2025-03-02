import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize the Stripe client with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia", // Use the latest API version
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { donationAmount } = body;

    // Validate amount
    if (!donationAmount || donationAmount < 1) {
      return NextResponse.json(
        { error: "Invalid donation amount" },
        { status: 400 }
      );
    }

    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Donation to Translayte",
              description: "Thank you for supporting our tool!",
            },
            unit_amount: Math.round(donationAmount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }/donate-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }/donate`,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error: unknown) {
    console.error("Donation API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
