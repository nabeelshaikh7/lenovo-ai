export interface JobPreferences {
  experience: string;
  sector: string;
  location: string;
  salary: {
    min: number;
    max: number;
  };
  jobType: string;
  remoteWork: boolean;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  description: string;
  requirements: string[];
  postedDate: string;
  status: 'applied' | 'interview' | 'rejected' | 'offered';
  url?: string;
  ai_suggestions?: {
    suggestions: string[];
  };
}

export interface JobApplication {
  id: string;
  jobId: string;
  job: Job;
  appliedDate: string;
  status: 'pending' | 'reviewed' | 'interview' | 'rejected' | 'offered';
  customizedResume?: string;
}