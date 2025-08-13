
export type Job = {
  id: string;
  title: string;
  company: string;
  url: string;
  source: string;
  createdAt: string;
  lastSeen?: string;
};

export type Application = {
  jobId: string;
  status: 'applied'|'interviewing'|'rejected'|'offer'|'saved';
  track?: 'backend'|'mobile'|'other';
  note?: string;
  cvVersion?: string;
  coverPath?: string;
  appliedAt?: string;
  nextFollowUp?: string;
};
