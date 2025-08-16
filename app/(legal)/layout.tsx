import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: {
        default: 'Legal | Translayte',
        template: '%s | Translayte',
    },
    description:
        'Official legal documents for Translayte, including Terms of Service, Privacy Policy, Cookie Policy, and Refund & Cancellation Policy.',
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
    return children;
}
