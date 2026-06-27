import Contact from "../models/Contact.js";
import { checkValidation, handleError } from "../utils/helpers.js";

// ── POST /api/contact ─────────────────────────────────────────────────────────

const submitContact = async (req, res) => {
  if (checkValidation(req, res)) return;

  const { name, subject, email, phone, message } = req.body;

  try {
    await Contact.create({ name, subject, email, phone, message });

    return res.status(201).json({
      success: true,
      message: "Your message has been sent successfully. We'll get back to you soon!",
    });
  } catch (error) {
    return handleError(res, "Submit contact", error);
  }
};

// ── GET /api/contact (admin only — list messages) ─────────────────────────────

const getContactMessages = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [messages, total] = await Promise.all([
      Contact.find().sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Contact.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      count: messages.length,
      total,
      page: pageNum,
      messages,
    });
  } catch (error) {
    return handleError(res, "Get contact messages", error);
  }
};

export { submitContact, getContactMessages };
