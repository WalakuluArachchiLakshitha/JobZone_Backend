/**
 * Shared test helper — sets up / tears down the in-memory Mongo connection
 * and provides convenience functions for creating test users + tokens.
 */
import mongoose from "mongoose";
import supertest from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import app from "../index.js";
import User from "../models/User.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Company from "../models/Company.js";
import SavedJob from "../models/SavedJob.js";
import Contact from "../models/Contact.js";
import Resume from "../models/Resume.js";

export const request = supertest(app);

// ── Lifecycle helpers ─────────────────────────────────────────────────────

export async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }
}

export async function clearDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

export async function disconnectDB() {
  await mongoose.connection.close();
}

// ── Factory helpers ───────────────────────────────────────────────────────

export async function createTestUser(overrides = {}) {
  const salt = await bcrypt.genSalt(4); // fast for tests
  const passwordHash = await bcrypt.hash(overrides.password || "Test1234", salt);

  const defaults = {
    name: "Test User",
    email: `test-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
    passwordHash,
    role: "seeker",
    firstName: "Test",
    lastName: "User",
  };

  const userData = { ...defaults, ...overrides, passwordHash };
  const user = await User.create(userData);
  return user;
}

export function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
}

export async function createTestUserWithToken(overrides = {}) {
  const user = await createTestUser(overrides);
  const token = generateToken(user._id);
  return { user, token };
}

export async function createTestJob(employerId, overrides = {}) {
  const defaults = {
    title: "Test Developer",
    description: "A test job description that is long enough to pass validation.",
    company: "Test Corp",
    location: "Colombo",
    type: "full-time",
    salary: 50000,
    employer: employerId,
    status: "open",
  };

  return Job.create({ ...defaults, ...overrides });
}

export async function createTestCompany(ownerId, overrides = {}) {
  const defaults = {
    name: "Test Company",
    industry: "Technology",
    location: "Colombo",
    owner: ownerId,
  };

  return Company.create({ ...defaults, ...overrides });
}

export { User, Job, Application, Company, SavedJob, Contact, Resume };
