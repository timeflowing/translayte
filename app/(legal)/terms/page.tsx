// ============================================================================
// app/(legal)/terms/page.tsx
// ============================================================================
import LegalShell from '@/app/components/LegalShell';

export const metadata = {
    title: 'Terms of Service',
};

export default function Page() {
    return (
        <LegalShell title="Terms of Service" subtitle="Contractual terms for using Translayte">
            <p>
                Translayte (the &quot;Service&quot;) is operated by <strong>Vojtěch Tomášek</strong>
                , Business ID <strong>08450897</strong>, registered at
                <strong> 17.listopadu 7, Zábřeh</strong>. Contact:{' '}
                <strong>support@translayte.it</strong>.
            </p>

            <h2>1. Acceptance of Terms</h2>
            <p>
                By creating an account, purchasing a plan, or using the Service, you agree to these
                Terms. If you do not agree, do not use the Service.
            </p>

            <h2>2. The Service</h2>
            <p>
                Translayte enables users to translate text and files (including JSON) via
                third‑party artificial intelligence APIs. Output quality may vary depending on
                input, model choice, and context.
            </p>

            <h2>3. Accounts & Security</h2>
            <ul>
                <li>You must provide accurate information and keep your credentials secure.</li>
                <li>You are responsible for all activity under your account.</li>
                <li>
                    We may suspend accounts involved in abuse, fraud, or violations of these Terms.
                </li>
            </ul>

            <h2>4. User Content</h2>
            <ul>
                <li>You retain ownership of content you submit to the Service.</li>
                <li>
                    You grant us a limited license to process your content solely to provide the
                    Service (including sending it to third‑party AI providers and storing it
                    temporarily for processing and quality assurance).
                </li>
                <li>
                    You are solely responsible for your content and must ensure you have all
                    necessary rights to use and upload it.
                </li>
                <li>
                    Prohibited content includes illegal materials, content that infringes
                    intellectual property, and content that violates privacy or other rights.
                </li>
            </ul>

            <h2>5. AI Outputs & No Professional Advice</h2>
            <p>
                AI‑generated outputs can contain errors, omissions, or biases. The Service is
                provided for informational purposes and is not a substitute for professional
                translation, legal, or other advice. You are responsible for verifying outputs
                before use.
            </p>

            <h2>6. Payments, Plans, and Taxes</h2>
            <ul>
                <li>
                    Paid features are billed via Stripe. Taxes are applied where required by law.
                </li>
                <li>
                    Subscriptions renew automatically unless cancelled. You can cancel at any time
                    in your account settings; access continues until the end of the billing period.
                </li>
                <li>
                    Prices and features may change. We will notify you of material changes in
                    advance where legally required.
                </li>
            </ul>

            <h2>7. Free Trials and Credits</h2>
            <p>
                Free trials or credits may be offered at our discretion and may be revoked in cases
                of abuse. Trials convert to paid plans unless cancelled before the end of the trial
                period.
            </p>

            <h2>8. Cancellations & Refunds</h2>
            <p>
                Consumers in the EU may withdraw within 14 days unless immediate access to digital
                content is provided with explicit consent, in which case the right of withdrawal is
                waived. See the
                <a href="/refunds"> Refund & Cancellation Policy</a> for details.
            </p>

            <h2>9. Intellectual Property</h2>
            <ul>
                <li>
                    We own all rights in the Service, including software, branding, and site
                    content, except for your content and third‑party materials.
                </li>
                <li>
                    Do not copy, modify, reverse engineer, or create derivative works from the
                    Service.
                </li>
            </ul>

            <h2>10. Third‑Party Services</h2>
            <p>
                The Service integrates with providers such as Stripe (payments), AI API vendors
                (e.g., OpenAI), and hosting (e.g., Vercel/Firebase). Your use may be subject to
                their terms and privacy policies.
            </p>

            <h2>11. Prohibited Use</h2>
            <ul>
                <li>Illegal, harmful, or abusive activities.</li>
                <li>Uploading malware or attempting to disrupt or probe the Service.</li>
                <li>Infringing intellectual property or violating privacy rights.</li>
            </ul>

            <h2>12. Warranty Disclaimer</h2>
            <p>
                THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTIES OF ANY KIND,
                WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING MERCHANTABILITY, FITNESS FOR A
                PARTICULAR PURPOSE, AND NON‑INFRINGEMENT.
            </p>

            <h2>13. Limitation of Liability</h2>
            <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, TRANS LAYTE AND ITS OPERATORS SHALL NOT BE
                LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR
                ANY LOSS OF PROFITS, REVENUE, DATA, OR GOODWILL. OUR AGGREGATE LIABILITY FOR ALL
                CLAIMS RELATING TO THE SERVICE SHALL NOT EXCEED THE AMOUNTS PAID BY YOU TO US IN THE
                3 MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM.
            </p>

            <h2>14. Indemnification</h2>
            <p>
                You will indemnify and hold us harmless from any claims, losses, and expenses
                (including attorneys’ fees) arising from or related to your use of the Service, your
                content, or your violation of these Terms.
            </p>

            <h2>15. Modifications and Termination</h2>
            <p>
                We may modify these Terms and the Service. If changes are material, we will provide
                notice as required by law. We may suspend or terminate your access for violations or
                risk.
            </p>

            <h2>16. Governing Law & Disputes</h2>
            <p>
                These Terms are governed by the laws of the Czech Republic, without regard to
                conflict of laws rules. Courts of the Czech Republic shall have exclusive
                jurisdiction.
            </p>

            <h2>17. Contact</h2>
            <p>
                Questions? Contact <a href="mailto:support@translayte.it">support@translayte.it</a>.
            </p>
        </LegalShell>
    );
}
