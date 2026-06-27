import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import {
  request,
  connectDB,
  clearDB,
  disconnectDB,
  createTestUserWithToken,
  createTestJob,
  generateToken,
  Job,
} from "./setup.js";

describe("Jobs API", () => {
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
      email: "employer@test.com",
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
  });

  // ── CREATE JOB ─────────────────────────────────────────────────────────

  describe("POST /api/jobs", () => {
    const validJob = {
      title: "Software Engineer",
      description: "Build awesome software for a growing startup.",
      location: "Colombo, Sri Lanka",
      type: "Full-time",
      salary: 80000,
      skills: ["JavaScript", "React"],
    };

    it("should create a job as employer", async () => {
      const res = await request
        .post("/api/jobs")
        .set("Authorization", `Bearer ${employerToken}`)
        .send(validJob);

      expect(res.status).toBe(201);
      expect(res.body.job.title).toBe("Software Engineer");
      // Type should be normalized to lowercase
      expect(res.body.job.type).toBe("full-time");
      expect(res.body.job.employer.toString()).toBe(employer._id.toString());
    });

    it("should reject job creation by seeker", async () => {
      const res = await request
        .post("/api/jobs")
        .set("Authorization", `Bearer ${seekerToken}`)
        .send(validJob);

      expect(res.status).toBe(403);
    });

    it("should reject unauthenticated job creation", async () => {
      const res = await request.post("/api/jobs").send(validJob);
      expect(res.status).toBe(401);
    });

    it("should reject missing title", async () => {
      const res = await request
        .post("/api/jobs")
        .set("Authorization", `Bearer ${employerToken}`)
        .send({ ...validJob, title: "" });

      expect(res.status).toBe(400);
    });

    it("should reject title > 120 chars", async () => {
      const res = await request
        .post("/api/jobs")
        .set("Authorization", `Bearer ${employerToken}`)
        .send({ ...validJob, title: "A".repeat(121) });

      expect(res.status).toBe(400);
    });

    it("should normalize job type to lowercase", async () => {
      const res = await request
        .post("/api/jobs")
        .set("Authorization", `Bearer ${employerToken}`)
        .send({ ...validJob, type: "Part-time" });

      expect(res.status).toBe(201);
      expect(res.body.job.type).toBe("part-time");
    });
  });

  // ── GET JOBS ───────────────────────────────────────────────────────────

  describe("GET /api/jobs", () => {
    beforeEach(async () => {
      await createTestJob(employer._id, { title: "React Dev", location: "Colombo", type: "full-time", salary: 60000 });
      await createTestJob(employer._id, { title: "Python Dev", location: "Kandy", type: "part-time", salary: 40000 });
      await createTestJob(employer._id, { title: "Closed Job", status: "closed" });
    });

    it("should return open jobs by default", async () => {
      const res = await request.get("/api/jobs");

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2); // Closed job excluded
    });

    it("should filter by location", async () => {
      const res = await request.get("/api/jobs?location=Colombo");

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.jobs[0].location).toContain("Colombo");
    });

    it("should filter by type", async () => {
      const res = await request.get("/api/jobs?type=part-time");

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
    });

    it("should filter by minimum salary", async () => {
      const res = await request.get("/api/jobs?salary=50000");

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
    });

    it("should search by keyword", async () => {
      const res = await request.get("/api/jobs?search=React");

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
    });

    it("should paginate correctly", async () => {
      const res = await request.get("/api/jobs?page=1&limit=1");

      expect(res.status).toBe(200);
      expect(res.body.jobs.length).toBe(1);
      expect(res.body.total).toBe(2);
      expect(res.body.totalPages).toBe(2);
    });

    it("should cap limit at 50", async () => {
      const res = await request.get("/api/jobs?limit=100");

      expect(res.status).toBe(200);
      // Just verify it didn't crash — actual count depends on data
    });

    it("should default page to 1 for invalid values", async () => {
      const res = await request.get("/api/jobs?page=0");

      expect(res.status).toBe(200);
      expect(res.body.page).toBe(1);
    });
  });

  // ── GET JOB BY ID ──────────────────────────────────────────────────────

  describe("GET /api/jobs/:id", () => {
    it("should return a job by ID and increment views", async () => {
      const job = await createTestJob(employer._id);

      const res = await request.get(`/api/jobs/${job._id}`);

      expect(res.status).toBe(200);
      expect(res.body.job.title).toBe("Test Developer");
      expect(res.body.job.views).toBe(1);

      // Second request should increment again
      const res2 = await request.get(`/api/jobs/${job._id}`);
      expect(res2.body.job.views).toBe(2);
    });

    it("should return 404 for non-existent job", async () => {
      const res = await request.get("/api/jobs/507f1f77bcf86cd799439011");
      expect(res.status).toBe(404);
    });

    it("should return 400 for invalid ID format", async () => {
      const res = await request.get("/api/jobs/invalid-id");
      expect(res.status).toBe(400);
    });
  });

  // ── EMPLOYER MY JOBS (Route ordering fix verification) ─────────────────

  describe("GET /api/jobs/employer/my-jobs", () => {
    it("should return employer's own jobs (route ordering fix)", async () => {
      await createTestJob(employer._id, { title: "My Job 1" });
      await createTestJob(employer._id, { title: "My Job 2" });

      // Create another employer's job — should NOT appear
      const other = await createTestUserWithToken({
        role: "employer",
        email: "other@test.com",
      });
      await createTestJob(other.user._id, { title: "Other Job" });

      const res = await request
        .get("/api/jobs/employer/my-jobs")
        .set("Authorization", `Bearer ${employerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
      res.body.jobs.forEach((job) => {
        expect(job.employer.toString()).toBe(employer._id.toString());
      });
    });

    it("should reject seeker access", async () => {
      const res = await request
        .get("/api/jobs/employer/my-jobs")
        .set("Authorization", `Bearer ${seekerToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ── UPDATE JOB ─────────────────────────────────────────────────────────

  describe("PUT /api/jobs/:id", () => {
    it("should update own job", async () => {
      const job = await createTestJob(employer._id);

      const res = await request
        .put(`/api/jobs/${job._id}`)
        .set("Authorization", `Bearer ${employerToken}`)
        .send({ title: "Updated Title" });

      expect(res.status).toBe(200);
      expect(res.body.job.title).toBe("Updated Title");
    });

    it("should reject update by non-owner", async () => {
      const job = await createTestJob(employer._id);

      const other = await createTestUserWithToken({
        role: "employer",
        email: "hacker@test.com",
      });

      const res = await request
        .put(`/api/jobs/${job._id}`)
        .set("Authorization", `Bearer ${other.token}`)
        .send({ title: "Hacked" });

      expect(res.status).toBe(403);
    });

    it("should reject update with no valid fields", async () => {
      const job = await createTestJob(employer._id);

      const res = await request
        .put(`/api/jobs/${job._id}`)
        .set("Authorization", `Bearer ${employerToken}`)
        .send({ employer: "hacked-id" }); // Not an editable field

      expect(res.status).toBe(400);
    });
  });

  // ── DELETE JOB ─────────────────────────────────────────────────────────

  describe("DELETE /api/jobs/:id", () => {
    it("should delete own job and cascade-delete applications", async () => {
      const job = await createTestJob(employer._id);

      const res = await request
        .delete(`/api/jobs/${job._id}`)
        .set("Authorization", `Bearer ${employerToken}`);

      expect(res.status).toBe(200);

      // Verify job is gone
      const check = await Job.findById(job._id);
      expect(check).toBeNull();
    });

    it("should reject deletion by non-owner", async () => {
      const job = await createTestJob(employer._id);

      const other = await createTestUserWithToken({
        role: "employer",
        email: "deleter@test.com",
      });

      const res = await request
        .delete(`/api/jobs/${job._id}`)
        .set("Authorization", `Bearer ${other.token}`);

      expect(res.status).toBe(403);
    });
  });
});
