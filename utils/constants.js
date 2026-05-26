// Roles used across the app (model, routes, middleware)
export const ROLES = {
  SEEKER: "seeker",
  EMPLOYER: "employer",
  ADMIN: "admin",
};

export const VALID_ROLES = Object.values(ROLES);

// Availability options for job seekers
export const AVAILABILITY_OPTIONS = [
  "immediate",
  "1_week",
  "2_weeks",
  "1_month",
  "not_available",
  "",
];

// Job type options
export const JOB_TYPES = [
  "full-time",
  "part-time",
  "contract",
  "internship",
  "remote",
];

// Job posting status
export const JOB_STATUS = {
  OPEN: "open",
  CLOSED: "closed",
};
export const VALID_JOB_STATUSES = Object.values(JOB_STATUS);

// Application status
export const APPLICATION_STATUS = {
  PENDING: "pending",
  REVIEWED: "reviewed",
  SHORTLISTED: "shortlisted",
  REJECTED: "rejected",
  ACCEPTED: "accepted",
};
export const VALID_APPLICATION_STATUSES = Object.values(APPLICATION_STATUS);

export const PORT = process.env.PORT || 5000;
