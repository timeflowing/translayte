'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/app/firebaseClient';
import GoogleLoginButton, { signInWithGoogle } from '../utils/signInWithGoogle';
import GitHubLoginButton from '../utils/singInWithGithub';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/dashboard');
        } catch (err: any) {
            console.error(err);
            setError('Login failed. Please check your email and password.');
        }
    };

    return (
        <section style={styles.container}>
            <div style={styles.formContainer}>
                <h2 style={styles.heading}>Log In to Your Account</h2>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formGroup}>
                        <label htmlFor="email" style={styles.label}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="your.email@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            style={styles.input}
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label htmlFor="password" style={styles.label}>
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            style={styles.input}
                        />
                    </div>
                    {error && <p style={styles.error}>{error}</p>}
                    <button type="submit" style={styles.btnPrimary}>
                        Log In
                    </button>
                </form>
                <GoogleLoginButton />
                <GitHubLoginButton />
                <p style={styles.signupLink}>
                    Don&apos;t have an account?{' '}
                    <Link href="/signup">
                        <span style={styles.link}>Sign Up</span>
                    </Link>
                </p>
            </div>
        </section>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        padding: '60px 20px',
        backgroundColor: '#fff',
        textAlign: 'center',
    },
    formContainer: {
        maxWidth: '400px',
        margin: '0 auto',
        padding: '40px',
        border: '1px solid #eaeaea',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
    },
    heading: {
        fontSize: '2rem',
        marginBottom: '30px',
        color: '#333',
    },
    form: {
        textAlign: 'left',
    },
    formGroup: {
        marginBottom: '20px',
    },
    label: {
        display: 'block',
        marginBottom: '5px',
        color: '#555',
    },
    input: {
        width: '100%',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
    },
    btnPrimary: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#007BFF',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    signupLink: {
        marginTop: '20px',
        color: '#555',
    },
    link: {
        color: '#007BFF',
        textDecoration: 'none',
    },
    error: {
        color: 'red',
        marginBottom: '10px',
    },
};

export default LoginPage;
