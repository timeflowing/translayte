// ============================================================================
// app/(legal)/refunds/page.tsx — Refund & Cancellation Policy (EU‑ready)
// ============================================================================
import LegalShell from '@/app/components/LegalShell';

export const metadata = { title: 'Refund & Cancellation' };

export default function Page() {
    return (
        <LegalShell
            title="Refund & Cancellation Policy"
            subtitle="Your rights to cancel, withdraw, and request refunds"
        >
            <h2>1. Scope</h2>
            <p>
                This policy applies to purchases made directly from Phrasey. If you purchased via a
                third party, their terms apply.
            </p>

            <h2>2. EU Right of Withdrawal (Consumers)</h2>
            <p>
                Under EU law, consumers have a 14‑day right to withdraw from a distance purchase.
                For digital content provided immediately upon purchase, this right is waived once
                you provide explicit consent to immediate delivery and acknowledge the loss of the
                right to withdraw.
            </p>

            <h2>3. Subscriptions</h2>
            <ul>
                <li>
                    Subscriptions renew automatically unless cancelled. You can cancel any time from
                    your account. Access continues until the end of the current billing period.
                </li>
                <li>
                    Prepaid fees are non‑refundable unless required by law or stated otherwise here.
                </li>
            </ul>

            <h2>4. Refunds</h2>
            <ul>
                <li>
                    If paid features are unavailable due to our fault and cannot be restored within
                    a reasonable time, you may request a pro‑rated refund for the affected period.
                </li>
                <li>Refunds are processed via Stripe to the original payment method.</li>
            </ul>

            <h2>5. Misuse and Fraud</h2>
            <p>
                We may deny refunds in cases of abuse (e.g., excessive usage followed by immediate
                refund requests) or violation of the Terms of Service.
            </p>

            <h2>6. How to Cancel or Request a Refund</h2>
            <p>
                Email <a href="mailto:support@translayte.it">support@translayte.it</a> from your
                account email. Include your invoice ID and a brief description.
            </p>

            <h2>7. Contact</h2>
            <p>
                Operator: <strong>Vojtěch Tomášek</strong> —{' '}
                <a href="mailto:support@translayte.it">support@translayte.it</a>
            </p>
        </LegalShell>
    );
}
