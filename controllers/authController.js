import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ROLE_ALIAS } from "../utils/constants.js";
import { checkValidation, handleError } from "../utils/helpers.js";
import { sendOtpEmail } from "../utils/emailService.js";

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

    // Google-only users can't login with password
    if (!user.passwordHash && user.googleId) {
      return res.status(401).json({
        success: false,
        message: "This account uses Google Sign-In. Please use the Google button to log in.",
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

// ── POST /api/auth/forgot-password ────────────────────────────────────────────

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required.",
    });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Don't reveal whether the email exists (security best practice)
      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, an OTP has been sent.",
      });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Hash OTP before storing (don't store plain OTP in DB)
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    // Store OTP and expiry (10 minutes)
    user.resetOtp = hashedOtp;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send OTP email
    await sendOtpEmail(user.email, otp, user.name || user.firstName || "User");

    return res.status(200).json({
      success: true,
      message: "If an account with that email exists, an OTP has been sent.",
    });
  } catch (error) {
    return handleError(res, "Forgot password", error);
  }
};

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required.",
    });
  }

  try {
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetOtpExpires: { $gt: new Date() },
    });

    if (!user || !user.resetOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Please request a new one.",
      });
    }

    // Compare OTP
    const isValid = await bcrypt.compare(otp.toString(), user.resetOtp);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP code. Please try again.",
      });
    }

    // Generate a short-lived reset token (5 minutes)
    const resetToken = jwt.sign(
      { id: user._id, purpose: "password-reset" },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );

    // Clear OTP from DB (one-time use)
    user.resetOtp = "";
    user.resetOtpExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
      resetToken,
    });
  } catch (error) {
    return handleError(res, "Verify OTP", error);
  }
};

// ── POST /api/auth/reset-password ─────────────────────────────────────────────

const resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;

  if (!resetToken || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Reset token and new password are required.",
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters long.",
    });
  }

  try {
    // Verify the reset token
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

    if (decoded.purpose !== "password-reset") {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token.",
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.resetOtp = "";
    user.resetOtpExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully. You can now log in.",
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({
        success: false,
        message: "Reset link has expired. Please request a new OTP.",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token.",
      });
    }
    return handleError(res, "Reset password", error);
  }
};

// ── POST /api/auth/google ─────────────────────────────────────────────────────

const googleLogin = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({
      success: false,
      message: "Google credential is required.",
    });
  }

  try {
    // Verify Google ID token by calling Google's tokeninfo endpoint
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );

    if (!response.ok) {
      return res.status(401).json({
        success: false,
        message: "Invalid Google token.",
      });
    }

    const payload = await response.json();

    // Verify audience matches our client ID
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({
        success: false,
        message: "Google token audience mismatch.",
      });
    }

    const { sub: googleId, email, name, picture } = payload;

    // Check if user already exists (by googleId or email)
    let user = await User.findOne({
      $or: [{ googleId }, { email: email.toLowerCase() }],
    });

    if (user) {
      // Existing user — link Google account if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
        if (picture && !user.avatar) user.avatar = picture;
        await user.save();
      }
    } else {
      // New user — create account
      user = await User.create({
        name: name || email.split("@")[0],
        email: email.toLowerCase(),
        googleId,
        role: "seeker",
        avatar: picture || "",
        passwordHash: "",
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Google login successful.",
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    return handleError(res, "Google login", error);
  }
};

export { register, login, forgotPassword, verifyOtp, resetPassword, googleLogin };
