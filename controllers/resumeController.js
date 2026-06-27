import Resume from "../models/Resume.js";
import User from "../models/User.js";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from "docx";
import { handleError } from "../utils/helpers.js";

// ── GET /api/resume ───────────────────────────────────────────────────────────

const getResume = async (req, res) => {
  try {
    let resume = await Resume.findOne({ user: req.user._id });

    if (!resume) {
      // Return an empty resume structure if none exists yet
      return res.status(200).json({
        success: true,
        resume: {
          user: req.user._id,
          skills: [],
          education: [],
          experience: [],
          portfolio: [],
          languages: [],
          references: [],
        },
      });
    }

    return res.status(200).json({ success: true, resume });
  } catch (error) {
    return handleError(res, "Get resume", error);
  }
};

// ── PUT /api/resume ───────────────────────────────────────────────────────────

const updateResume = async (req, res) => {
  try {
    const {
      skills,
      education,
      experience,
      portfolio,
      languages,
      references,
    } = req.body;

    const updateData = {};
    if (skills !== undefined) updateData.skills = skills;
    if (education !== undefined) updateData.education = education;
    if (experience !== undefined) updateData.experience = experience;
    if (portfolio !== undefined) updateData.portfolio = portfolio;
    if (languages !== undefined) updateData.languages = languages;
    if (references !== undefined) updateData.references = references;

    const resume = await Resume.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: updateData,
        $setOnInsert: { user: req.user._id },
      },
      { returnDocument: "after", runValidators: true, upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Resume updated successfully.",
      resume,
    });
  } catch (error) {
    return handleError(res, "Update resume", error);
  }
};

// ── GET /api/resume/generate-cv ───────────────────────────────────────────────
// Generates a professional DOCX CV from user profile + resume data

const generateCV = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const resume = await Resume.findOne({ user: req.user._id });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.name || "Job Seeker";

    // ── Build document sections ──────────────────────────────────────────
    const sections = [];

    // Header — Name & Contact
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: fullName, bold: true, size: 36, font: "Calibri" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: user.title || "Professional", italics: true, size: 24, font: "Calibri", color: "555555" }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          ...(user.email ? [new TextRun({ text: user.email, size: 20, font: "Calibri" })] : []),
          ...(user.phone ? [new TextRun({ text: `  |  ${user.phone}`, size: 20, font: "Calibri" })] : []),
          ...(user.location ? [new TextRun({ text: `  |  ${user.location}`, size: 20, font: "Calibri" })] : []),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      // Divider
      new Paragraph({
        border: { bottom: { color: "004ae4", space: 1, size: 6, style: BorderStyle.SINGLE } },
        spacing: { after: 200 },
      })
    );

    // Bio / Professional Summary
    if (user.bio) {
      sections.push(
        new Paragraph({ text: "PROFESSIONAL SUMMARY", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }),
        new Paragraph({ children: [new TextRun({ text: user.bio, size: 22, font: "Calibri" })], spacing: { after: 200 } })
      );
    }

    // Skills
    const allSkills = [...(user.skills || []), ...(resume?.skills || [])];
    const uniqueSkills = [...new Set(allSkills)];
    if (uniqueSkills.length > 0) {
      sections.push(
        new Paragraph({ text: "SKILLS", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }),
        new Paragraph({ children: [new TextRun({ text: uniqueSkills.join("  •  "), size: 22, font: "Calibri" })], spacing: { after: 200 } })
      );
    }

    // Experience
    if (resume?.experience && resume.experience.length > 0) {
      sections.push(
        new Paragraph({ text: "WORK EXPERIENCE", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } })
      );
      for (const exp of resume.experience) {
        if (exp.role || exp.company) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: exp.role || "Role", bold: true, size: 24, font: "Calibri" }),
                new TextRun({ text: ` — ${exp.company || "Company"}`, size: 22, font: "Calibri" }),
              ],
              spacing: { before: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: exp.duration || "", italics: true, size: 20, font: "Calibri", color: "777777" })],
            }),
            ...(exp.description
              ? [new Paragraph({ children: [new TextRun({ text: exp.description, size: 22, font: "Calibri" })], spacing: { after: 100 } })]
              : [])
          );
        }
      }
    }

    // Education
    if (resume?.education && resume.education.length > 0) {
      sections.push(
        new Paragraph({ text: "EDUCATION", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } })
      );
      for (const edu of resume.education) {
        if (edu.degree || edu.school) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: edu.degree || "Degree", bold: true, size: 24, font: "Calibri" }),
                new TextRun({ text: ` — ${edu.school || "Institution"}`, size: 22, font: "Calibri" }),
              ],
              spacing: { before: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: edu.year || "", italics: true, size: 20, font: "Calibri", color: "777777" })],
              spacing: { after: 100 },
            })
          );
        }
      }
    }

    // Languages
    if (resume?.languages && resume.languages.length > 0) {
      sections.push(
        new Paragraph({ text: "LANGUAGES", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } })
      );
      for (const lang of resume.languages) {
        if (lang.language) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${lang.language}`, bold: true, size: 22, font: "Calibri" }),
                new TextRun({ text: lang.level ? ` — ${lang.level}` : "", size: 22, font: "Calibri" }),
              ],
              spacing: { after: 50 },
            })
          );
        }
      }
    }

    // References
    if (resume?.references && resume.references.length > 0) {
      sections.push(
        new Paragraph({ text: "REFERENCES", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } })
      );
      for (const ref of resume.references) {
        if (ref.name) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: ref.name, bold: true, size: 22, font: "Calibri" }),
                new TextRun({ text: ref.relation ? ` (${ref.relation})` : "", size: 22, font: "Calibri" }),
              ],
              spacing: { before: 100 },
            }),
            new Paragraph({
              children: [
                ...(ref.phone ? [new TextRun({ text: `Phone: ${ref.phone}`, size: 20, font: "Calibri" })] : []),
                ...(ref.email ? [new TextRun({ text: `  |  Email: ${ref.email}`, size: 20, font: "Calibri" })] : []),
              ],
              spacing: { after: 100 },
            })
          );
        }
      }
    }

    // ── Build & send document ────────────────────────────────────────────
    const doc = new Document({
      sections: [{ children: sections }],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${fullName.replace(/\s+/g, "_")}_CV.docx"`);
    return res.send(buffer);
  } catch (error) {
    return handleError(res, "Generate CV", error);
  }
};

export { getResume, updateResume, generateCV };

