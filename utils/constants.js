// Roles used across the app (model, routes, middleware)
export const ROLES = {
  SEEKER: "seeker",
  EMPLOYER: "employer",
  ADMIN: "admin",
};

export const VALID_ROLES = Object.values(ROLES);

// Frontend sends "candidate"; backend stores "seeker". This map normalises.
export const ROLE_ALIAS = {
  candidate: ROLES.SEEKER,
  seeker: ROLES.SEEKER,
  employer: ROLES.EMPLOYER,
  admin: ROLES.ADMIN,
};

// Availability options for job seekers
export const AVAILABILITY_OPTIONS = [
  "immediate",
  "1_week",
  "2_weeks",
  "1_month",
  "not_available",
  "",
];

// Job type options (canonical lowercase values)
export const JOB_TYPES = [
  "full-time",
  "part-time",
  "contract",
  "internship",
  "remote",
  "freelance",
];

// Normalises user-supplied job types to the canonical form
const JOB_TYPE_ALIASES = {
  "full time": "full-time",
  "part time": "part-time",
};

export function normalizeJobType(type) {
  if (!type) return type;
  const lower = type.toLowerCase().trim();
  return JOB_TYPE_ALIASES[lower] || lower;
}

// Job categories (matches frontend dropdowns)
export const JOB_CATEGORIES = [
  "Technology",
  "Design",
  "Marketing",
  "Finance",
  "Healthcare",
  "Sales",
  "Engineering",
  "Education",
  "Accounting & Finance",
  "Administrative & Office Support",
  "Agriculture, Farming",
  "Apparel, Garments & Textile",
  "Architecture, Construction & Property",
  "Information Technology",
];

// Experience levels
export const EXPERIENCE_LEVELS = [
  "Fresh/Entry Level",
  "1-3 Years",
  "3-5 Years",
  "5+ Years",
  "Entry-level",
  "Mid-level",
  "Senior",
  "Fresh",
];

// Gender options for job postings
export const GENDER_OPTIONS = [
  "Male",
  "Female",
  "Male/Female",
  "Any",
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
