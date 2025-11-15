'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const router = useRouter();

    useEffect(() => {
        router.push('/billing');
    }, [router]);

    return null;
}

// // --- Interfaces ---
// interface UserProfile {
//     firstName: string;
//     lastName: string;
//     email: string;
//     photoURL?: string;
//     plan?: 'trial' | 'pro';
//     trialEndsAt?: string;
// }

// // --- Main Page Component ---
// export default function ProfilePage() {
//     const [firebaseUser, loadingAuth] = useAuthState(auth);
//     const [profile, setProfile] = useState<UserProfile | null>(null);
//     const [pageState, setPageState] = useState<'loading' | 'loaded' | 'error'>('loading');
//     const [editMode, setEditMode] = useState(false);
//     const [saving, setSaving] = useState(false);
//     const [activeTab, setActiveTab] = useState('Account');
//     const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
//     const photoUploadRef = useRef<HTMLInputElement>(null);

//     // --- Data Fetching and State Sync ---
//     useEffect(() => {
//         const loadProfile = async () => {
//             if (firebaseUser) {
//                 try {
//                     const userRef = doc(firestore, 'users', firebaseUser.uid);
//                     const snap = await getDoc(userRef);
//                     if (snap.exists()) {
//                         setProfile(snap.data() as UserProfile);
//                     } else {
//                         // Create a new profile for a new user
//                         const newUserProfile: UserProfile = {
//                             firstName: firebaseUser.displayName?.split(' ')[0] || '',
//                             lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
//                             email: firebaseUser.email || '',
//                             photoURL: firebaseUser.photoURL || '',
//                             plan: 'trial',
//                             trialEndsAt: new Date(
//                                 Date.now() + 14 * 24 * 60 * 60 * 1000,
//                             ).toISOString(),
//                         };
//                         await setDoc(userRef, newUserProfile);
//                         setProfile(newUserProfile);
//                     }
//                     setPageState('loaded');
//                 } catch (error) {
//                     console.error('Failed to load profile:', error);
//                     setPageState('error');
//                 }
//             } else if (!loadingAuth) {
//                 setPageState('error'); // No user found
//             }
//         };
//         loadProfile();
//     }, [firebaseUser, loadingAuth]);

//     // --- Handlers ---
//     const showToast = (type: 'success' | 'error', message: string) => {
//         setToast({ type, message });
//         setTimeout(() => setToast(null), 4000);
//     };

//     const handleSave = async (updatedFields: UserProfile) => {
//         if (!firebaseUser) return;
//         setSaving(true);
//         try {
//             const userRef = doc(firestore, 'users', firebaseUser.uid);
//             await setDoc(userRef, updatedFields, { merge: true });

//             const displayName = `${updatedFields.firstName} ${updatedFields.lastName}`.trim();
//             if (
//                 firebaseUser.displayName !== displayName ||
//                 firebaseUser.photoURL !== updatedFields.photoURL
//             ) {
//                 await updateProfile(firebaseUser, {
//                     displayName,
//                     photoURL: updatedFields.photoURL,
//                 });
//             }

//             setProfile(updatedFields);
//             setEditMode(false);
//             showToast('success', 'Profile updated successfully!');
//         } catch (err) {
//             showToast('error', 'Failed to update profile.');
//             console.error(err);
//         } finally {
//             setSaving(false);
//         }
//     };

//     const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//         if (!e.target.files || !firebaseUser || !profile) return;
//         const file = e.target.files[0];
//         if (file.size > 2 * 1024 * 1024) {
//             // 2MB limit
//             showToast('error', 'Image file must be under 2MB.');
//             return;
//         }
//         setSaving(true);
//         try {
//             const storage = getStorage();
//             const storageRef = ref(storage, `avatars/${firebaseUser.uid}/${file.name}`);
//             const snapshot = await uploadBytes(storageRef, file);
//             const photoURL = await getDownloadURL(snapshot.ref);

//             const updatedProfile = { ...profile, photoURL };
//             await handleSave(updatedProfile);
//             showToast('success', 'Profile picture updated!');
//         } catch (error) {
//             showToast('error', 'Failed to upload photo.');
//             console.error(error);
//         } finally {
//             setSaving(false);
//         }
//     };

