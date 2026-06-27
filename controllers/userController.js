import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { ROLES } from "../utils/constants.js";
import { checkValidation, handleError, pickFields } from "../utils/helpers.js";

// Which fields each role is allowed to update.
// Adding a new field is a one-line change here — no if-chains needed.
const EDITABLE_FIELDS = {
  [ROLES.SEEKER]: [
    "name",
    "firstName",
    "lastName",
    "phone",
    "title",
    "bio",
    "avatar",
    "location",
    "country",
    "region",
    "city",
    "website",
    "linkedin",
    "github",
    "twitter",
    "facebook",
    "experience",
    "education",
    "skills",
    "availability",
    "resumeUrl",
  ],
  [ROLES.EMPLOYER]: [
    "name",
    "firstName",
    "lastName",
    "phone",
    "title",
    "bio",
    "avatar",
    "location",
    "country",
    "region",
    "city",
    "website",
    "linkedin",
    "github",
    "twitter",
    "facebook",
    "experience",
    "education",
    "companyName",
    "companyWebsite",
    "companyAddress",
  ],
  [ROLES.ADMIN]: ["name", "location", "phone", "avatar"],
};

// ── GET /api/users/profile ────────────────────────────────────────────────────

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return handleError(res, "Get profile", error);
  }
};

// ── PUT /api/users/profile ────────────────────────────────────────────────────

const updateProfile = async (req, res) => {
  if (checkValidation(req, res)) return;

  try {
    const allowedFields = EDITABLE_FIELDS[req.user.role] || [];
    const updates = pickFields(req.body, allowedFields);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update.",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    return handleError(res, "Update profile", error);
  }
};

// ── PUT /api/users/change-password ────────────────────────────────────────────

const changePassword = async (req, res) => {
  if (checkValidation(req, res)) return;

  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    return handleError(res, "Change password", error);
  }
};

// ── GET /api/users/seekers ────────────────────────────────────────────────────
// Public listing of job-seeker profiles (for the Candidates page)

const getSeekers = async (req, res) => {
  try {
    const {
      search,
      location,
      sector,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = { role: ROLES.SEEKER };

    if (search) {
      const q = new RegExp(search, "i");
      filter.$or = [{ name: q }, { title: q }, { skills: q }];
    }

    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    // sector maps to a skill or title search
    if (sector) {
      filter.$or = filter.$or || [];
      filter.$or.push(
        { title: { $regex: sector, $options: "i" } },
        { skills: { $regex: sector, $options: "i" } }
      );
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [seekers, total] = await Promise.all([
      User.find(filter)
        .select("-passwordHash -__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: seekers.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      seekers,
    });
  } catch (error) {
    return handleError(res, "Get seekers", error);
  }
};

// ── GET /api/users/seekers/:id ────────────────────────────────────────────────

const getSeekerById = async (req, res) => {
  if (checkValidation(req, res)) return;

  try {
    const seeker = await User.findOne({
      _id: req.params.id,
      role: ROLES.SEEKER,
    }).select("-passwordHash -__v");

    if (!seeker) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found.",
      });
    }

    return res.status(200).json({ success: true, seeker });
  } catch (error) {
    return handleError(res, "Get seeker by ID", error);
  }
};

export { getProfile, updateProfile, changePassword, getSeekers, getSeekerById };
