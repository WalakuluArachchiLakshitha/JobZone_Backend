import Job from "../models/Job.js";
import User from "../models/User.js";
import Application from "../models/Application.js";
import JobAlert from "../models/JobAlert.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { JOB_STATUS, normalizeJobType } from "../utils/constants.js";
import { checkValidation, handleError, pickFields } from "../utils/helpers.js";

// ── Nodemailer transporter ─────────────────────────────────────────────────────
const createTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendMail({ to, subject, html }) {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"JobZone" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('Mailer error:', err.message);
    return false;
  }
}

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

// ── Helper: normalise any frontend type label to the canonical DB enum value ──
const FILTER_TYPE_ALIASES = {
  "full time": "full-time",
  "full-time": "full-time",
  "fulltime": "full-time",
  "part time": "part-time",
  "part-time": "part-time",
  "parttime": "part-time",
  "intern": "internship",
  "internship": "internship",
  "contract": "contract",
  "freelance": "freelance",
  "remote": "remote",
};

function normaliseFilterType(raw) {
  if (!raw) return raw;
  return FILTER_TYPE_ALIASES[raw.toLowerCase().trim()] || raw.toLowerCase().trim();
}

// ── Helper: parse a salary-range label into { min, max } ─────────────────────
function parseSalaryRange(label) {
  if (!label) return null;
  const cleaned = label.replace(/[$,k]/gi, "").trim();
  // e.g. "0 - 50" => min 0, max 50000
  const rangeMatch = cleaned.match(/^(\d+)\s*-\s*(\d+)$/);
  if (rangeMatch) {
    return { min: Number(rangeMatch[1]) * 1000, max: Number(rangeMatch[2]) * 1000 };
  }
  // e.g. "200+" => min 200000, no max
  const plusMatch = cleaned.match(/^(\d+)\+$/);
  if (plusMatch) {
    return { min: Number(plusMatch[1]) * 1000, max: null };
  }
  return null;
}

// ── Helper: convert a datePosted key to a Date threshold ─────────────────────
function datePostedToThreshold(key) {
  const now = new Date();
  switch (key) {
    case "1h":  return new Date(now.getTime() - 60 * 60 * 1000);
    case "24h": return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "7d":  return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "14d": return new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    case "30d": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:    return null; // "all" or unrecognised → no constraint
  }
}

// ── GET /api/jobs ─────────────────────────────────────────────────────────────

