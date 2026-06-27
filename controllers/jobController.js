import Job from "../models/Job.js";
import Application from "../models/Application.js";
import User from "../models/User.js";
import { JOB_STATUS, normalizeJobType } from "../utils/constants.js";
import { checkValidation, handleError, pickFields } from "../utils/helpers.js";

// ── NLP Search Parser ─────────────────────────────────────────────────────────
// Parses natural language queries like "Part-time jobs near Colombo for students"

const SRI_LANKAN_LOCATIONS = [
  "colombo", "kandy", "galle", "matara", "jaffna", "kurunegala", "negombo",
  "malabe", "homagama", "gampaha", "batticaloa", "trincomalee", "anuradhapura",
  "ratnapura", "badulla", "nuwara eliya", "polonnaruwa", "kegalle", "kalutara",
  "matale", "hambantota", "puttalam", "mannar", "vavuniya", "mullaitivu",
  "kilinochchi", "ampara", "monaragala", "kaduwela", "dehiwala", "moratuwa",
  "nugegoda", "maharagama", "piliyandala", "kottawa", "mount lavinia",
];

const JOB_TYPE_MAP = {
  "full time": "full-time", "full-time": "full-time", "fulltime": "full-time",
  "part time": "part-time", "part-time": "part-time", "parttime": "part-time",
  "internship": "internship", "intern": "internship",
  "contract": "contract", "freelance": "freelance",
  "remote": "remote", "work from home": "remote", "wfh": "remote",
};

function parseNaturalLanguageSearch(query) {
  if (!query) return {};
  const lower = query.toLowerCase().trim();
  const result = {};
  let remaining = lower;

  // Extract job type
  for (const [alias, canonical] of Object.entries(JOB_TYPE_MAP)) {
    if (remaining.includes(alias)) {
      result.type = canonical;
      remaining = remaining.replace(alias, " ").trim();
      break;
    }
  }

  // Extract location
  for (const loc of SRI_LANKAN_LOCATIONS) {
    if (remaining.includes(loc)) {
      result.location = loc;
      remaining = remaining.replace(loc, " ").trim();
      break;
    }
  }

  // Clean up filler words
  const fillerWords = ["jobs", "job", "near", "in", "at", "for", "around", "any", "find", "show", "search", "me", "the", "a", "an", "students", "student"];
  const words = remaining.split(/\s+/).filter((w) => w && !fillerWords.includes(w));
  if (words.length > 0) {
    result.keywords = words.join(" ");
  }

  return result;
}

// ── Match Score Calculator ────────────────────────────────────────────────────
// Calculates compatibility between a user profile and a job

function calculateMatchScore(userProfile, job) {
  if (!userProfile) return 0;
  let score = 0;
  let totalWeight = 0;

  // 1. Skills match (50% weight)
  const skillWeight = 50;
  totalWeight += skillWeight;
  if (userProfile.skills && userProfile.skills.length > 0 && job.skills && job.skills.length > 0) {
    const userSkills = userProfile.skills.map((s) => s.toLowerCase().trim());
    const jobSkills = job.skills.map((s) => s.toLowerCase().trim());
    const matchCount = jobSkills.filter((js) => userSkills.some((us) => us.includes(js) || js.includes(us))).length;
    score += jobSkills.length > 0 ? (matchCount / jobSkills.length) * skillWeight : 0;
  }

  // 2. Location match (30% weight)
  const locWeight = 30;
  totalWeight += locWeight;
  if (userProfile.location && job.location) {
    const userLoc = userProfile.location.toLowerCase();
    const jobLoc = job.location.toLowerCase();
    if (userLoc.includes(jobLoc) || jobLoc.includes(userLoc)) {
      score += locWeight;
    } else {
      // Partial: same region/city words
      const userWords = userLoc.split(/[\s,]+/);
      const jobWords = jobLoc.split(/[\s,]+/);
      const overlap = jobWords.filter((w) => userWords.includes(w)).length;
      if (overlap > 0) {
        score += (overlap / jobWords.length) * locWeight * 0.7;
      }
    }
  }

  // 3. Job type / availability match (20% weight)
  const typeWeight = 20;
  totalWeight += typeWeight;
  if (userProfile.availability && job.type) {
    const availMap = {
      immediate: ["full-time", "part-time", "contract", "internship", "freelance", "remote"],
      "1_week": ["full-time", "part-time", "contract", "internship"],
      "2_weeks": ["full-time", "part-time", "contract"],
      "1_month": ["full-time", "contract"],
    };
    const compatibleTypes = availMap[userProfile.availability] || [];
    if (compatibleTypes.includes(job.type)) {
      score += typeWeight;
    }
  } else {
    // If no availability set, give partial credit
    score += typeWeight * 0.5;
  }

  return totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0;
}

// Fields an employer is allowed to edit on their own job
const EDITABLE_JOB_FIELDS = [
  "title",
  "description",
  "location",
  "type",
  "salary",
  "salaryText",
  "skills",
  "status",
  "category",
  "industry",
  "experience",
  "gender",
  "deadline",
  "noOfPositions",
  "contactPerson",
  "contactNumber",
  "companyAddress",
  "companyEmail",
  "remote",
  "urgent",
  "featured",
];

