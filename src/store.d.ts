interface CareerMatchJob {
  id: number;
  company: string;
  title: string;
  location: string;
  type: string;
  salary: string;
  match: number;
  deadline: string;
  tags: string[];
  description: string;
  requirements: string;
  benefits: string;
  posted: string;
}

interface CareerMatchApplication {
  id: string;
  jobId: number;
  status: string;
  appliedDate: string;
  note: string;
}

interface CareerMatchCandidate {
  id: string;
  jobId: string;
  name: string;
  university: string;
  match: number;
  status: string;
  appliedDate: string;
}

interface CareerMatchStore {
  getJobs: () => CareerMatchJob[];
  getJob: (id: string | number) => CareerMatchJob | null;
  getSaved: () => number[];
  toggleSave: (id: string | number) => boolean;
  isSaved: (id: string | number) => boolean;
  getApps: () => CareerMatchApplication[];
  getApplications?: () => CareerMatchApplication[];
  getApp: (id: string | number) => CareerMatchApplication | null;
  apply: (id: string | number, note?: string) => boolean;
  getProfile: () => Record<string, unknown>;
  getPostedJobs?: () => Array<Record<string, unknown>>;
  saveProfile: (profile: Record<string, FormDataEntryValue | string>) => void;
  addPostedJob: (job: Record<string, string | number>) => void;
  getCandidates: (jobId?: string) => CareerMatchCandidate[];
  getEmployer?: () => Record<string, unknown>;
  statusLabel?: (status: string) => string;
  statusColor?: (status: string) => string;
  updateCandidateStatus: (id: string, status: string) => void;
  getPostedJobs?: () => Array<Record<string, unknown>>;
}

declare global {
  interface Window {
    VL?: CareerMatchStore;
    __vlSpecControlsInitialized?: boolean;
  }
}

export {};