//     // --- Render Logic ---
//     if (pageState === 'loading') {
//         return (
//             <div className="min-h-screen flex items-center justify-center bg-[#101014]">
//                 Loading...
//             </div>
//         );
//     }
//     if (pageState === 'error' || !firebaseUser || !profile) {
//         return (
//             <div className="min-h-screen flex items-center justify-center bg-[#101014]">
//                 Could not load profile. Please try again.
//             </div>
//         );
//     }

//     return (
//         <div className="relative min-h-screen bg-gradient-to-br from-[#181428] to-[#101014] text-gray-200">
//             <SynapseAnimation className="absolute inset-0 w-full h-full -z-10 pointer-events-none" />
//             <ToastNotification toast={toast} />
//             <input
//                 type="file"
//                 accept="image/png, image/jpeg"
//                 ref={photoUploadRef}
//                 onChange={handlePhotoUpload}
//                 hidden
//             />

//             <AppHeader photoURL={firebaseUser.photoURL} />
//             <TrialBanner profile={profile} />

//             <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//                 <ProfileHeader
//                     profile={profile}
//                     editMode={editMode}
//                     onEditToggle={() => setEditMode(!editMode)}
//                     onPhotoClick={() => photoUploadRef.current?.click()}
//                     saving={saving}
//                 />

//                 <div className="mt-8 flex flex-col md:flex-row gap-8">
//                     {/* Left Column: Form and Tabs */}
//                     <div className="flex-1">
//                         <div className="border-b border-[#282443] mb-6">
//                             <nav className="-mb-px flex space-x-6" aria-label="Tabs">
//                                 {['Account', 'Security', 'Billing', 'Notifications'].map(tab => (
//                                     <button
//                                         key={tab}
//                                         onClick={() => setActiveTab(tab)}
//                                         className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
//                                             activeTab === tab
//                                                 ? 'border-[#A383F7] text-[#A383F7]'
//                                                 : 'border-transparent text-gray-400 hover:text-white'
//                                         }`}
//                                     >
//                                         {tab}
//                                     </button>
//                                 ))}
//                             </nav>
//                         </div>

//                         {activeTab === 'Account' && (
//                             <ProfileForm
//                                 profile={profile}
//                                 onSave={handleSave}
//                                 onCancel={() => setEditMode(false)}
//                                 editMode={editMode}
//                                 saving={saving}
//                             />
//                         )}
//                         {activeTab === 'Security' && (
//                             <PlaceholderCard
//                                 title="Security Settings"
//                                 message="Manage your password, two-factor authentication, and active sessions."
//                             />
//                         )}
//                         {activeTab === 'Billing' && (
//                             <PlaceholderCard
//                                 title="Billing Information"
//                                 message="View your invoices, manage payment methods, and see your subscription details."
//                             />
//                         )}
//                         {activeTab === 'Notifications' && (
//                             <PlaceholderCard
//                                 title="Notification Preferences"
//                                 message="Choose how you want to be notified about project updates and account activity."
//                             />
//                         )}
//                     </div>

//                     {/* Right Column: Plan */}
//                     <div className="w-full md:w-80 lg:w-96 flex flex-col gap-8">
//                         <PlanCard profile={profile} />
//                     </div>
//                 </div>
//             </main>
//         </div>
//     );
// }

// // --- Sub-Components ---

// const AppHeader = ({ photoURL }: { photoURL: string | null }) => (
//     <header className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 bg-[#181428]/50 backdrop-blur-sm border-b border-[#282443] sticky top-0 z-20">
//         <div className="flex items-center gap-4">
//             <Link href="/dashboard" className="text-lg font-bold text-[#A383F7]">
//                 Phrasey
//             </Link>
//             <nav className="hidden md:flex items-center gap-4 ml-6">
//                 <NavLink href="/dashboard">Dashboard</NavLink>
//                 <NavLink href="/share/default">Translations</NavLink>
//                 <NavLink href="/profile" active>
//                     Profile
//                 </NavLink>
//             </nav>
//         </div>
//         <Image
//             src={photoURL || '/avatar.svg'}
//             alt="User avatar"
//             width={32}
//             height={32}
//             className="w-8 h-8 rounded-full"
//         />
//     </header>
// );

