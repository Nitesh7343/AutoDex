import { storage } from '@wxt-dev/storage';

export type Profile = {
  fullName: string; firstName: string; lastName: string; email: string; phone: string;
  address: string; city: string; state: string; postalCode: string; country: string;
  headline: string; summary: string; skills: string; education: string; experience: string;
  linkedin: string; github: string; leetcode: string; codeforces: string; portfolio: string;
  college: string; degree: string; course: string; branch: string; rollNumber: string;
  yearOfStudy: string; graduationYear: string; customLinks: CustomLink[];
};

export type CustomLink = { id: string; label: string; url: string };

export const emptyProfile: Profile = {
  fullName: '', firstName: '', lastName: '', email: '', phone: '', address: '', city: '',
  state: '', postalCode: '', country: '', headline: '', summary: '', skills: '',
  education: '', experience: '', linkedin: '', github: '', leetcode: '', codeforces: '', portfolio: '',
  college: '', degree: '', course: '', branch: '', rollNumber: '', yearOfStudy: '', graduationYear: '', customLinks: [],
};

export const profileStorage = storage.defineItem<Profile>('local:profile', {
  fallback: emptyProfile,
});

export function normalizeProfile(value: Partial<Profile> | null | undefined): Profile {
  return { ...emptyProfile, ...value, customLinks: Array.isArray(value?.customLinks) ? value.customLinks : [] };
}
