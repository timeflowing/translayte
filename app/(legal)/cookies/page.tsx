// ============================================================================
// app/(legal)/cookies/page.tsx — Cookie Policy
// ============================================================================
import LegalShell from '@/app/components/LegalShell';

export const metadata = { title: 'Cookie Policy' };

export default function Page() {
    return (
        <LegalShell
            title="Cookie Policy"
            subtitle="Your choices about cookies and similar technologies"
        >
            <p>
                This Cookie Policy explains how Translayte uses cookies and similar technologies on
                <strong> https://translayte.it</strong>.
            </p>

            <h2>1. What Are Cookies?</h2>
            <p>
                Cookies are small text files stored on your device by your browser. They help
                websites work and provide analytics and personalization.
            </p>

            <h2>2. Types of Cookies We Use</h2>
            <ul>
                <li>
                    <strong>Essential</strong> — required for core functionality (authentication,
                    security).
                </li>
                <li>
                    <strong>Functional</strong> — remember preferences (language, view options).
                </li>
                <li>
                    <strong>Analytics</strong> — help us understand usage and improve the Service
                    (e.g., Google Analytics). These load only with your consent where required.
                </li>
            </ul>

            <h2>3. Managing Cookies</h2>
            <ul>
                <li>
                    You can manage preferences via our cookie banner and in browser settings (block,
                    delete).
                </li>
                <li>Disabling essential cookies may break core functionality.</li>
            </ul>

            <h2>4. Changes</h2>
            <p>We may update this policy. Material changes will be signposted on this page.</p>

            <h2>5. Contact</h2>
            <p>
                Questions? <a href="mailto:support@translayte.it">support@translayte.it</a>
            </p>
        </LegalShell>
    );
}
