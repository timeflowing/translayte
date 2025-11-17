import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Billing',
    description:
        'Manage your Phrasey subscription and billing. View your current plan, usage, and payment history.',
    openGraph: {
        title: 'Billing - Phrasey',
        description: 'Manage your Phrasey subscription and billing.',
        url: 'https://phrasey.io/billing',
    },
    alternates: {
        canonical: 'https://phrasey.io/billing',
    },
    robots: {
        index: false,
        follow: true,
    },
};

export default function BillingLayout({ children }: { children: React.ReactNode }) {
    return children;
}
