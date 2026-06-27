import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import {
  request,
  connectDB,
  clearDB,
  disconnectDB,
  createTestUserWithToken,
  createTestJob,
  Application,
} from "./setup.js";

describe("Applications API", () => {
  let employer, employerToken;
  let seeker, seekerToken;
  let openJob, closedJob;

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
      companyName: "TestCorp",
    });
    employer = empData.user;
    employerToken = empData.token;

    const seekData = await createTestUserWithToken({
      role: "seeker",
      email: "seeker@test.com",
    });
    seeker = seekData.user;
    seekerToken = seekData.token;

    openJob = await createTestJob(employer._id, { title: "Open Job", status: "open" });
    closedJob = await createTestJob(employer._id, { title: "Closed Job", status: "closed" });
  });

  // ── APPLY FOR JOB ──────────────────────────────────────────────────────

  describe("POST /api/applications", () => {
    it("should allow seeker to apply for an open job", async () => {
      const res = await request
        .post("/api/applications")
        .set("Authorization", `Bearer ${seekerToken}`)
        .send({ jobId: openJob._id.toString(), coverLetter: "I'm interested!" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.application.status).toBe("pending");
    });

    it("should reject duplicate application", async () => {
      await request
        .post("/api/applications")
        .set("Authorization", `Bearer ${seekerToken}`)
        .send({ jobId: openJob._id.toString() });

      const res = await request
        .post("/api/applications")
        .set("Authorization", `Bearer ${seekerToken}`)
        .send({ jobId: openJob._id.toString() });

      expect(res.status).toBe(409);
    });

    it("should reject application for closed job", async () => {
      const res = await request
        .post("/api/applications")
        .set("Authorization", `Bearer ${seekerToken}`)
        .send({ jobId: closedJob._id.toString() });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("no longer accepting");
    });

    it("should reject employer applying", async () => {
      const res = await request
        .post("/api/applications")
        .set("Authorization", `Bearer ${employerToken}`)
        .send({ jobId: openJob._id.toString() });

      expect(res.status).toBe(403);
    });

    it("should reject invalid job ID", async () => {
      const res = await request
        .post("/api/applications")
        .set("Authorization", `Bearer ${seekerToken}`)
        .send({ jobId: "not-valid" });

      expect(res.status).toBe(400);
    });

    it("should reject non-existent job ID", async () => {
      const res = await request
        .post("/api/applications")
        .set("Authorization", `Bearer ${seekerToken}`)
        .send({ jobId: "507f1f77bcf86cd799439011" });

      expect(res.status).toBe(404);
    });
  });

  // ── GET APPLICATIONS ───────────────────────────────────────────────────

  describe("GET /api/applications", () => {
    beforeEach(async () => {
      await Application.create({
        job: openJob._id,
        seeker: seeker._id,
        status: "pending",
      });
    });

    it("should return seeker's own applications", async () => {
      const res = await request
        .get("/api/applications")
        .set("Authorization", `Bearer ${seekerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.applications.length).toBe(1);
      expect(res.body.applications[0].job).toBeDefined();
    });

    it("should return applications for employer's jobs", async () => {
      const res = await request
        .get("/api/applications")
        .set("Authorization", `Bearer ${employerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.applications.length).toBe(1);
      expect(res.body.applications[0].seeker).toBeDefined();
    });
  });

  // ── UPDATE APPLICATION STATUS ──────────────────────────────────────────

  describe("PATCH /api/applications/:id", () => {
    let application;

    beforeEach(async () => {
      application = await Application.create({
        job: openJob._id,
        seeker: seeker._id,
        status: "pending",
      });
    });

    it("should allow employer to update application status", async () => {
      const res = await request
        .patch(`/api/applications/${application._id}`)
        .set("Authorization", `Bearer ${employerToken}`)
        .send({ status: "shortlisted" });

      expect(res.status).toBe(200);
      expect(res.body.application.status).toBe("shortlisted");
    });

    it("should reject non-owner employer", async () => {
      const other = await createTestUserWithToken({
        role: "employer",
        email: "other@test.com",
      });

      const res = await request
        .patch(`/api/applications/${application._id}`)
        .set("Authorization", `Bearer ${other.token}`)
        .send({ status: "rejected" });

      expect(res.status).toBe(403);
    });

    it("should reject invalid status", async () => {
      const res = await request
        .patch(`/api/applications/${application._id}`)
        .set("Authorization", `Bearer ${employerToken}`)
        .send({ status: "hired" }); // Not a valid status

      expect(res.status).toBe(400);
    });

    it("should reject seeker updating status", async () => {
      const res = await request
        .patch(`/api/applications/${application._id}`)
        .set("Authorization", `Bearer ${seekerToken}`)
        .send({ status: "accepted" });

      expect(res.status).toBe(403);
    });
  });
});
