// app/(legal)/privacy/page.tsx — GDPR-compliant Privacy Policy
// ============================================================================
import LegalShell from '@/app/components/LegalShell';

export const metadata = { title: 'Privacy Policy' };

export default function Page() {
    return (
        <LegalShell
            title="Privacy Policy"
            subtitle="How we collect, use, and protect your data (GDPR-compliant)"
        >
            <p>
                This Privacy Policy explains how <strong>Vojtěch Tomášek</strong> (&quot;we&quot;,
                &quot;us&quot;) processes personal data when you use Translayte at{' '}
                <strong>https://translayte.it</strong>. We act as the{' '}
                <strong>data controller</strong> for personal data of users in the EU/EEA.
            </p>

            <h2>1. Data We Process</h2>
            <ul>
                <li>
                    <strong>Account data</strong>: email, name (if provided), authentication
                    identifiers.
                </li>
                <li>
                    <strong>Content data</strong>: texts/files you upload for translation (e.g.,
                    JSON).
                </li>
                <li>
                    <strong>Billing data</strong>: handled by Stripe; we do not store card numbers.
                </li>
                <li>
                    <strong>Technical data</strong>: IP address, device information, logs, cookies.
                </li>
            </ul>

            <h2>2. Purposes & Legal Bases (GDPR Art. 6)</h2>
            <ul>
                <li>
                    <strong>Provide the Service</strong> (account, translations, support) — Art.
                    6(1)(b) contract necessity.
                </li>
                <li>
                    <strong>Payments & Billing</strong> — Art. 6(1)(c) legal obligation and Art.
                    6(1)(b).
                </li>
                <li>
                    <strong>Security & Abuse Prevention</strong> — Art. 6(1)(f) legitimate
                    interests.
                </li>
                <li>
                    <strong>Analytics & Improvement</strong> — Art. 6(1)(a) consent (where
                    required).
                </li>
            </ul>

            <h2>3. Processors & Recipients</h2>
            <p>We share data with trusted processors solely to provide the Service:</p>
            <ul>
                <li>Stripe (payments and invoicing)</li>
                <li>AI API providers (e.g., OpenAI) to process translation prompts and files</li>
                <li>Hosting and infrastructure (e.g., Vercel, Firebase)</li>
                <li>Error monitoring / logs (e.g., Sentry, Logtail) — if used</li>
            </ul>

            <h2>4. International Transfers</h2>
            <p>
                Where data is transferred outside the EU/EEA, we use appropriate safeguards (e.g.,
                Standard Contractual Clauses) and conduct transfer risk assessments as required.
            </p>

            <h2>5. Retention</h2>
            <ul>
                <li>Billing/invoice data: 10 years or as required by law.</li>
                <li>
                    Uploaded content: deleted on request or no later than 30 days after upload by
                    default (configurable in your account if available).
                </li>
                <li>Technical logs: up to 12 months.</li>
            </ul>

            <h2>6. Security</h2>
            <p>
                We apply technical and organizational measures appropriate to risk, including
                encryption in transit, access controls, and least‑privilege policies. No method of
                transmission is 100% secure, but we strive to protect your data.
            </p>

            <h2>7. Your Rights (GDPR)</h2>
            <ul>
                <li>Access, rectification, erasure, restriction, portability, and objection.</li>
                <li>
                    You can withdraw consent at any time where processing relies on consent (e.g.,
                    analytics cookies).
                </li>
                <li>
                    To exercise rights, email{' '}
                    <a href="mailto:support@translayte.it">support@translayte.it</a>.
                </li>
                <li>You may lodge a complaint with your supervisory authority (in CZ: ÚOOÚ).</li>
            </ul>

            <h2>8. Children</h2>
            <p>
                The Service is not directed to children under 16. We do not knowingly process
                children’s data.
            </p>

            <h2>9. Cookies</h2>
            <p>
                We use essential, functional, and analytics cookies. See our{' '}
                <a href="/cookies">Cookie Policy</a> for details and consent options.
            </p>

            <h2>10. Contact</h2>
            <p>
                Data Controller: <strong>Vojtěch Tomášek</strong>,{' '}
                <strong>17.listopadu 7, Zábřeh</strong>. Email:{' '}
                <a href="mailto:support@translayte.it">support@translayte.it</a>.
            </p>
        </LegalShell>
    );
}
