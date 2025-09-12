'use client';
import Link from 'next/link';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/app/lib/firebaseClient';

const NAV_LINKS = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Benefits', href: '#benefits' },
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
] as const;

const APP_LINKS = [
    { label: 'Projects', href: '/projects' },
    { label: 'Organizations', href: '/organizations' },
    { label: 'Profile', href: '/profile' },
];

const NavigationBar = ({
    mobileMenuOpen,
    setMobileMenuOpen,
}: {
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
}) => {
    const [user] = useAuthState(auth);

    return (
        <header className="fixed w-full z-50 bg-primary/80 backdrop-blur-md border-b border-gray-800">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div className="text-xl font-bold gradient-text">Phrasey</div>
                <nav className="hidden md:flex space-x-8">
                    {!user
                        ? NAV_LINKS.map(({ label, href }) => (
                              <a
                                  key={href}
                                  href={href}
                                  className="text-gray-300 hover:text-white transition-colors"
                              >
                                  {label}
                              </a>
                          ))
                        : APP_LINKS.map(({ label, href }) => (
                              <Link
                                  key={href}
                                  href={href}
                                  className="text-gray-300 hover:text-[#A78BFA] transition-colors"
                              >
                                  {label}
                              </Link>
                          ))}
                </nav>
                <div className="hidden md:flex items-center space-x-4">
                    {!user ? (
                        <>
                            <Link href="/login">
                                <span
                                    className="px-6 py-2 rounded-full border border-[#a78bfa] text-white font-medium hover:bg-[#a78bfa]/10 transition-colors cursor-pointer"
                                    role="button"
                                    tabIndex={0}
                                >
                                    Sign In
                                </span>
                            </Link>
                            <Link href="/signup">
                                <span
                                    className="px-6 py-2 rounded-full border border-[#8B5CF6] bg-[#8B5CF6]/80 text-white font-medium hover:bg-[#8B5CF6] hover:border-[#a78bfa] transition-colors cursor-pointer shadow-md"
                                    role="button"
                                    tabIndex={0}
                                    style={{
                                        boxShadow: '0 2px 16px 0 #8B5CF633',
                                        fontWeight: 600,
                                    }}
                                >
                                    Sign Up
                                </span>
                            </Link>
                        </>
                    ) : (
                        <>
                            <span className="text-gray-300">{user.email}</span>
                            <button
                                className="px-6 py-2 rounded-full border border-[#a78bfa] text-white font-medium hover:bg-[#a78bfa]/10 transition-colors cursor-pointer"
                                onClick={() => auth.signOut()}
                            >
                                Logout
                            </button>
                        </>
                    )}
                </div>
                <button
                    className="md:hidden text-white"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Open menu"
                >
                    <i className="fa-solid fa-bars text-xl" />
                </button>
            </div>
            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-[#18181b] border-t border-gray-800 px-4 py-6">
                    <nav className="flex flex-col space-y-4">
                        {NAV_LINKS.map(({ label, href }) => (
                            <a
                                key={href}
                                href={href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-gray-300 hover:text-white transition-colors text-lg"
                            >
                                {label}
                            </a>
                        ))}
                        {user &&
                            APP_LINKS.map(({ label, href }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className="text-gray-300 hover:text-[#A78BFA] transition-colors text-lg"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {label}
                                </Link>
                            ))}
                        {!user ? (
                            <Link
                                href="/login"
                                className="mt-4 px-6 py-2 rounded-full border border-[#a78bfa] text-white font-medium hover:bg-[#a78bfa]/10 text-center"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Sign In
                            </Link>
                        ) : (
                            <button
                                className="mt-4 px-6 py-2 rounded-full border border-[#a78bfa] text-white font-medium hover:bg-[#a78bfa]/10 text-center"
                                onClick={() => {
                                    auth.signOut();
                                    setMobileMenuOpen(false);
                                }}
                            >
                                Logout
                            </button>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
};

export default NavigationBar;
