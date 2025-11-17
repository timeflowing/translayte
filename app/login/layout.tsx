import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sign In',
    description:
        'Sign in to Phrasey to access your translation projects and manage your localization workflow.',
    openGraph: {
        title: 'Sign In - Phrasey',
        description: 'Sign in to Phrasey to access your translation projects.',
    },
    robots: {
        index: false,
        follow: true,
    },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return children;
}
