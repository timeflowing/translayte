import Link from 'next/link';

export function LegalFooterLinks({ className = '' }: { className?: string }) {
    return (
        <nav className={`text-sm text-violet-600 ${className}`} aria-label="Legal">
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
                <li>
                    <Link className="transition-colors hover:text-violet-800" href="/terms">
                        Terms of Service
                    </Link>
                </li>
                <li>
                    <Link className="transition-colors hover:text-violet-800" href="/privacy">
                        Privacy Policy
                    </Link>
                </li>
                <li>
                    <Link className="transition-colors hover:text-violet-800" href="/cookies">
                        Cookie Policy
                    </Link>
                </li>
                <li>
                    <Link className="transition-colors hover:text-violet-800" href="/refunds">
                        Refund & Cancellation
                    </Link>
                </li>
            </ul>
        </nav>
    );
}