// const TrialBanner = ({ profile }: { profile: UserProfile }) => {
//     if (profile.plan !== 'trial' || !profile.trialEndsAt) return null;
//     const daysLeft = Math.max(
//         Math.ceil((new Date(profile.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
//         0,
//     );
//     if (daysLeft === 0) return null;

//     return (
//         <div className="w-full bg-[#A383F7] text-[#191627] px-4 py-2 text-center font-semibold text-sm">
//             Your trial ends in {daysLeft} day{daysLeft !== 1 ? 's' : ''}.{' '}
//             <button className="ml-2 px-3 py-1 rounded bg-white text-[#7b3aed] font-semibold text-xs hover:bg-opacity-90 transition">
//                 Upgrade to Pro
//             </button>
//         </div>
//     );
// };

// const ProfileHeader = ({
//     profile,
//     editMode,
//     onEditToggle,
//     onPhotoClick,
//     saving,
// }: {
//     profile: UserProfile;
//     editMode: boolean;
//     onEditToggle: () => void;
//     onPhotoClick: () => void;
//     saving: boolean;
// }) => (
//     <div className="flex flex-col sm:flex-row items-center gap-6">
//         <div className="relative group">
//             <Image
//                 src={profile.photoURL || '/avatar.svg'}
//                 alt="User avatar"
//                 width={80}
//                 height={80}
//                 className="w-20 h-20 rounded-full border-4 border-[#282443] transition-all group-hover:border-[#A383F7]"
//             />
//             <button
//                 onClick={onPhotoClick}
//                 className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
//                 aria-label="Change profile picture"
//             >
//                 {saving ? (
//                     <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                 ) : (
//                     <Camera className="w-6 h-6 text-white" />
//                 )}
//             </button>
//         </div>
//         <div className="text-center sm:text-left">
//             <h1 className="text-2xl font-bold text-white">
//                 {profile.firstName} {profile.lastName}
//             </h1>
//             <p className="text-gray-400">{profile.email}</p>
//         </div>
//         <button
//             onClick={onEditToggle}
//             className="ml-auto mt-4 sm:mt-0 px-4 py-2 rounded-lg bg-[#A383F7] text-white font-semibold hover:bg-[#8257E6] transition-transform hover:scale-105"
//         >
//             {editMode ? 'Cancel' : 'Edit Profile'}
//         </button>
//     </div>
// );

// const ProfileForm = ({
//     profile,
//     onSave,
//     onCancel,
//     editMode,
//     saving,
// }: {
//     profile: UserProfile;
//     onSave: (p: UserProfile) => void;
//     onCancel: () => void;
//     editMode: boolean;
//     saving: boolean;
// }) => {
//     const [fields, setFields] = useState(profile);
//     useEffect(() => setFields(profile), [profile]);

//     const handleField = (k: keyof UserProfile, v: string) => setFields(f => ({ ...f, [k]: v }));
//     const handleSubmit = (e: React.FormEvent) => {
//         e.preventDefault();
//         onSave(fields);
//     };

//     return (
//         <form onSubmit={handleSubmit} className="space-y-8">
//             <SectionCard title="Personal Information">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <Input
//                         label="First Name"
//                         value={fields.firstName}
//                         onChange={v => handleField('firstName', v)}
//                         editable={editMode}
//                     />
//                     <Input
//                         label="Last Name"
//                         value={fields.lastName}
//                         onChange={v => handleField('lastName', v)}
//                         editable={editMode}
//                     />
//                     <Input label="Email Address" value={fields.email} editable={false} />
//                 </div>
//             </SectionCard>
//             {editMode && (
//                 <div className="flex gap-3 justify-end">
//                     <button
//                         type="button"
//                         onClick={onCancel}
//                         className="px-4 py-2 rounded-lg bg-transparent border border-[#282443] text-gray-200 hover:bg-[#282443] transition"
//                     >
//                         Cancel
//                     </button>
//                     <button
//                         type="submit"
//                         disabled={saving}
//                         className="px-4 py-2 rounded-lg bg-[#A383F7] text-white font-semibold hover:bg-[#8257E6] transition flex items-center justify-center min-w-[120px]"
//                     >
//                         {saving ? (
//                             <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                         ) : (
//                             'Save Changes'
//                         )}
//                     </button>
//                 </div>
//             )}
//         </form>
//     );
// };