// ── POST /api/jobs ────────────────────────────────────────────────────────────

const createJob = async (req, res) => {
  if (checkValidation(req, res)) return;

  const {
    title,
    description,
    location,
    type,
    salary,
    salaryText,
    skills,
    category,
    industry,
    experience,
    gender,
    deadline,
    noOfPositions,
    contactPerson,
    contactNumber,
    companyAddress,
    companyEmail,
    companyName,
    remote,
    urgent,
    featured,
  } = req.body;

  try {
    const job = await Job.create({
      title,
      description,
      company: companyName || req.user.companyName || "Unnamed Company",
      location,
      type: normalizeJobType(type),
      salary,
      salaryText: salaryText || "",
      skills: skills || [],
      employer: req.user._id,
      category: category || "",
      industry: industry || "",
      experience: experience || "",
      gender: gender || "Any",
      deadline: deadline || "",
      noOfPositions: noOfPositions || 1,
      contactPerson: contactPerson || "",
      contactNumber: contactNumber || "",
      companyAddress: companyAddress || "",
      companyEmail: companyEmail || "",
      remote: remote || false,
      urgent: urgent || false,
      featured: featured || false,
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
      nlpSearch,
      status,
      category,
      experience,
      gender,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    // ── Build filter ────────────────────────────────────────────────────────
    const filter = { status: status || JOB_STATUS.OPEN };

    // ── NLP Search: parse natural language query ─────────────────────────
    let parsedNlp = {};
    if (nlpSearch) {
      parsedNlp = parseNaturalLanguageSearch(nlpSearch);
    }

    // Apply explicit filters first, NLP fills gaps
    if (location) {
      filter.location = { $regex: location, $options: "i" };
    } else if (parsedNlp.location) {
      filter.location = { $regex: parsedNlp.location, $options: "i" };
    }

    if (type) {
      filter.type = type;
    } else if (parsedNlp.type) {
      filter.type = parsedNlp.type;
    }

    if (salary) {
      filter.salary = { $gte: Number(salary) };
    }

    if (skills) {
      const skillList = skills.split(",").map((s) => s.trim().toLowerCase());
      filter.skills = { $in: skillList };
    }

    if (category) {
      filter.category = { $regex: category, $options: "i" };
    }

    if (experience) {
      filter.experience = experience;
    }

    if (gender) {
      filter.gender = gender;
    }

    // Text search: explicit search param or NLP keywords
    const searchTerm = search || parsedNlp.keywords;
    if (searchTerm) {
      filter.$or = [
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
        { company: { $regex: searchTerm, $options: "i" } },
        { category: { $regex: searchTerm, $options: "i" } },
      ];
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
        .populate("employer", "name email companyName companyWebsite verified")
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum),
      Job.countDocuments(filter),
    ]);

    // ── Calculate match scores if user token is provided ────────────────
    let jobsWithScores = jobs.map((j) => j.toJSON());
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const jwt = await import("jsonwebtoken");
        const token = authHeader.split(" ")[1];
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
        const userProfile = await User.findById(decoded.id);
        if (userProfile && userProfile.role === "seeker") {
          jobsWithScores = jobsWithScores.map((job) => ({
            ...job,
            matchScore: calculateMatchScore(userProfile, job),
          }));
        }
      } catch {
        // Token invalid or expired — just return jobs without scores
      }
    }

    return res.status(200).json({
      success: true,
      count: jobsWithScores.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      jobs: jobsWithScores,
      nlpParsed: nlpSearch ? parsedNlp : undefined,
    });
  } catch (error) {
    return handleError(res, "Get jobs", error);
  }
};

// ── GET /api/jobs/:id ─────────────────────────────────────────────────────────

const getJobById = async (req, res) => {
  if (checkValidation(req, res)) return;

  try {
    const job = await Job.findById(req.params.id).populate(
      "employer",
      "name email companyName companyWebsite verified"
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    // Increment view count
    job.views = (job.views || 0) + 1;
    await job.save();

    // Calculate match score if user is logged in
    let matchScore = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const jwt = await import("jsonwebtoken");
        const token = authHeader.split(" ")[1];
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
        const userProfile = await User.findById(decoded.id);
        if (userProfile && userProfile.role === "seeker") {
          matchScore = calculateMatchScore(userProfile, job);
        }
      } catch {
        // Ignore token errors
      }
    }

    return res.status(200).json({ success: true, job, matchScore });
  } catch (error) {
    return handleError(res, "Get job by ID", error);
  }
};

// ── GET /api/jobs/employer/my-jobs ────────────────────────────────────────────
// Employer gets their own posted jobs

const getMyJobs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { employer: req.user._id };

    const [jobs, total] = await Promise.all([
      Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
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
    return handleError(res, "Get my jobs", error);
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
  if (checkValidation(req, res)) return;

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

export { createJob, getJobs, getJobById, getMyJobs, updateJob, deleteJob };
