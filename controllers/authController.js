import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { checkValidation, handleError } from "../utils/helpers.js";

// ── Helper ────────────────────────────────────────────────────────────────────

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// ── POST /api/auth/register ───────────────────────────────────────────────────

const register = async (req, res) => {
  if (checkValidation(req, res)) return;

  const { name, email, password, role } = req.body;

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

    const newUser = await User.create({ name, email, passwordHash, role });
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
