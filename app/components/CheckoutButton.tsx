'use client';

import React from 'react';
import { loadStripe } from '@stripe/stripe-js';

// Load Stripe using your publishable key
const stripePromise = loadStripe(process.env._STRIPE_PUBLISHABLE_KEY as string);

const CheckoutButton: React.FC = () => {
    const handleCheckout = async () => {
        // Replace with your actual Price ID from Stripe Dashboard
        const priceId = 'price_1QyBQJH4gXZfA5MpNjyXei3W';

        // Create a Checkout session by calling your API
        const res = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priceId }),
        });

        const data = await res.json();

        // Redirect to Stripe Checkout
        const stripe = await stripePromise;
        if (stripe) {
            const { error } = await stripe.redirectToCheckout({
                sessionId: data.sessionId,
            });
            if (error) {
                console.error('Stripe redirect error:', error);
            }
        }
    };

    return (
        <button onClick={handleCheckout} style={buttonStyles}>
            Subscribe Now
        </button>
    );
};

const buttonStyles: React.CSSProperties = {
    padding: '12px 20px',
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    fontSize: '1rem',
    cursor: 'pointer',
};

export default CheckoutButton;
