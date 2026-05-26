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

export const PORT = process.env.PORT || 5000;
