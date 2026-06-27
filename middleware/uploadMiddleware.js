import multer from "multer";
import path from "path";

// ── Storage config ────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir = "uploads/general";

    if (file.fieldname === "resume" || file.fieldname === "cv") {
      uploadDir = "uploads/resumes";
    } else if (file.fieldname === "avatar" || file.fieldname === "photo") {
      uploadDir = "uploads/avatars";
    } else if (file.fieldname === "attachment" || file.fieldname === "file") {
      uploadDir = "uploads/attachments";
    } else if (file.fieldname === "companyBR") {
      uploadDir = "uploads/documents";
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// ── File filter ───────────────────────────────────────────────────────────────

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".pdf",
    ".doc",
    ".docx",
  ];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Allowed: JPEG, PNG, WebP, PDF, DOC, DOCX"
      ),
      false
    );
  }
};

// ── Multer instances ──────────────────────────────────────────────────────────

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// Convenience presets
export const uploadResume = upload.single("resume");
export const uploadAvatar = upload.single("avatar");
export const uploadAttachment = upload.single("attachment");
export const uploadCompanyBR = upload.single("companyBR");
