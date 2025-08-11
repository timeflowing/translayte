'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db as firestore } from '../lib/firebaseClient';
import SynapseAnimation from '../utils/SynapseAnimation';
import { useAuthState } from 'react-firebase-hooks/auth';

const BLANK_PROFILE: UserProfile = {
    firstName: '',
    lastName: '',
    email: '',
    photoURL: '',
    phone: '',
    plan: '',
    trialEndsAt: '',
    company: '',
    jobTitle: '',
    bio: '',
    country: '',
    state: '',
    city: '',
    zip: '',
    githubConnected: false,
    googleConnected: false,
    slackConnected: false,
    subscription: { status: null },
    keys_month: 0,
    chars_month: 0,
};
interface UserProfile {
    firstName: string;
    lastName: string;
    email: string;
    photoURL?: string;
    phone?: string;
    plan?: string;
    trialEndsAt?: string;
    company?: string;
    jobTitle?: string;
    bio?: string;
    country?: string;
    state?: string;
    city?: string;
    zip?: string;
    githubConnected?: boolean;
    googleConnected?: boolean;
    slackConnected?: boolean;
    subscription?: { status: string | null };
    keys_month?: number;
    chars_month?: number;
}
// -- Helper for days left, mock logic, update as needed --
function getTrialDaysLeft(trialEndsAt: string | null) {
    if (!trialEndsAt) return null;
    const end = new Date(trialEndsAt);
    const now = new Date();
    const diff = Math.max(Math.ceil((end.getTime() - now.getTime()) / 1000 / 60 / 60 / 24), 0);
    return diff;
}

