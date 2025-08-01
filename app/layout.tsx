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
    title: 'Translayte - Effortless Translation Tool',
    description:
        'Save time and reduce errors with our intuitive translation tool for React Native & beyond.',
    icons: {
        icon: [{ url: '/fav.svg', type: 'image/svg+xml' }],
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
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