const getJobs = async (req, res) => {
  try {
    const {
      location,
      type,
      salary,
      minSalary,
      maxSalary,
      salaryRange,
      skills,
      search,
      nlpSearch,
      status,
      category,
      experience,
      gender,
      datePosted,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    // ── Build filter ────────────────────────────────────────────────────────
    const filter = { status: status || JOB_STATUS.OPEN };

    // We may accumulate multiple $or arrays that must all be satisfied,
    // so we collect them and merge via $and at the end.
    const andClauses = [];

    // ── NLP Search: parse natural language query ─────────────────────────
    let parsedNlp = {};
    if (nlpSearch) {
      parsedNlp = parseNaturalLanguageSearch(nlpSearch);
    }

    // ── Location (multi-select, comma-separated) ─────────────────────────
    if (location) {
      const locs = location.split(",").map((l) => l.trim()).filter(Boolean);
      if (locs.length === 1) {
        filter.location = { $regex: locs[0], $options: "i" };
      } else if (locs.length > 1) {
        andClauses.push({
          $or: locs.map((l) => ({ location: { $regex: l, $options: "i" } })),
        });
      }
    } else if (parsedNlp.location) {
      filter.location = { $regex: parsedNlp.location, $options: "i" };
    }

    // ── Job Type (multi-select, comma-separated, normalised) ─────────────
    if (type) {
      const types = type.split(",").map(normaliseFilterType).filter(Boolean);
      if (types.length === 1) {
        filter.type = types[0];
      } else if (types.length > 1) {
        filter.type = { $in: types };
      }
    } else if (parsedNlp.type) {
      filter.type = parsedNlp.type;
    }

    // ── Salary ───────────────────────────────────────────────────────────
    // Support explicit min/max, legacy single value, or range label string
    if (minSalary || maxSalary) {
      filter.salary = {};
      if (minSalary) filter.salary.$gte = Number(minSalary);
      if (maxSalary) filter.salary.$lte = Number(maxSalary);
    } else if (salaryRange) {
      // salaryRange can be comma-separated labels like "$0 - $50k,$50k - $100k"
      const ranges = salaryRange.split(",").map(parseSalaryRange).filter(Boolean);
      if (ranges.length === 1) {
        filter.salary = {};
        if (ranges[0].min != null) filter.salary.$gte = ranges[0].min;
        if (ranges[0].max != null) filter.salary.$lte = ranges[0].max;
      } else if (ranges.length > 1) {
        andClauses.push({
          $or: ranges.map((r) => {
            const cond = {};
            if (r.min != null) cond.$gte = r.min;
            if (r.max != null) cond.$lte = r.max;
            return { salary: cond };
          }),
        });
      }
    } else if (salary) {
      filter.salary = { $gte: Number(salary) };
    }

    if (skills) {
      const skillList = skills.split(",").map((s) => s.trim().toLowerCase());
      filter.skills = { $in: skillList };
    }

    // ── Category / Sector (multi-select, comma-separated) ────────────────
    if (category) {
      const cats = category.split(",").map((c) => c.trim()).filter(Boolean);
      if (cats.length === 1) {
        filter.category = { $regex: cats[0], $options: "i" };
      } else if (cats.length > 1) {
        andClauses.push({
          $or: cats.map((c) => ({ category: { $regex: c, $options: "i" } })),
        });
      }
    }

    if (experience) {
      filter.experience = experience;
    }

    // ── Gender (inclusive: selecting "Male" should also show "Any" and "Male/Female") ──
    if (gender) {
      const genders = gender.split(",").map((g) => g.trim()).filter(Boolean);
      // Always include jobs tagged "Any" since they are open to everyone
      const genderSet = new Set(genders);
      genderSet.add("Any");
      // If "Male" is selected, also match "Male/Female"
      if (genderSet.has("Male") || genderSet.has("Female")) {
        genderSet.add("Male/Female");
      }
      filter.gender = { $in: [...genderSet] };
    }

    // ── Date Posted ──────────────────────────────────────────────────────
    if (datePosted && datePosted !== "all") {
      const threshold = datePostedToThreshold(datePosted);
      if (threshold) {
        filter.createdAt = { $gte: threshold };
      }
    }

    // ── Text search: explicit search param or NLP keywords ───────────────
    const searchTerm = search || parsedNlp.keywords;
    if (searchTerm) {
      andClauses.push({
        $or: [
          { title: { $regex: searchTerm, $options: "i" } },
          { description: { $regex: searchTerm, $options: "i" } },
          { company: { $regex: searchTerm, $options: "i" } },
          { category: { $regex: searchTerm, $options: "i" } },
        ],
      });
    }

    // ── Merge all $and clauses into filter ───────────────────────────────
    if (andClauses.length > 0) {
      filter.$and = andClauses;
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
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

// ── POST /api/jobs/alerts ──────────────────────────────────────────────────

const createJobAlert = async (req, res) => {
  try {
    const { name, email, frequency } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required for job alerts.",
      });
    }

    const alert = await JobAlert.create({
      name,
      email,
      frequency: frequency || "Weekly",
    });

    return res.status(201).json({
      success: true,
      message: "Job alert created successfully.",
      alert,
    });
  } catch (error) {
    return handleError(res, "Create job alert", error);
  }
};

// ── POST /api/jobs/:id/email ───────────────────────────────────────────────
// Sends the job details to the requesting user's email address

const emailJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('employer', 'email name companyName');
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found." });
    }

    // Get the recipient email — prefer authenticated user, fallback to body
    const recipientEmail = req.user?.email || req.body?.email;
    if (!recipientEmail) {
      return res.status(400).json({ success: false, message: "No recipient email provided." });
    }

    const jobUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/jobs/${job._id}`;
    const salaryDisplay = job.salaryText || (job.salary ? `LKR ${job.salary.toLocaleString()}` : 'Negotiable');

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#0f172a,#1e40af);padding:32px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800;letter-spacing:1px">JOB<span style="color:#f59e0b">ZONE</span></h1>
          <p style="color:#94a3b8;margin:8px 0 0">Your Job Match</p>
        </div>
        <div style="padding:32px">
          <h2 style="color:#0f172a;margin:0 0 8px">${job.title}</h2>
          <p style="color:#6366f1;font-weight:600;margin:0 0 24px">@${job.company}</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr><td style="padding:8px 0;color:#64748b;width:120px">📍 Location</td><td style="color:#0f172a;font-weight:500">${job.location}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">💼 Type</td><td style="color:#0f172a;font-weight:500">${job.type}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">💰 Salary</td><td style="color:#0f172a;font-weight:500">${salaryDisplay}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">📅 Deadline</td><td style="color:#0f172a;font-weight:500">${job.deadline || 'Open'}</td></tr>
          </table>
          <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:24px">
            <h4 style="margin:0 0 8px;color:#374151">Job Description</h4>
            <p style="color:#4b5563;line-height:1.6;margin:0">${job.description.substring(0, 400)}${job.description.length > 400 ? '...' : ''}</p>
          </div>
          <a href="${jobUrl}" style="display:inline-block;background:#1e40af;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px">View Full Job Details →</a>
        </div>
        <div style="background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e2e8f0">
          <p style="color:#94a3b8;font-size:12px;margin:0">© ${new Date().getFullYear()} JobZone. You received this because you requested to be emailed this job.</p>
        </div>
      </div>
    `;

    const sent = await sendMail({
      to: recipientEmail,
      subject: `Job Opportunity: ${job.title} at ${job.company} | JobZone`,
      html,
    });

    return res.status(200).json({
      success: true,
      message: sent
        ? 'Job details emailed successfully!'
        : 'Job noted (email service temporarily unavailable).',
    });
  } catch (error) {
    return handleError(res, "Email job", error);
  }
};