const ProfilePage = () => {
    const [firebaseUser] = useAuthState(auth);
    const [profile, setProfile] = useState<UserProfile>(); // Profile from Firestore
    const [loading, setLoading] = useState(true);
    const [edit, setEdit] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    // Load firebase user and profile from Firestore
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async user => {
            // setFirebaseUser(user);
            setError('');
            setSuccess('');
            if (user) {
                const userRef = doc(firestore, 'users', user.uid);
                const snap = await getDoc(userRef);
                if (snap.exists()) {
                    setProfile(snap.data() as UserProfile);
                } else {
                    // Create with basic info if missing
                    const data = {
                        firstName: user.displayName?.split(' ')[0] || '',
                        lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                        email: user.email || '',
                        photoURL: user.photoURL || '',
                        phone: user.phoneNumber || '',
                        // plan, trialEndsAt, etc.
                        plan: 'trial',
                        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // trial for 7 days
                    };
                    await setDoc(userRef, data);
                    setProfile(data);
                }
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // Controlled fields (make editable)
    const [fields, setFields] = useState<UserProfile>(BLANK_PROFILE);

    useEffect(() => {
        if (profile) setFields(profile);
    }, [profile]);

    const handleField = (k: string, v: string) => setFields(f => ({ ...f, [k]: v }));

    // Save handler (profile to Firestore, displayName to Firebase)
    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            if (!firebaseUser) throw new Error('No user');
            // Save to Firestore
            const userRef = doc(firestore, 'users', firebaseUser.uid);
            await setDoc(userRef, fields, { merge: true });
            setProfile(fields);
            // Update Firebase Auth displayName/photo if changed
            const displayName = `${fields.firstName} ${fields.lastName}`.trim();
            if (firebaseUser.displayName !== displayName) {
                await updateProfile(firebaseUser, { displayName });
            }
            setSuccess('Profile updated!');
            setEdit(false);
        } catch {
            setError('Failed to update profile');
        } finally {
            setSaving(false);
        }
    }

    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#181428] text-white">
                Loading...
            </div>
        );

    if (!firebaseUser)
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#181428] text-white">
                Not logged in.
            </div>
        );

    // Demo plan/trial logic (customize for your actual backend/limits)
    const plan = profile?.plan || 'trial';
    const trialEndsAt = profile?.trialEndsAt || null;
    const trialDaysLeft = getTrialDaysLeft(trialEndsAt);

    // Limits (examples)
    const limits =
        plan === 'pro'
            ? { translations: 'Unlimited', api: 'Enabled', support: 'Priority' }
            : { translations: '69/month', api: 'Trial only', support: 'Standard' };

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-[#181428] to-[#101014]">
            <SynapseAnimation className="absolute inset-0 w-full h-full -z-10 pointer-events-none" />
            {/* Header Bar */}
            <header className="flex items-center justify-between px-8 py-4 bg-[#181428] border-b border-[#282443]">
                <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-[#A383F7]">Translayte</span>
                    <nav className="ml-6 flex gap-5">
                        <NavLink href="/dashboard">Dashboard</NavLink>
                        <NavLink href="/translations">Translations</NavLink>
                        <NavLink href="/profile" active>
                            Profile
                        </NavLink>
                        <NavLink href="/settings">Settings</NavLink>
                    </nav>
                </div>
                <div className="flex items-center gap-6">
                    <Image
                        src={firebaseUser.photoURL || '/avatar.svg'}
                        alt="User avatar"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full border-2 border-[#A383F7]"
                    />
                </div>
            </header>

            {/* Trial banner */}
            {plan === 'trial' && trialDaysLeft !== null && (
                <div className="w-full bg-[#A383F7] text-[#191627] px-8 py-2 text-center font-semibold text-sm flex items-center justify-center">
                    <span>
                        Your trial ends in {trialDaysLeft} day{trialDaysLeft === 1 ? '' : 's'}.
                        Upgrade now to get the most out of Translayte!
                    </span>
                    <button className="ml-3 px-3 py-1 rounded bg-white text-[#7b3aed] font-semibold text-xs">
                        Get Pro
                    </button>
                </div>
            )}

            {/* Profile Overview */}
            <div className="flex items-center gap-4 px-8 py-6 bg-transparent border-b border-[#282443]">
                <Image
                    src={firebaseUser.photoURL || '/avatar.svg'}
                    alt="User avatar"
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full border-4 border-[#A383F7]"
                />
                <div>
                    <div className="text-xl font-bold text-white">
                        {fields.firstName} {fields.lastName}
                    </div>
                    <div className="text-gray-400">{firebaseUser.email}</div>
                </div>
                <button
                    className="ml-auto px-4 py-2 rounded-lg bg-[#A383F7] text-white font-semibold hover:bg-[#8257E6] transition"
                    onClick={() => setEdit(e => !e)}
                >
                    {edit ? 'Cancel' : 'Edit Profile'}
                </button>
            </div>

            {/* Main Content */}
            <div className="flex flex-col md:flex-row gap-6 px-8 py-8 max-w-7xl mx-auto">
                {/* Left: Account Tabs & Info */}
                <div className="flex-1 min-w-[340px]">
                    {/* Tabs */}
                    <div className="flex gap-6 border-b border-[#282443] mb-8 text-gray-400 text-sm">
                        <Tab active>Account Information</Tab>
                        <Tab>Security</Tab>
                        <Tab>Billing</Tab>
                        <Tab>Notifications</Tab>
                        <Tab>Preferences</Tab>
                    </div>

                    {/* Info Form */}
                    <form className="flex flex-col gap-6" onSubmit={handleSave}>
                        {/* Personal */}
                        <SectionCard title="Personal Information">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="First Name"
                                    value={fields.firstName || ''}
                                    onChange={v => handleField('firstName', v)}
                                    editable={edit}
                                />
                                <Input
                                    label="Last Name"
                                    value={fields.lastName || ''}
                                    onChange={v => handleField('lastName', v)}
                                    editable={edit}
                                />
                                <Input
                                    label="Email Address"
                                    value={fields.email || ''}
                                    type="email"
                                    editable={false}
                                />
                                <Input
                                    label="Phone Number"
                                    value={fields.phone || ''}
                                    onChange={v => handleField('phone', v)}
                                    editable={edit}
                                />
                            </div>
                        </SectionCard>
                        {/* Professional */}
                        <SectionCard title="Professional Information">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Company"
                                    value={fields.company || ''}
                                    onChange={v => handleField('company', v)}
                                    editable={edit}
                                />
                                <Input
                                    label="Job Title"
                                    value={fields.jobTitle || ''}
                                    onChange={v => handleField('jobTitle', v)}
                                    editable={edit}
                                />
                            </div>
                            <div className="mt-2">
                                <Input
                                    label="Bio"
                                    value={fields.bio || ''}
                                    onChange={v => handleField('bio', v)}
                                    editable={edit}
                                    textarea
                                />
                            </div>
                        </SectionCard>
                        {/* Location */}
                        <SectionCard title="Location">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Country"
                                    value={fields.country || ''}
                                    onChange={v => handleField('country', v)}
                                    editable={edit}
                                />
                                <Input
                                    label="State/Province"
                                    value={fields.state || ''}
                                    onChange={v => handleField('state', v)}
                                    editable={edit}
                                />
                                <Input
                                    label="City"
                                    value={fields.city || ''}
                                    onChange={v => handleField('city', v)}
                                    editable={edit}
                                />
                                <Input
                                    label="Zip/Postal Code"
                                    value={fields.zip || ''}
                                    onChange={v => handleField('zip', v)}
                                    editable={edit}
                                />
                            </div>
                        </SectionCard>
                        {error && <div className="text-red-400">{error}</div>}
                        {success && <div className="text-green-400">{success}</div>}
                        {/* Save/Cancel */}
                        {edit && (
                            <div className="flex gap-3 justify-end mt-4">
                                <button
                                    type="button"
                                    className="px-4 py-2 rounded-lg bg-transparent border border-[#282443] text-gray-200"
                                    onClick={() => {
                                        setEdit(false);
                                        if (profile) setFields(profile);
                                        setError('');
                                        setSuccess('');
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 rounded-lg bg-[#A383F7] text-white font-semibold hover:bg-[#8257E6] transition"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
                {/* Right: Status & Connected */}
                <div className="w-full md:w-[340px] flex flex-col gap-6">
                    {/* Account Status */}
                    <SectionCard>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-bold text-sm">
                                {plan === 'pro' ? 'Pro Plan' : 'Trial Plan'}
                            </span>
                            {plan === 'trial' && (
                                <span className="text-xs text-gray-400">
                                    {trialDaysLeft} days remaining
                                </span>
                            )}
                            {plan === 'pro' && (
                                <span className="text-xs text-[#A383F7]">Active</span>
                            )}
                        </div>
                        <div className="text-xs text-gray-400 mb-4">
                            {plan === 'pro'
                                ? 'You are a Pro user. Enjoy unlimited features!'
                                : trialDaysLeft !== null
                                ? `Your trial ends in ${trialDaysLeft} day${
                                      trialDaysLeft === 1 ? '' : 's'
                                  }. Upgrade to Pro to continue using all features.`
                                : 'Start your free trial to explore all features.'}
                        </div>
                        {plan !== 'pro' && (
                            <button className="w-full px-4 py-2 rounded-lg bg-[#A383F7] text-white font-semibold hover:bg-[#8257E6] transition mb-2">
                                Upgrade to Pro
                            </button>
                        )}
                        <button className="w-full text-xs text-gray-400 underline">
                            View plan details
                        </button>
                        <div className="mt-4 text-xs text-gray-400">
                            <div>
                                <span className="font-semibold text-white">Translations:</span>{' '}
                                {limits.translations}
                            </div>
                            <div>
                                <span className="font-semibold text-white">API Access:</span>{' '}
                                {limits.api}
                            </div>
                            <div>
                                <span className="font-semibold text-white">Support:</span>{' '}
                                {limits.support}
                            </div>
                        </div>
                    </SectionCard>
                    {/* Connected Accounts */}
                    <SectionCard title="Connected Accounts">
                        <div className="flex flex-col gap-2">
                            <ConnectedAccount
                                provider="GitHub"
                                connected={!!profile?.githubConnected}
                            />
                            <ConnectedAccount
                                provider="Google"
                                connected={!!profile?.googleConnected}
                            />
                            <ConnectedAccount
                                provider="Slack"
                                connected={!!profile?.slackConnected}
                            />
                        </div>
                    </SectionCard>
                    {/* API Access */}
                    <SectionCard title="API Access">
                        <div className="text-xs text-gray-400 mb-3">
                            {plan === 'pro'
                                ? 'Your API key: (show real key here)'
                                : 'API access is only available for Pro users. Upgrade to generate your API key.'}
                        </div>
                        <button
                            className={`w-full px-4 py-2 rounded-lg ${
                                plan === 'pro'
                                    ? 'bg-[#A383F7] text-white'
                                    : 'bg-[#252141] text-gray-400 border border-[#282443] cursor-not-allowed'
                            }`}
                            disabled={plan !== 'pro'}
                        >
                            Generate API Key
                        </button>
                    </SectionCard>
                </div>
            </div>

            {/* Footer */}
            <footer className="px-8 py-4 text-xs text-[#A383F7] flex items-center justify-between border-t border-[#282443] bg-[#181428]">
                <span>© 2025 Translayte. All rights reserved.</span>
                <span className="text-gray-400">Contact: support@translayte.it</span>
            </footer>
        </div>
    );
};

// ---- UI Helper Components ----

function NavLink({
    href,
    active,
    children,
}: {
    href: string;
    active?: boolean;
    children: React.ReactNode;
}) {
    return (
        <a
            href={href}
            className={`px-2 py-1 rounded ${
                active ? 'text-white font-bold bg-[#282443]' : 'hover:text-white'
            }`}
        >
            {children}
        </a>
    );
}
function Tab({ active, children }: { active?: boolean; children: React.ReactNode }) {
    return (
        <button
            className={`px-2 py-2 -mb-px border-b-2 ${
                active
                    ? 'border-[#A383F7] text-[#A383F7] font-bold'
                    : 'border-transparent hover:text-[#A383F7]'
            } transition`}
        >
            {children}
        </button>
    );
}
function SectionCard({ title, children }: { title?: string; children: React.ReactNode }) {
    return (
        <section className="mb-8 bg-gradient-to-b from-[#221d37] to-[#191627] p-8 rounded-2xl shadow-2xl border border-[#282443] min-h-[200px]">
            {title && <div className="text-white font-semibold text-2xl mb-6">{title}</div>}
            {children}
        </section>
    );
}

function Input({
    label,
    value,
    type = 'text',
    textarea = false,
    editable = false,
    onChange,
}: {
    label: string;
    value: string;
    type?: string;
    textarea?: boolean;
    editable?: boolean;
    onChange?: (v: string) => void;
}) {
    return (
        <div>
            <label className="text-xs text-gray-400 block mb-1">{label}</label>
            {textarea ? (
                <textarea
                    value={value}
                    onChange={editable && onChange ? e => onChange(e.target.value) : undefined}
                    rows={2}
                    className={`w-full p-2 rounded bg-[#16131f] text-white border border-[#282443] text-sm ${
                        editable ? '' : 'opacity-75 cursor-not-allowed'
                    }`}
                    readOnly={!editable}
                />
            ) : (
                <input
                    value={value}
                    type={type}
                    onChange={editable && onChange ? e => onChange(e.target.value) : undefined}
                    className={`w-full p-2 rounded bg-[#16131f] text-white border border-[#282443] text-sm ${
                        editable ? '' : 'opacity-75 cursor-not-allowed'
                    }`}
                    readOnly={!editable}
                />
            )}
        </div>
    );
}
function ConnectedAccount({ provider, connected }: { provider: string; connected: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-white text-sm">{provider}</span>
            <span
                className={`text-xs rounded px-2 py-0.5 ${
                    connected ? 'bg-[#A383F7] text-white' : 'bg-[#282443] text-gray-400'
                }`}
            >
                {connected ? 'Connected' : 'Not Connected'}
            </span>
        </div>
    );
}

export default ProfilePage;
