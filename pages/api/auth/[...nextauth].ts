import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { Session, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import admin from 'firebase-admin';

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
                if (!credentials) {
                    throw new Error('Missing credentials');
                }

                const email = credentials.email.trim().toLowerCase();
                const password = credentials.password;

                // Replace with secure authentication logic
                const user = await authenticateUser(email, password);
                if (!user) {
                    throw new Error('Invalid email or password');
                }

                return { id: user.id, name: user.name, email: user.email };
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

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

// Updated authenticateUser function
async function authenticateUser(email: string, password: string) {
    try {
        const userRecord = await admin.auth().getUserByEmail(email);

        // Verify the password using a custom method or external service
        const isValidPassword = await verifyPassword(email, password);
        if (!isValidPassword) {
            throw new Error('Invalid email or password');
        }

        return { id: userRecord.uid, name: userRecord.displayName || email, email };
    } catch (error) {
        console.error('Authentication error:', error);
        throw new Error('Authentication failed');
    }
}

// Updated password verification logic
async function verifyPassword(email: string, password: string): Promise<boolean> {
    try {
        // Use Firebase Admin SDK to verify email and password
        const userRecord = await admin.auth().getUserByEmail(email);

        // Simulate password verification (Firebase Admin SDK does not directly verify passwords)
        // You may need to implement this using a custom solution or Firebase Authentication client SDK
        if (userRecord.email === email && password === 'expectedPassword') {
            return true;
        }

        return false;
    } catch (error) {
        console.error('Password verification failed:', error);
        return false;
    }
}
