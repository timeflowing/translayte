'use client';

import React from 'react';
import SynapseAnimation from '../utils/SynapseAnimation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db as firestore } from '../lib/firebaseClient';
import { useCollection } from 'react-firebase-hooks/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection } from 'firebase/firestore';
import { loadStripe } from '@stripe/stripe-js';
import Link from 'next/link';

const stripePromise = loadStripe(
    'pk_live_51Qy8CBH4gXZfA5MpAOg9XsMohRhcgxpoytuIdgkEKBIKlxwlfpOl57IoVzlX1QP73wJOe0H9uxuqcEGRFiqHaosF00L4cdBsZF',
);

const PRICE_ID = 'prod_Sb4Hfj4kosoqzD';

const ProPage = () => {
    const [user, loadingAuth] = useAuthState(auth);

    // Get user's subscription from Firestore
    const subsRef = user && collection(firestore, 'customers', user.uid, 'subscriptions');
    const [subsSnapshot, loadingSubs] = useCollection(subsRef);
    const subscription = subsSnapshot?.docs[0]?.data();

    const [loading, setLoading] = React.useState(false);
    const functions = getFunctions();

    // Subscribe button logic
    const handleSubscribe = async () => {
        if (!user) return alert('You need to be logged in.');
        setLoading(true);
        try {
            const createCheckoutSession = httpsCallable(
                functions,
                'ext-firestore-stripe-payments-createCheckoutSession',
            );
            const { data }: any = await createCheckoutSession({
                price: PRICE_ID,
                success_url: window.location.origin + '/pro',
                cancel_url: window.location.origin + '/pro',
                // You can pass allow_promotion_codes: true if you want coupon codes
            });
            const stripe = await stripePromise;
            await stripe?.redirectToCheckout({ sessionId: data.id });
        } finally {
            setLoading(false);
        }
    };

    // Manage Billing Portal
    const handleManageBilling = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const createPortalLink = httpsCallable(
                functions,
                'ext-firestore-stripe-payments-createPortalLink',
            );
            const { data } = await createPortalLink({
                returnUrl: window.location.origin + '/pro',
            });
            window.location.assign(data.url);
        } finally {
            setLoading(false);
        }
    };

    // UI
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br  relative overflow-hidden">
            <SynapseAnimation className="absolute inset-0 w-full h-full -z-10" />
            <div className="bg-[#191627]/90 border border-[#8B5CF6]/10 shadow-xl rounded-2xl p-10 max-w-lg w-full mx-4 relative z-10 backdrop-blur-lg">
                <h1 className="text-3xl font-bold mb-2 text-white text-center">
                    Go <span className="gradient-text">Pro</span> with Translayte
                </h1>
                <p className="text-gray-300 text-center mb-8">
                    Unlock unlimited translations, access history, and get priority support.
                </p>
                <div className="mb-8">
                    <div className="flex items-center gap-3 justify-center">
                        <span className="text-4xl font-bold text-white">$12.99</span>
                        <span className="text-gray-400 text-lg">/ month</span>
                    </div>
                    <ul className="mt-4 mb-6 space-y-2 text-gray-300 text-sm">
                        <li className="flex items-center gap-2">
                            <span className="text-green-400">✔</span> Unlimited file translations
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-green-400">✔</span> Translation history
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-green-400">✔</span> Priority email support
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-green-400">✔</span> Early access to new features
                        </li>
                    </ul>
                </div>

                {/* Payment controls */}
                {loadingAuth || loadingSubs ? (
                    <div className="text-center text-gray-400">Loading...</div>
                ) : subscription?.status === 'active' ? (
                    <div className="text-center">
                        <div className="mb-4 text-green-400 font-semibold">
                            You have an active Pro subscription.
                        </div>
                        <button
                            className="w-full py-3 rounded-lg bg-[#8B5CF6] hover:bg-[#A78BFA] text-white font-semibold mb-3 transition"
                            onClick={handleManageBilling}
                            disabled={loading}
                        >
                            {loading ? 'Loading…' : 'Manage Billing'}
                        </button>
                        <Link
                            href="/translator"
                            className="block text-center text-[#A78BFA] underline mt-2"
                        >
                            Go to App →
                        </Link>
                    </div>
                ) : user ? (
                    <button
                        className="w-full py-3 rounded-lg bg-[#8B5CF6] hover:bg-[#A78BFA] text-white font-semibold mb-3 transition"
                        onClick={handleSubscribe}
                        disabled={loading}
                    >
                        {loading ? 'Redirecting…' : 'Subscribe to Pro'}
                    </button>
                ) : (
                    <Link href="/login">
                        <span className="w-full block py-3 rounded-lg bg-[#8B5CF6] text-white font-semibold text-center transition cursor-pointer hover:bg-[#A78BFA]">
                            Sign in to Subscribe
                        </span>
                    </Link>
                )}

                <div className="mt-6 text-xs text-gray-500 text-center">
                    By subscribing you agree to our{' '}
                    <Link href="/privacy" className="underline hover:text-[#A78BFA]">
                        Privacy Policy
                    </Link>
                    .
                </div>
            </div>
        </div>
    );
};

export default ProPage;
