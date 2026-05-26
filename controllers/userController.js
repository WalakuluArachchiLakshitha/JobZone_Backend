import User from "../models/User.js";
import { ROLES } from "../utils/constants.js";
import { checkValidation, handleError, pickFields } from "../utils/helpers.js";

// Which fields each role is allowed to update.
// Adding a new field is a one-line change here — no if-chains needed.
const EDITABLE_FIELDS = {
  [ROLES.SEEKER]:   ["name", "location", "skills", "availability", "resumeUrl"],
  [ROLES.EMPLOYER]: ["name", "location", "companyName", "companyWebsite"],
  [ROLES.ADMIN]:    ["name", "location"],
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

export { getProfile, updateProfile };
