'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// Define interfaces for our data
interface Subscription {
    plan: string;
    status: string;
    nextBillingDate: string | null;
}

interface BillingItem {
    date: string;
    amount: string;
    status: string;
    invoiceUrl?: string;
}

const BillingPage: React.FC = () => {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [billingHistory, setBillingHistory] = useState<BillingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isManaging, setIsManaging] = useState(false);

    useEffect(() => {
        if (user) {
            const fetchBillingInfo = async () => {
                setLoading(true);
                setError(null);
                try {
                    const token = await user.getIdToken();
                    const response = await fetch('/api/billing', {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (!response.ok) {
                        throw new Error('Failed to fetch billing information.');
                    }

                    const data = await response.json();
                    setSubscription(data.subscription);
                    setBillingHistory(data.billingHistory);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'An unknown error occurred.');
                } finally {
                    setLoading(false);
                }
            };

            fetchBillingInfo();
        } else {
            // If there's no user, stop loading and show a message.
            setLoading(false);
        }
    }, [user]);

    const handleManageSubscription = async () => {
        if (!user) return;
        setIsManaging(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/billing/create-portal-session', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Could not create subscription management session.');
            }

            const { url } = await response.json();
            window.location.href = url;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setIsManaging(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-10">
                <h2 className="text-2xl font-semibold mb-4">Access Denied</h2>
                <p className="text-gray-600">Please log in to view your billing information.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10 text-red-500">
                <h2 className="text-2xl font-semibold mb-4">Error</h2>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Manage your subscription and view your payment history.
                </p>
            </div>

            <div className="space-y-8">
                {/* Subscription Section */}
                <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-gray-900">Current Subscription</h2>
                    {subscription ? (
                        <div className="mt-4 space-y-2">
                            <p className="text-gray-600">
                                <span className="font-medium text-gray-800">Plan:</span>{' '}
                                {subscription.plan}
                            </p>
                            <p className="text-gray-600">
                                <span className="font-medium text-gray-800">Status:</span>
                                <span
                                    className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        subscription.status === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}
                                >
                                    {subscription.status}
                                </span>
                            </p>
                            {subscription.nextBillingDate && (
                                <p className="text-gray-600">
                                    <span className="font-medium text-gray-800">
                                        Next billing date:
                                    </span>{' '}
                                    {subscription.nextBillingDate}
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="mt-4 text-gray-500">
                            You do not have an active subscription.
                        </p>
                    )}
                    <div className="mt-6">
                        <button
                            onClick={handleManageSubscription}
                            disabled={isManaging}
                            className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                        >
                            {isManaging ? 'Redirecting...' : 'Manage Subscription'}
                        </button>
                    </div>
                </div>

                {/* Billing History Section */}
                <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl">
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900">Billing History</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Date
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Amount
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Status
                                    </th>
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">Invoice</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {billingHistory.length > 0 ? (
                                    billingHistory.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.date}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                {item.amount}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        item.status.toLowerCase() === 'paid'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {item.invoiceUrl && (
                                                    <a
                                                        href={item.invoiceUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        View Invoice
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-6 py-10 text-center text-sm text-gray-500"
                                        >
                                            No billing history found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillingPage;
