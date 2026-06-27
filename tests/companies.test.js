import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import {
  request,
  connectDB,
  clearDB,
  disconnectDB,
  createTestUserWithToken,
  createTestCompany,
  Company,
} from "./setup.js";

describe("Companies API", () => {
  let employer, employerToken;
  let seeker, seekerToken;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDB();

    const empData = await createTestUserWithToken({
      role: "employer",
      email: "emp@test.com",
    });
    employer = empData.user;
    employerToken = empData.token;

    const seekData = await createTestUserWithToken({
      role: "seeker",
      email: "seeker@test.com",
    });
    seeker = seekData.user;
    seekerToken = seekData.token;
  });

  // ── GET COMPANIES (Public) ─────────────────────────────────────────────

  describe("GET /api/companies", () => {
    it("should list companies without auth", async () => {
      await createTestCompany(employer._id, { name: "Company A", industry: "Tech" });
      await createTestCompany(employer._id, { name: "Company B", industry: "Finance" });

      const res = await request.get("/api/companies");

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
    });

    it("should filter by search", async () => {
      await createTestCompany(employer._id, { name: "TechCorp", industry: "Technology" });
      await createTestCompany(employer._id, { name: "FinCorp", industry: "Finance" });

      const res = await request.get("/api/companies?search=Tech");

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
    });

    it("should filter by location", async () => {
      await createTestCompany(employer._id, { name: "A", industry: "Tech", location: "Colombo" });
      await createTestCompany(employer._id, { name: "B", industry: "Tech", location: "Kandy" });

      const res = await request.get("/api/companies?location=Colombo");

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
    });
  });

  // ── GET COMPANY BY ID ──────────────────────────────────────────────────

  describe("GET /api/companies/:id", () => {
    it("should return a company by ID", async () => {
      const company = await createTestCompany(employer._id, { name: "DetailCorp" });

      const res = await request.get(`/api/companies/${company._id}`);

      expect(res.status).toBe(200);
      expect(res.body.company.name).toBe("DetailCorp");
    });

    it("should return 404 for non-existent company", async () => {
      const res = await request.get("/api/companies/507f1f77bcf86cd799439011");
      expect(res.status).toBe(404);
    });
  });

  // ── CREATE COMPANY ─────────────────────────────────────────────────────

  describe("POST /api/companies", () => {
    it("should create company as employer", async () => {
      const res = await request
        .post("/api/companies")
        .set("Authorization", `Bearer ${employerToken}`)
        .send({ name: "NewCorp", industry: "Tech", location: "Colombo" });

      expect(res.status).toBe(201);
      expect(res.body.company.name).toBe("NewCorp");
      expect(res.body.company.owner.toString()).toBe(employer._id.toString());
    });

    it("should reject seeker creating company", async () => {
      const res = await request
        .post("/api/companies")
        .set("Authorization", `Bearer ${seekerToken}`)
        .send({ name: "HackCorp", industry: "Tech", location: "Colombo" });

      expect(res.status).toBe(403);
    });

    it("should PREVENT mass assignment of rating/reviews", async () => {
      const res = await request
        .post("/api/companies")
        .set("Authorization", `Bearer ${employerToken}`)
        .send({
          name: "RatedCorp",
          industry: "Tech",
          location: "Colombo",
          rating: 5,
          reviews: 999,
          openPositions: 100,
        });

      expect(res.status).toBe(201);
      // These should be default values, NOT the attacker-supplied values
      expect(res.body.company.rating).toBe(0);
      expect(res.body.company.reviews).toBe(0);
      expect(res.body.company.openPositions).toBe(0);
    });

    it("should reject missing required fields", async () => {
      const res = await request
        .post("/api/companies")
        .set("Authorization", `Bearer ${employerToken}`)
        .send({ name: "Incomplete" });

      expect(res.status).toBe(400);
    });
  });

  // ── UPDATE COMPANY ─────────────────────────────────────────────────────

  describe("PUT /api/companies/:id", () => {
    it("should allow owner to update", async () => {
      const company = await createTestCompany(employer._id);

      const res = await request
        .put(`/api/companies/${company._id}`)
        .set("Authorization", `Bearer ${employerToken}`)
        .send({ name: "Updated Name" });

      expect(res.status).toBe(200);
      expect(res.body.company.name).toBe("Updated Name");
    });

    it("should reject non-owner update", async () => {
      const company = await createTestCompany(employer._id);

      const other = await createTestUserWithToken({
        role: "employer",
        email: "other@test.com",
      });

      const res = await request
        .put(`/api/companies/${company._id}`)
        .set("Authorization", `Bearer ${other.token}`)
        .send({ name: "Hacked" });

      expect(res.status).toBe(403);
    });

    it("should reject update on company with no owner", async () => {
      // Manually create a company without owner
      const orphanCompany = await Company.create({
        name: "Orphan",
        industry: "Tech",
        location: "Colombo",
      });

      const res = await request
        .put(`/api/companies/${orphanCompany._id}`)
        .set("Authorization", `Bearer ${employerToken}`)
        .send({ name: "Claimed" });

      expect(res.status).toBe(403);
    });
  });
});
