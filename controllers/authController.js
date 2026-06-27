import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ROLE_ALIAS } from "../utils/constants.js";
import { checkValidation, handleError } from "../utils/helpers.js";

// ── Helper ────────────────────────────────────────────────────────────────────

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// ── POST /api/auth/register ───────────────────────────────────────────────────

const register = async (req, res) => {
  if (checkValidation(req, res)) return;

  const {
    name,
    email,
    password,
    role,
    // New profile fields from frontend Step 3
    firstName,
    lastName,
    phone,
    country,
    region,
    city,
    organizationName,
    nic,
  } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Normalise role: frontend sends "candidate", backend stores "seeker"
    const normalisedRole = ROLE_ALIAS[role] || role;

    // Build location string from city/region/country
    const locationParts = [city, region, country].filter(Boolean);
    const location = locationParts.join(", ");

    const userData = {
      name: name || `${firstName || ""} ${lastName || ""}`.trim(),
      email,
      passwordHash,
      role: normalisedRole,
      firstName: firstName || "",
      lastName: lastName || "",
      phone: phone || "",
      country: country || "",
      region: region || "",
      city: city || "",
      location,
      nic: nic || "",
    };

    // Employer-specific fields
    if (normalisedRole === "employer" && organizationName) {
      userData.companyName = organizationName;
    }

    const newUser = await User.create(userData);
    const token = generateToken(newUser._id);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: newUser.toJSON(),
    });
  } catch (error) {
    return handleError(res, "Register", error);
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────

const login = async (req, res) => {
  if (checkValidation(req, res)) return;

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    return handleError(res, "Login", error);
  }
};

export { register, login };
