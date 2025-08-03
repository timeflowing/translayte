import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    const { email } = req.body; // get email from frontend
    if (!email) return res.status(400).json({ error: 'Missing email' });

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
            {
                price: process.env.STRIPE_PRICE_ID,
                quantity: 1,
            },
        ],
        customer_email: email,
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/billing?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/billing?canceled=true`,
    });

    res.status(200).json({ url: session.url });
}