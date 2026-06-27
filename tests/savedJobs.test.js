import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import {
  request,
  connectDB,
  clearDB,
  disconnectDB,
  createTestUserWithToken,
  createTestJob,
  SavedJob,
} from "./setup.js";

describe("Saved Jobs API", () => {
  let seeker, seekerToken;
  let job;

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

    const seekData = await createTestUserWithToken({
      role: "seeker",
      email: "seeker@test.com",
    });
    seeker = seekData.user;
    seekerToken = seekData.token;

    job = await createTestJob(empData.user._id);
  });

  describe("POST /api/saved-jobs", () => {
    it("should save a job", async () => {
      const res = await request
        .post("/api/saved-jobs")
        .set("Authorization", `Bearer ${seekerToken}`)
        .send({ jobId: job._id.toString() });

      expect(res.status).toBe(201);
      expect(res.body.message).toContain("saved");
    });

    it("should reject duplicate save", async () => {
      await request
        .post("/api/saved-jobs")
        .set("Authorization", `Bearer ${seekerToken}`)
        .send({ jobId: job._id.toString() });

      const res = await request
        .post("/api/saved-jobs")
        .set("Authorization", `Bearer ${seekerToken}`)
        .send({ jobId: job._id.toString() });

      expect(res.status).toBe(409);
    });

    it("should reject missing jobId", async () => {
      const res = await request
        .post("/api/saved-jobs")
        .set("Authorization", `Bearer ${seekerToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it("should require authentication", async () => {
      const res = await request
        .post("/api/saved-jobs")
        .send({ jobId: job._id.toString() });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/saved-jobs", () => {
    it("should return user's saved jobs", async () => {
      await SavedJob.create({ user: seeker._id, job: job._id });

      const res = await request
        .get("/api/saved-jobs")
        .set("Authorization", `Bearer ${seekerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.savedJobs.length).toBe(1);
    });
  });

  describe("DELETE /api/saved-jobs/:jobId", () => {
    it("should unsave a job", async () => {
      await SavedJob.create({ user: seeker._id, job: job._id });

      const res = await request
        .delete(`/api/saved-jobs/${job._id}`)
        .set("Authorization", `Bearer ${seekerToken}`);

      expect(res.status).toBe(200);

      // Verify it's gone
      const check = await SavedJob.findOne({ user: seeker._id, job: job._id });
      expect(check).toBeNull();
    });

    it("should return 404 for non-saved job", async () => {
      const res = await request
        .delete(`/api/saved-jobs/${job._id}`)
        .set("Authorization", `Bearer ${seekerToken}`);

      expect(res.status).toBe(404);
    });
  });
});
