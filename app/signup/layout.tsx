import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sign Up',
    description:
        'Create your free Phrasey account and start translating JSON files instantly. No credit card required.',
    openGraph: {
        title: 'Sign Up - Phrasey',
        description: 'Create your free Phrasey account and start translating JSON files instantly.',
    },
    robots: {
        index: false,
        follow: true,
    },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
    return children;
}
