import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2024-06-20',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const session = await getSession({ req });

        if (!session || !session.user) {
            console.error('Unauthorized request: No session or user found.');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Extend the user type to include stripeCustomerId
        const user = session.user as typeof session.user & { stripeCustomerId?: string };
        const customerId = user.stripeCustomerId;

        if (!customerId) {
            console.error('Bad request: No Stripe customer ID found.');
            return res.status(400).json({ error: 'No Stripe customer ID found' });
        }

        try {
            // Retrieve the active subscription
            const subscriptions = await stripe.subscriptions.list({
                customer: customerId,
                status: 'active',
                limit: 1,
            });

            if (subscriptions.data.length === 0) {
                console.error('No active subscription found for customer:', customerId);
                return res.status(404).json({ error: 'No active subscription found' });
            }

            const subscriptionId = subscriptions.data[0].id;

            // Cancel the subscription by setting cancel_at_period_end to true
            await stripe.subscriptions.update(subscriptionId, {
                cancel_at_period_end: true,
            });

            console.log('Subscription cancellation scheduled for customer:', customerId);

            // Update user status in the database (example logic, replace with actual implementation)
            // const db = getDatabase();
            // await db.collection('users').doc(user.id).update({
            //     proStatus: false,
            // });

            return res.status(200).json({ message: 'Subscription canceled successfully' });
        } catch (stripeError) {
            console.error('Stripe API error:', stripeError);
            return res.status(500).json({ error: 'Failed to cancel subscription with Stripe' });
        }
    } catch (error) {
        console.error('Error in subscription cancellation:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
