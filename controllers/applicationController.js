import Application from "../models/Application.js";
import Job from "../models/Job.js";
import { ROLES, APPLICATION_STATUS } from "../utils/constants.js";
import { checkValidation, handleError } from "../utils/helpers.js";

// ── POST /api/applications ────────────────────────────────────────────────────

const applyForJob = async (req, res) => {
  if (checkValidation(req, res)) return;

  const { jobId, coverLetter } = req.body;

  try {
    // Check that the job exists and is open
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    if (job.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "This job is no longer accepting applications.",
      });
    }

    // Check for duplicate application
    const existingApplication = await Application.findOne({
      job: jobId,
      seeker: req.user._id,
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: "You have already applied for this job.",
      });
    }

    const application = await Application.create({
      job: jobId,
      seeker: req.user._id,
      coverLetter: coverLetter || "",
      status: APPLICATION_STATUS.PENDING,
    });

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully.",
      application,
    });
  } catch (error) {
    return handleError(res, "Apply for job", error);
  }
};

// ── GET /api/applications ─────────────────────────────────────────────────────

const getApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    let filter = {};
    let query;

    if (req.user.role === ROLES.SEEKER) {
      // Seekers see their own applications
      filter.seeker = req.user._id;
      if (status) filter.status = status;

      query = Application.find(filter)
        .populate({
          path: "job",
          select: "title company location type salary status",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);
    } else if (req.user.role === ROLES.EMPLOYER) {
      // Employers see applications for their jobs
      // First, get all job IDs belonging to this employer
      const employerJobIds = await Job.find({ employer: req.user._id }).distinct(
        "_id"
      );

      filter.job = { $in: employerJobIds };
      if (status) filter.status = status;

      query = Application.find(filter)
        .populate({
          path: "job",
          select: "title company location type salary",
        })
        .populate({
          path: "seeker",
          select: "name email skills availability location resumeUrl",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const [applications, total] = await Promise.all([
      query,
      Application.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: applications.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      applications,
    });
  } catch (error) {
    return handleError(res, "Get applications", error);
  }
};

// ── PATCH /api/applications/:id ───────────────────────────────────────────────

const updateApplicationStatus = async (req, res) => {
  if (checkValidation(req, res)) return;

  const { status } = req.body;

  try {
    const application = await Application.findById(req.params.id).populate(
      "job",
      "employer"
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    // Only the employer who owns the job can update the application status
    if (application.job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only manage applications for your own jobs.",
      });
    }

    application.status = status;
    await application.save();

    return res.status(200).json({
      success: true,
      message: `Application status updated to "${status}".`,
      application,
    });
  } catch (error) {
    return handleError(res, "Update application status", error);
  }
};

export { applyForJob, getApplications, updateApplicationStatus };
