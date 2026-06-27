import SavedJob from "../models/SavedJob.js";
import { handleError } from "../utils/helpers.js";

// ── POST /api/saved-jobs ──────────────────────────────────────────────────────

const saveJob = async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "jobId is required.",
      });
    }

    // Check if already saved
    const existing = await SavedJob.findOne({
      user: req.user._id,
      job: jobId,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Job already saved.",
      });
    }

    await SavedJob.create({
      user: req.user._id,
      job: jobId,
    });

    return res.status(201).json({
      success: true,
      message: "Job saved to favorites.",
    });
  } catch (error) {
    return handleError(res, "Save job", error);
  }
};

// ── GET /api/saved-jobs ───────────────────────────────────────────────────────

const getSavedJobs = async (req, res) => {
  try {
    const savedJobs = await SavedJob.find({ user: req.user._id })
      .populate({
        path: "job",
        populate: {
          path: "employer",
          select: "name companyName",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: savedJobs.length,
      savedJobs,
    });
  } catch (error) {
    return handleError(res, "Get saved jobs", error);
  }
};

// ── DELETE /api/saved-jobs/:jobId ─────────────────────────────────────────────

const unsaveJob = async (req, res) => {
  try {
    const result = await SavedJob.findOneAndDelete({
      user: req.user._id,
      job: req.params.jobId,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Saved job not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job removed from favorites.",
    });
  } catch (error) {
    return handleError(res, "Unsave job", error);
  }
};

export { saveJob, getSavedJobs, unsaveJob };
