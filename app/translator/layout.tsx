import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Translator',
    description:
        'Translate your JSON files instantly with Phrasey. Upload, select target languages, and download translated files in seconds. Works with i18next, Next.js, React Native, and Vue i18n.',
    openGraph: {
        title: 'Translator - Phrasey',
        description:
            'Translate your JSON files instantly. Upload, select languages, and download in seconds.',
        url: 'https://phrasey.io/translator',
    },
    alternates: {
        canonical: 'https://phrasey.io/translator',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function TranslatorLayout({ children }: { children: React.ReactNode }) {
    return children;
}
