import Job from "../models/Job.js";
import { JOB_STATUS } from "../utils/constants.js";
import { handleError } from "../utils/helpers.js";

// ── Rule-Based Chatbot Engine ─────────────────────────────────────────────────

// Patterns and their handlers (checked in order)
const RULES = [
  {
    patterns: [/^(hi|hello|hey|good\s*(morning|afternoon|evening))$/i, /^how\s*are\s*you/i],
    response: () => ({
      text: "Hello! 👋 Welcome to JobZone. I'm here to help you find the perfect job opportunity. What can I assist you with today?",
      suggestions: ["Show latest jobs", "How to apply?", "Search jobs", "About JobZone"],
    }),
  },
  {
    patterns: [/how\s*to\s*(apply|submit)/i, /apply\s*for\s*(a\s*)?job/i, /application\s*process/i],
    response: () => ({
      text: "📝 **How to Apply for a Job:**\n\n1. Create an account or log in\n2. Complete your profile with skills and experience\n3. Browse available jobs or search for specific roles\n4. Click on a job to view details\n5. Click the **Apply** button and submit your application\n\nMake sure your profile is complete for better match scores!",
      suggestions: ["Show latest jobs", "Create resume", "My profile"],
    }),
  },
  {
    patterns: [/create\s*(a\s*)?(resume|cv)/i, /generate\s*(a\s*)?(resume|cv)/i, /resume\s*builder/i],
    response: () => ({
      text: "📄 **CV/Resume Generator:**\n\nJobZone provides an automatic CV generator! Here's how:\n\n1. Go to your **Dashboard**\n2. Fill in your profile details (skills, education, experience)\n3. Click **Generate CV** to create a professional resume\n4. Download it as a document file\n\nYour CV will be generated from your profile data automatically!",
      suggestions: ["How to apply?", "Show latest jobs", "My profile"],
    }),
  },
  {
    patterns: [/about\s*jobzone/i, /what\s*is\s*jobzone/i, /tell\s*me\s*about/i],
    response: () => ({
      text: "🌟 **About JobZone:**\n\nJobZone is a smart job marketplace that directly connects job seekers with employers — without intermediaries or hidden charges.\n\n**Key Features:**\n• Smart job recommendations\n• Job match scoring\n• Direct employer communication\n• NIC-verified profiles\n• Automatic CV generation\n• AI chatbot assistance (that's me! 🤖)\n\nWe support part-time, full-time, internship, and daily wage opportunities.",
      suggestions: ["Show latest jobs", "How to apply?", "Search jobs"],
    }),
  },
  {
    patterns: [/my\s*profile/i, /edit\s*profile/i, /update\s*profile/i],
    response: () => ({
      text: "👤 **Your Profile:**\n\nYou can manage your profile from the **Dashboard**:\n\n• Update personal information\n• Add/edit skills\n• Upload your resume\n• Update availability\n• View your applications\n\nA complete profile helps you get better job match scores!",
      suggestions: ["How to apply?", "Create resume", "Show latest jobs"],
    }),
  },
  {
    patterns: [/match\s*score/i, /compatibility/i, /how\s*matching\s*works/i],
    response: () => ({
      text: "📊 **Job Match Score:**\n\nJobZone calculates a compatibility percentage between your profile and each job:\n\n• **Skills Match** — How many of your skills match the job requirements\n• **Location Match** — If you're in the same city/region as the job\n• **Job Type Match** — Based on your availability preferences\n\nHigher scores mean better compatibility. We recommend applying to jobs with 70%+ match!",
      suggestions: ["Show latest jobs", "My profile", "How to apply?"],
    }),
  },
  {
    patterns: [/contact\s*(us|support)/i, /help\s*desk/i, /customer\s*service/i],
    response: () => ({
      text: "📞 **Contact Support:**\n\nYou can reach us through:\n• **Contact Page**: Visit our Contact page to send a message\n• **WhatsApp**: Click the WhatsApp button on the bottom of any page\n• **Email**: support@jobzone.lk\n\nWe typically respond within 24 hours!",
      suggestions: ["About JobZone", "How to apply?", "Show latest jobs"],
    }),
  },
  {
    patterns: [/verified|verification|badge|trust/i],
    response: () => ({
      text: "✅ **Verified Companies:**\n\nJobZone verifies employers to keep you safe:\n\n• Companies upload their **Business Registration** documents\n• Our admin team reviews and approves them\n• Verified companies display a **green badge** ✅\n\n**For Job Seekers:** Your NIC is validated during registration to ensure a trustworthy community.",
      suggestions: ["How to apply?", "Show latest jobs", "About JobZone"],
    }),
  },
  {
    patterns: [/thank(s|\s*you)/i, /bye|goodbye/i],
    response: () => ({
      text: "You're welcome! 😊 Feel free to come back anytime you need help. Good luck with your job search! 🍀",
      suggestions: ["Show latest jobs", "How to apply?"],
    }),
  },
];