// const PlanCard = ({ profile }: { profile: UserProfile }) => (
//     <SectionCard>
//         <div className="flex items-center justify-between mb-2">
//             <span className="text-white font-bold text-lg capitalize">{profile.plan} Plan</span>
//         </div>
//         <p className="text-sm text-gray-400 mb-4">
//             {profile.plan === 'pro'
//                 ? 'You have access to all Pro features.'
//                 : 'Upgrade to unlock unlimited translations.'}
//         </p>
//         <button className="w-full px-4 py-2 rounded-lg bg-[#A383F7] text-white font-semibold hover:bg-[#8257E6] transition">
//             {profile.plan === 'pro' ? 'Manage Subscription' : 'Upgrade to Pro'}
//         </button>
//     </SectionCard>
// );

// const PlaceholderCard = ({ title, message }: { title: string; message: string }) => (
//     <SectionCard>
//         <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
//         <p className="text-gray-400">{message}</p>
//     </SectionCard>
// );

// // --- UI Helper Components ---
// const NavLink = ({
//     href,
//     active,
//     children,
// }: {
//     href: string;
//     active?: boolean;
//     children: React.ReactNode;
// }) => (
//     <Link
//         href={href}
//         className={`px-2 py-1 rounded text-sm transition-colors ${
//             active ? 'text-white font-semibold bg-[#282443]' : 'text-gray-400 hover:text-white'
//         }`}
//     >
//         {children}
//     </Link>
// );

// const SectionCard = ({ title, children }: { title?: string; children: React.ReactNode }) => (
//     <section className="bg-[#191627]/80 p-6 rounded-xl border border-[#282443]">
//         {title && <h2 className="text-white font-semibold text-lg mb-4">{title}</h2>}
//         {children}
//     </section>
// );

// const Input = ({
//     label,
//     value,
//     textarea = false,
//     editable = false,
//     onChange,
// }: {
//     label: string;
//     value: string;
//     textarea?: boolean;
//     editable?: boolean;
//     onChange?: (v: string) => void;
// }) => (
//     <div>
//         <label className="text-xs text-gray-400 block mb-1.5">{label}</label>
//         {textarea ? (
//             <textarea
//                 value={value}
//                 onChange={e => onChange?.(e.target.value)}
//                 rows={3}
//                 className={`w-full p-2 rounded-md bg-[#101014] text-white border border-[#282443] text-sm transition-all ${
//                     editable
//                         ? 'focus:border-[#A383F7] focus:ring-2 focus:ring-[#A383F7]/50'
//                         : 'opacity-70 cursor-not-allowed'
//                 }`}
//                 readOnly={!editable}
//             />
//         ) : (
//             <input
//                 value={value}
//                 type="text"
//                 onChange={e => onChange?.(e.target.value)}
//                 className={`w-full p-2 rounded-md bg-[#101014] text-white border border-[#282443] text-sm transition-all ${
//                     editable
//                         ? 'focus:border-[#A383F7] focus:ring-2 focus:ring-[#A383F7]/50'
//                         : 'opacity-70 cursor-not-allowed'
//                 }`}
//                 readOnly={!editable}
//             />
//         )}
//     </div>
// );

// const ToastNotification = ({
//     toast,
// }: {
//     toast: { type: 'success' | 'error'; message: string } | null;
// }) => {
//     if (!toast) return null;
//     const isSuccess = toast.type === 'success';
//     return (
//         <div
//             className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-toast-in-out ${
//                 isSuccess ? 'bg-green-600/90' : 'bg-red-600/90'
//             } backdrop-blur-sm border ${isSuccess ? 'border-green-500' : 'border-red-500'}`}
//         >
//             {isSuccess ? (
//                 <CheckCircle className="w-5 h-5 text-white" />
//             ) : (
//                 <XCircle className="w-5 h-5 text-white" />
//             )}
//             <span className="text-sm font-medium text-white">{toast.message}</span>
//         </div>
//     );
// };
