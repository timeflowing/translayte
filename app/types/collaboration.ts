export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  teamId?: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  sourceLanguage: string;
  targetLanguages: string[];
  translations: Record<string, Record<string, string>>; // key -> {lang: translation}
  savedVersions?: SavedVersion[];
}

export interface SavedVersion {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  createdBy: string;
  translations: Record<string, Record<string, string>>;
  isPublished: boolean;
}

export interface ProjectShare {
  id: string;
  projectId: string;
  shareToken: string;
  permissions: 'view' | 'edit';
  expiresAt?: string;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

export interface ProjectCollaborator {
  id: string;
  projectId: string;
  userId: string;
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  invitedBy: string;
  invitedAt: string;
  acceptedAt?: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt: string;
  settings: {
    maxMembers: number;
    maxProjects: number;
    features: string[];
  };
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  invitedBy: string;
  invitedAt: string;
  acceptedAt?: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface EditLock {
  id: string;
  projectId: string;
  translationKey: string;
  userId: string;
  userEmail: string;
  lockedAt: string;
  expiresAt: string;
}

export interface User {
  uid: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  plan: 'trial' | 'pro' | 'enterprise';
  trialEndsAt: string;
  keys_month: number;
  subscription: { status: string | null };
  currentTeamId?: string; // User's active team
}

export const TEAM_PLANS = {
  free: {
    name: 'Free',
    maxMembers: 3,
    maxProjects: 5,
    features: ['Basic collaboration', 'Up to 3 members', '5 projects max'],
    price: 0
  },
  pro: {
    name: 'Pro',
    maxMembers: 15,
    maxProjects: 50,
    features: ['Advanced collaboration', 'Up to 15 members', '50 projects', 'Version history', 'Priority support'],
    price: 29
  },
  enterprise: {
    name: 'Enterprise',
    maxMembers: -1, // unlimited
    maxProjects: -1, // unlimited
    features: ['Unlimited members', 'Unlimited projects', 'Advanced permissions', 'SSO', 'Dedicated support'],
    price: 99
  }
};