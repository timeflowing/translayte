import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: {
        default: 'Legal | Phrasey',
        template: '%s | Phrasey',
    },
    description:
        'Official legal documents for Phrasey, including Terms of Service, Privacy Policy, Cookie Policy, and Refund & Cancellation Policy.',
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
    return children;
}
