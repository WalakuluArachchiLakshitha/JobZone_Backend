import { validationResult } from "express-validator";

/**
 * Checks express-validator results and sends a 400 response if there are errors.
 * Returns true if validation failed (so the caller should return early).
 * Returns false if everything is fine.
 */
export function checkValidation(req, res) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
    return true;
  }

  return false;
}

/**
 * Standard catch-block handler. Logs the error and sends a 500 response.
 */
export function handleError(res, label, error) {
  console.error(`❌ ${label} error:`, error);
  return res.status(500).json({
    success: false,
    message: "Server error. Please try again later.",
  });
}

/**
 * Picks only the specified keys from `source`, skipping any that are undefined.
 * Used to build safe update objects without long if-chains.
 */
export function pickFields(source, fields) {
  const picked = {};

  for (const field of fields) {
    if (source[field] !== undefined) {
      picked[field] = source[field];
    }
  }

  return picked;
}

/**
 * Exits the process if any of the listed environment variables are missing.
 */
export function requireEnvVars(...names) {
  for (const name of names) {
    if (!process.env[name]) {
      console.error(`❌ ${name} is not defined in .env`);
      process.exit(1);
    }
  }
}