// ── POST /api/jobs/:id/contact ─────────────────────────────────────────────
// Sends a message from a candidate/visitor to the employer

const contactEmployer = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('employer', 'email name companyName');
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found." });
    }

    const { senderName, senderEmail, senderPhone, message } = req.body;
    if (!senderName || !senderEmail || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email and message are required.",
      });
    }

    const employerEmail = job.companyEmail || job.employer?.email;
    const jobUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/jobs/${job._id}`;

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#0f172a,#1e40af);padding:32px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800;letter-spacing:1px">JOB<span style="color:#f59e0b">ZONE</span></h1>
          <p style="color:#94a3b8;margin:8px 0 0">New message about your job listing</p>
        </div>
        <div style="padding:32px">
          <h2 style="color:#0f172a;margin:0 0 4px">Message for: ${job.title}</h2>
          <p style="color:#6366f1;font-weight:600;margin:0 0 24px">@${job.company}</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#f8fafc;border-radius:8px;padding:16px">
            <tr><td style="padding:6px 12px;color:#64748b;width:120px">From</td><td style="color:#0f172a;font-weight:500">${senderName}</td></tr>
            <tr><td style="padding:6px 12px;color:#64748b">Email</td><td style="color:#0f172a">${senderEmail}</td></tr>
            ${senderPhone ? `<tr><td style="padding:6px 12px;color:#64748b">Phone</td><td style="color:#0f172a">${senderPhone}</td></tr>` : ''}
          </table>
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:24px">
            <h4 style="margin:0 0 12px;color:#374151">Message</h4>
            <p style="color:#4b5563;line-height:1.7;margin:0;white-space:pre-wrap">${message}</p>
          </div>
          <a href="${jobUrl}" style="display:inline-block;background:#1e40af;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">View Job Posting →</a>
        </div>
      </div>
    `;

    if (employerEmail) {
      await sendMail({
        to: employerEmail,
        subject: `New message about "${job.title}" | JobZone`,
        html,
      });
    }

    // Also send a confirmation to the sender
    await sendMail({
      to: senderEmail,
      subject: `Your message to ${job.company} has been sent | JobZone`,
      html: `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto;padding:32px"><h2>Message Sent!</h2><p>Your message regarding <strong>${job.title}</strong> at <strong>${job.company}</strong> has been delivered to the employer.</p><p style="color:#64748b">They will respond to you at <strong>${senderEmail}</strong>.</p></div>`,
    });

    return res.status(200).json({
      success: true,
      message: 'Your message has been sent to the employer successfully!',
    });
  } catch (error) {
    return handleError(res, "Contact employer", error);
  }
};

export { createJobAlert, emailJob, contactEmployer, createJob, getJobs, getJobById, getMyJobs, updateJob, deleteJob };
