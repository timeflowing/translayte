import * as functions from "firebase-functions/v2/https";
import Stripe from "stripe";
import admin from "firebase-admin";
admin.initializeApp();

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!,
  {apiVersion: "2024-06-20"}
);

// v2 API: region is now an option in the function config
export const stripeWebhook = functions.onRequest(
  {
    region: "europe-central2",
    maxInstances: 1, // example option, can remove if not needed
  },
  async (req, res) => {
    const sig = req.headers["stripe-signature"]!;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      if (err instanceof Error) {
        console.error("Webhook signature verification failed:", err.message);
      } else {
        console.error("Unknown error during webhook signature verification.");
      }
      res.status(400).send("Webhook Error");
      return;
    }

    if (event.type === "checkout.session.completed") {
      try {
        const cs = event.data.object as Stripe.Checkout.Session;
        const usersRef = admin.firestore().collection("users");
        const snap = await usersRef
          .where("email", "==", cs.customer_details?.email)
          .limit(1)
          .get();

        if (!snap.empty) {
          await snap.docs[0].ref.update({
            subscription: {
              id: cs.subscription,
              status: "active",
              current_period_end: cs.expires_at! * 1000,
            },
          });
        }
      } catch (updateError) {
        console.error(
          "Failed to process checkout.session.completed event:",
          updateError
        );
      }
    }
    res.json({received: true});
  }
);
