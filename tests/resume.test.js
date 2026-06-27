import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import {
  request,
  connectDB,
  clearDB,
  disconnectDB,
  createTestUserWithToken,
  Resume,
} from "./setup.js";

describe("Resume API", () => {
  let seeker, seekerToken;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDB();

    const seekData = await createTestUserWithToken({
      role: "seeker",
      email: "seeker@test.com",
    });
    seeker = seekData.user;
    seekerToken = seekData.token;
  });

  describe("GET /api/resume", () => {
    it("should return empty resume structure when none exists", async () => {
      const res = await request
        .get("/api/resume")
        .set("Authorization", `Bearer ${seekerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.resume.skills).toEqual([]);
      expect(res.body.resume.education).toEqual([]);
      expect(res.body.resume.experience).toEqual([]);
    });

    it("should return saved resume data", async () => {
      await Resume.create({
        user: seeker._id,
        skills: ["React", "Node"],
        education: [{ school: "MIT", degree: "CS", year: "2020" }],
      });

      const res = await request
        .get("/api/resume")
        .set("Authorization", `Bearer ${seekerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.resume.skills).toEqual(["React", "Node"]);
      expect(res.body.resume.education.length).toBe(1);
    });

    it("should require authentication", async () => {
      const res = await request.get("/api/resume");
      expect(res.status).toBe(401);
    });
  });

  describe("PUT /api/resume", () => {
    it("should create resume via upsert (first time)", async () => {
      const res = await request
        .put("/api/resume")
        .set("Authorization", `Bearer ${seekerToken}`)
        .send({
          skills: ["JavaScript", "Python"],
          education: [{ school: "UoC", degree: "BSc", year: "2022" }],
          experience: [{ company: "Acme", role: "Dev", duration: "2y" }],
        });

      expect(res.status).toBe(200);
      expect(res.body.resume.skills).toEqual(["JavaScript", "Python"]);

      // Verify user field was set on upsert
      const saved = await Resume.findOne({ user: seeker._id });
      expect(saved).not.toBeNull();
      expect(saved.user.toString()).toBe(seeker._id.toString());
    });

    it("should update existing resume", async () => {
      await Resume.create({
        user: seeker._id,
        skills: ["Old Skill"],
      });

      const res = await request
        .put("/api/resume")
        .set("Authorization", `Bearer ${seekerToken}`)
        .send({ skills: ["New Skill 1", "New Skill 2"] });

      expect(res.status).toBe(200);
      expect(res.body.resume.skills).toEqual(["New Skill 1", "New Skill 2"]);
    });

    it("should handle empty body gracefully", async () => {
      const res = await request
        .put("/api/resume")
        .set("Authorization", `Bearer ${seekerToken}`)
        .send({});

      expect(res.status).toBe(200);
    });
  });
});
