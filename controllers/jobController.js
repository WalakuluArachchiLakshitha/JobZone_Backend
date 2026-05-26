import Job from "../models/Job.js";
import Application from "../models/Application.js";
import { JOB_STATUS } from "../utils/constants.js";
import { checkValidation, handleError, pickFields } from "../utils/helpers.js";

// Fields an employer is allowed to edit on their own job
const EDITABLE_JOB_FIELDS = [
  "title",
  "description",
  "location",
  "type",
  "salary",
  "skills",
  "status",
];

// ── POST /api/jobs ────────────────────────────────────────────────────────────

const createJob = async (req, res) => {
  if (checkValidation(req, res)) return;

  const { title, description, location, type, salary, skills } = req.body;

  try {
    const job = await Job.create({
      title,
      description,
      company: req.user.companyName || "Unnamed Company",
      location,
      type,
      salary,
      skills: skills || [],
      employer: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Job posted successfully.",
      job,
    });
  } catch (error) {
    return handleError(res, "Create job", error);
  }
};

// ── GET /api/jobs ─────────────────────────────────────────────────────────────

const getJobs = async (req, res) => {
  try {
    const {
      location,
      type,
      salary,
      skills,
      search,
      status,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    // ── Build filter ────────────────────────────────────────────────────────
    const filter = { status: status || JOB_STATUS.OPEN };

    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    if (type) {
      filter.type = type;
    }

    if (salary) {
      filter.salary = { $gte: Number(salary) };
    }

    if (skills) {
      const skillList = skills.split(",").map((s) => s.trim().toLowerCase());
      filter.skills = { $in: skillList };
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // ── Pagination ──────────────────────────────────────────────────────────
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // ── Sort ────────────────────────────────────────────────────────────────
    let sortObj = { createdAt: -1 }; // default: newest first
    if (sort) {
      const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
      const sortOrder = sort.startsWith("-") ? -1 : 1;
      sortObj = { [sortField]: sortOrder };
    }

    // ── Execute ─────────────────────────────────────────────────────────────
    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate("employer", "name email companyName")
        .sort(sortObj)
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
    return handleError(res, "Get jobs", error);
  }
};

// ── GET /api/jobs/:id ─────────────────────────────────────────────────────────

const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      "employer",
      "name email companyName companyWebsite"
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    return res.status(200).json({ success: true, job });
  } catch (error) {
    return handleError(res, "Get job by ID", error);
  }
};

// ── PUT /api/jobs/:id ─────────────────────────────────────────────────────────

const updateJob = async (req, res) => {
  if (checkValidation(req, res)) return;

  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    // Ownership check — only the employer who posted it can edit
    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own job postings.",
      });
    }

    const updates = pickFields(req.body, EDITABLE_JOB_FIELDS);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update.",
      });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Job updated successfully.",
      job: updatedJob,
    });
  } catch (error) {
    return handleError(res, "Update job", error);
  }
};

// ── DELETE /api/jobs/:id ──────────────────────────────────────────────────────

const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    // Ownership check
    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own job postings.",
      });
    }

    // Cascade: remove all applications for this job
    await Application.deleteMany({ job: job._id });
    await Job.findByIdAndDelete(job._id);

    return res.status(200).json({
      success: true,
      message: "Job and associated applications deleted successfully.",
    });
  } catch (error) {
    return handleError(res, "Delete job", error);
  }
};

export { createJob, getJobs, getJobById, updateJob, deleteJob };