// Dynamic job search patterns
const JOB_SEARCH_PATTERNS = [
  /(?:show|find|search|any|get|list)\s+(?:me\s+)?(.+?)(?:\s+jobs?)?$/i,
  /(?:jobs?\s+(?:for|in|at|near|about)\s+)(.+)/i,
  /(?:latest|new|recent|today'?s?)\s*jobs?/i,
  /^(?:jobs?|vacancies|openings|opportunities)$/i,
];

// ── POST /api/chatbot/message ─────────────────────────────────────────────────

const handleMessage = async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: "Message is required.",
    });
  }

  const text = message.trim();

  try {
    // 1. Check static rules first
    for (const rule of RULES) {
      for (const pattern of rule.patterns) {
        if (pattern.test(text)) {
          const result = rule.response();
          return res.status(200).json({ success: true, ...result });
        }
      }
    }

    // 2. Check for job search intent
    let searchQuery = null;

    // "latest jobs", "new jobs", "any jobs today"
    if (/(?:latest|new|recent|today|any)\s*jobs?/i.test(text) || /^jobs?$/i.test(text)) {
      searchQuery = ""; // empty = fetch latest
    }

    // "show cashier jobs", "find developer jobs in Colombo"
    if (!searchQuery && searchQuery !== "") {
      for (const pattern of JOB_SEARCH_PATTERNS) {
        const match = text.match(pattern);
        if (match) {
          searchQuery = match[1] ? match[1].trim() : "";
          break;
        }
      }
    }

    if (searchQuery !== null) {
      const filter = { status: JOB_STATUS.OPEN };

      if (searchQuery) {
        // Try to extract location and keywords
        const locationKeywords = ["colombo", "kandy", "galle", "matara", "jaffna", "kurunegala", "negombo", "malabe", "homagama", "gampaha"];
        const words = searchQuery.toLowerCase().split(/\s+/);
        const locationMatch = words.find((w) => locationKeywords.includes(w));

        if (locationMatch) {
          filter.location = { $regex: locationMatch, $options: "i" };
          // Remove location from search query
          const remaining = words.filter((w) => w !== locationMatch).join(" ");
          if (remaining) {
            filter.$or = [
              { title: { $regex: remaining, $options: "i" } },
              { description: { $regex: remaining, $options: "i" } },
              { category: { $regex: remaining, $options: "i" } },
            ];
          }
        } else {
          filter.$or = [
            { title: { $regex: searchQuery, $options: "i" } },
            { description: { $regex: searchQuery, $options: "i" } },
            { company: { $regex: searchQuery, $options: "i" } },
            { category: { $regex: searchQuery, $options: "i" } },
          ];
        }
      }

      const jobs = await Job.find(filter)
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title company location type salary _id");

      if (jobs.length === 0) {
        return res.status(200).json({
          success: true,
          text: searchQuery
            ? `😔 I couldn't find any open jobs matching "${searchQuery}". Try different keywords or browse all available jobs.`
            : "😔 There are no open jobs at the moment. Please check back later!",
          suggestions: ["Show latest jobs", "How to apply?", "About JobZone"],
          jobs: [],
        });
      }

      const jobListText = jobs
        .map((j, i) => `${i + 1}. **${j.title}** at ${j.company} — ${j.location} (${j.type})`)
        .join("\n");

      return res.status(200).json({
        success: true,
        text: searchQuery
          ? `🔍 Here are jobs matching "${searchQuery}":\n\n${jobListText}\n\nClick on any job to view details and apply!`
          : `📋 Here are the latest jobs:\n\n${jobListText}\n\nClick on any job to view details and apply!`,
        suggestions: ["How to apply?", "Search more jobs", "My profile"],
        jobs: jobs.map((j) => ({ _id: j._id, title: j.title, company: j.company, location: j.location, type: j.type })),
      });
    }

    // 3. Fallback response
    return res.status(200).json({
      success: true,
      text: "🤔 I'm not sure I understand. Here are some things I can help with:\n\n• Search for jobs (e.g., \"Show cashier jobs\")\n• How to apply for a job\n• Create or generate a CV\n• Learn about match scores\n• Information about JobZone\n\nTry asking one of these!",
      suggestions: ["Show latest jobs", "How to apply?", "About JobZone", "Create resume"],
    });
  } catch (error) {
    return handleError(res, "Chatbot", error);
  }
};

export { handleMessage };
