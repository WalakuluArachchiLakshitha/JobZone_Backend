import Company from "../models/Company.js";
import { checkValidation, handleError, pickFields } from "../utils/helpers.js";

// Fields allowed when creating a company
const CREATABLE_COMPANY_FIELDS = [
  "name",
  "logo",
  "industry",
  "location",
  "size",
  "founded",
  "description",
  "website",
  "benefits",
  "culture",
];

// Fields an owner can edit on their company
const EDITABLE_COMPANY_FIELDS = [
  "name",
  "logo",
  "industry",
  "location",
  "size",
  "founded",
  "description",
  "website",
  "benefits",
  "culture",
  "openPositions",
];

// ── GET /api/companies ────────────────────────────────────────────────────────

const getCompanies = async (req, res) => {
  try {
    const {
      search,
      location,
      industry,
      teamSize,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { industry: { $regex: search, $options: "i" } },
      ];
    }

    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    if (industry) {
      filter.industry = { $regex: industry, $options: "i" };
    }

    if (teamSize) {
      filter.size = { $regex: teamSize, $options: "i" };
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    let sortObj = { createdAt: -1 };
    if (sort === "Alphabetical") {
      sortObj = { name: 1 };
    }

    const [companies, total] = await Promise.all([
      Company.find(filter).sort(sortObj).skip(skip).limit(limitNum),
      Company.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: companies.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      companies,
    });
  } catch (error) {
    return handleError(res, "Get companies", error);
  }
};

// ── GET /api/companies/:id ────────────────────────────────────────────────────

const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).populate(
      "owner",
      "name email"
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found.",
      });
    }

    return res.status(200).json({ success: true, company });
  } catch (error) {
    return handleError(res, "Get company by ID", error);
  }
};

// ── POST /api/companies ───────────────────────────────────────────────────────

const createCompany = async (req, res) => {
  if (checkValidation(req, res)) return;

  try {
    const companyData = pickFields(req.body, CREATABLE_COMPANY_FIELDS);
    companyData.owner = req.user._id;

    const company = await Company.create(companyData);

    return res.status(201).json({
      success: true,
      message: "Company created successfully.",
      company,
    });
  } catch (error) {
    return handleError(res, "Create company", error);
  }
};

// ── PUT /api/companies/:id ────────────────────────────────────────────────────

const updateCompany = async (req, res) => {
  if (checkValidation(req, res)) return;

  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found.",
      });
    }

    // Only the owner can edit — also reject if company has no owner
    if (
      !company.owner ||
      company.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own company profile.",
      });
    }

    const updates = pickFields(req.body, EDITABLE_COMPANY_FIELDS);

    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Company updated successfully.",
      company: updatedCompany,
    });
  } catch (error) {
    return handleError(res, "Update company", error);
  }
};

export { getCompanies, getCompanyById, createCompany, updateCompany };
