import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { Session, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';

// Ensure session.user is defined
export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials: Record<string, string> | undefined) {
                // Replace this with your own authentication logic
                const user = { id: '1', name: 'User', email: credentials?.email };
                if (user) {
                    return user;
                } else {
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async session({ session, token }: { session: Session; token: JWT }) {
            if (session.user) {
                (session.user as { id?: string }).id = token.id as string;
            }
            return session;
        },
        async jwt({ token, user }: { token: JWT; user?: User }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
