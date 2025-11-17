import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://phrasey.io'; // Replace with your actual domain

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/admin/',
                    '/_next/',
                    '/profile/',
                    '/history/',
                    '/projects/',
                    '/organizations/',
                ],
            },
            {
                userAgent: 'GPTBot',
                disallow: ['/'],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
