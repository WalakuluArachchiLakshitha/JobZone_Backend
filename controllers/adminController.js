import User from "../models/User.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Company from "../models/Company.js";
import Contact from "../models/Contact.js";
import { handleError } from "../utils/helpers.js";

// ── GET /api/admin/stats ──────────────────────────────────────────────────────

const getStats = async (_req, res) => {
  try {
    const [
      totalUsers,
      totalSeekers,
      totalEmployers,
      totalJobs,
      openJobs,
      totalApplications,
      totalCompanies,
      verifiedEmployers,
      pendingVerifications,
      totalContacts,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "seeker" }),
      User.countDocuments({ role: "employer" }),
      Job.countDocuments(),
      Job.countDocuments({ status: "open" }),
      Application.countDocuments(),
      Company.countDocuments(),
      User.countDocuments({ role: "employer", verified: true }),
      User.countDocuments({ role: "employer", verified: false, companyBR: { $ne: "" } }),
      Contact.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalSeekers,
        totalEmployers,
        totalJobs,
        openJobs,
        totalApplications,
        totalCompanies,
        verifiedEmployers,
        pendingVerifications,
        totalContacts,
      },
    });
  } catch (error) {
    return handleError(res, "Get admin stats", error);
  }
};

// ── GET /api/admin/users ──────────────────────────────────────────────────────

const getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      users,
    });
  } catch (error) {
    return handleError(res, "Get all users", error);
  }
};

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────────

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Don't allow deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account." });
    }

    // Cascade: remove user's applications and jobs
    await Application.deleteMany({ seeker: user._id });
    const userJobs = await Job.find({ employer: user._id }).distinct("_id");
    if (userJobs.length > 0) {
      await Application.deleteMany({ job: { $in: userJobs } });
      await Job.deleteMany({ employer: user._id });
    }
    await User.findByIdAndDelete(user._id);

    return res.status(200).json({
      success: true,
      message: "User and associated data deleted successfully.",
    });
  } catch (error) {
    return handleError(res, "Delete user", error);
  }
};

// ── GET /api/admin/pending-verifications ───────────────────────────────────────

const getPendingVerifications = async (_req, res) => {
  try {
    // Employers who uploaded a BR document but are not yet verified
    const pending = await User.find({
      role: "employer",
      verified: false,
      companyBR: { $ne: "" },
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: pending.length,
      users: pending,
    });
  } catch (error) {
    return handleError(res, "Get pending verifications", error);
  }
};

// ── PATCH /api/admin/verify-company/:id ───────────────────────────────────────

const verifyCompany = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    if (user.role !== "employer") {
      return res.status(400).json({ success: false, message: "Only employers can be verified." });
    }

    user.verified = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `${user.companyName || user.name} has been verified.`,
      user: user.toJSON(),
    });
  } catch (error) {
    return handleError(res, "Verify company", error);
  }
};

// ── PATCH /api/admin/reject-verification/:id ──────────────────────────────────

const rejectVerification = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.verified = false;
    user.companyBR = ""; // Clear the rejected document
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Verification rejected. The employer can re-upload documents.",
      user: user.toJSON(),
    });
  } catch (error) {
    return handleError(res, "Reject verification", error);
  }
};

// ── GET /api/admin/jobs ───────────────────────────────────────────────────────

const getAllJobs = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate("employer", "name email companyName verified")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Job.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      jobs,
    });
  } catch (error) {
    return handleError(res, "Get all jobs (admin)", error);
  }
};

// ── DELETE /api/admin/jobs/:id ─────────────────────────────────────────────────

const adminDeleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found." });
    }

    await Application.deleteMany({ job: job._id });
    await Job.findByIdAndDelete(job._id);

    return res.status(200).json({
      success: true,
      message: "Job and associated applications deleted by admin.",
    });
  } catch (error) {
    return handleError(res, "Admin delete job", error);
  }
};

// ── GET /api/admin/contacts ───────────────────────────────────────────────────

const getContacts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [contacts, total] = await Promise.all([
      Contact.find().sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Contact.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      count: contacts.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      contacts,
    });
  } catch (error) {
    return handleError(res, "Get contacts (admin)", error);
  }
};

export {
  getStats,
  getAllUsers,
  deleteUser,
  getPendingVerifications,
  verifyCompany,
  rejectVerification,
  getAllJobs,
  adminDeleteJob,
  getContacts,
};
