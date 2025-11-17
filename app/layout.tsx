import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import './translayte.css';
import { AuthProvider } from './context/AuthContext';

const geistSans = localFont({
    src: './fonts/GeistVF.woff',
    variable: '--font-geist-sans',
    weight: '100 900',
});
const geistMono = localFont({
    src: './fonts/GeistMonoVF.woff',
    variable: '--font-geist-mono',
    weight: '100 900',
});

export const metadata: Metadata = {
    title: {
        default: 'Phrasey - Instant JSON Translation Tool for Developers',
        template: '%s | Phrasey',
    },
    description:
        'Translate JSON files instantly with AI-powered localization. Support for 13+ languages, i18next, Next.js, React Native, Vue i18n. No setup, no API keys required.',
    keywords: [
        'json translation',
        'json translator',
        'i18n translation',
        'localization tool',
        'translate json files',
        'react native translation',
        'next.js translation',
        'vue i18n',
        'translation automation',
        'i18next translator',
        'json localization',
        'multilingual json',
        'developer translation tool',
        'app localization',
        'json file translator',
    ],
    authors: [{ name: 'Phrasey', url: 'https://phrasey.io' }],
    creator: 'Phrasey',
    publisher: 'Phrasey',
    applicationName: 'Phrasey',
    category: 'Developer Tools',
    classification: 'Translation & Localization',
    icons: {
        icon: [{ url: '/fav.svg', type: 'image/svg+xml' }],
        apple: [{ url: '/fav.svg', type: 'image/svg+xml' }],
    },
    manifest: '/manifest.json',
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://phrasey.io',
        title: 'Phrasey - Instant JSON Translation Tool for Developers',
        description:
            'Translate JSON files instantly with AI-powered localization. Support for 13+ languages, i18next, Next.js, React Native, Vue i18n.',
        siteName: 'Phrasey',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Phrasey - Instant JSON Translation Tool',
                type: 'image/png',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Phrasey - Instant JSON Translation Tool for Developers',
        description:
            'Translate JSON files instantly with AI-powered localization. Support for 13+ languages.',
        images: ['/og-image.png'],
        creator: '@phrasey',
        site: '@phrasey',
    },
    robots: {
        index: true,
        follow: true,
        nocache: false,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    alternates: {
        canonical: 'https://phrasey.io',
    },
    metadataBase: new URL('https://phrasey.io'),
    verification: {
        google: 'your-google-verification-code',
        // yandex: 'your-yandex-verification-code',
        // bing: 'your-bing-verification-code',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <AuthProvider>
                    <div className="flex flex-col min-h-screen">
                        <main className="flex-grow">{children}</main>
                    </div>
                </AuthProvider>
            </body>
        </html>
    );
}
