import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import {
  request,
  connectDB,
  clearDB,
  disconnectDB,
  createTestUserWithToken,
  User,
} from "./setup.js";

describe("Users API", () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDB();
  });

  // ── GET PROFILE ────────────────────────────────────────────────────────

  describe("GET /api/users/profile", () => {
    it("should return the authenticated user's profile", async () => {
      const { token } = await createTestUserWithToken({ email: "profile@test.com" });

      const res = await request
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe("profile@test.com");
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it("should return 401 without token", async () => {
      const res = await request.get("/api/users/profile");
      expect(res.status).toBe(401);
    });
  });

  // ── UPDATE PROFILE ─────────────────────────────────────────────────────

  describe("PUT /api/users/profile", () => {
    it("should update allowed seeker fields", async () => {
      const { token } = await createTestUserWithToken({
        role: "seeker",
        email: "seeker@test.com",
      });

      const res = await request
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Name", title: "Developer", skills: ["React", "Node"] });

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe("Updated Name");
      expect(res.body.user.title).toBe("Developer");
      expect(res.body.user.skills).toEqual(["React", "Node"]);
    });

    it("should NOT allow seeker to set companyName", async () => {
      const { token } = await createTestUserWithToken({
        role: "seeker",
        email: "seeker2@test.com",
      });

      const res = await request
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ companyName: "Hacked Corp" });

      // Should respond 400 because no valid fields provided
      expect(res.status).toBe(400);
    });

    it("should NOT allow employer to set skills", async () => {
      const { token } = await createTestUserWithToken({
        role: "employer",
        email: "emp@test.com",
      });

      const res = await request
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ skills: ["hacking"] });

      expect(res.status).toBe(400);
    });

    it("should NOT allow changing role or email", async () => {
      const { token } = await createTestUserWithToken({
        role: "seeker",
        email: "norole@test.com",
      });

      const res = await request
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ role: "admin", email: "hack@test.com" });

      expect(res.status).toBe(400); // No valid fields
    });

    it("should return 400 for empty body", async () => {
      const { token } = await createTestUserWithToken({ email: "empty@test.com" });

      const res = await request
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("No valid fields");
    });
  });

  // ── CHANGE PASSWORD ────────────────────────────────────────────────────

  describe("PUT /api/users/change-password", () => {
    it("should change password with correct current password", async () => {
      const { token } = await createTestUserWithToken({
        email: "changepwd@test.com",
        password: "OldPass1234",
      });

      const res = await request
        .put("/api/users/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: "OldPass1234", newPassword: "NewPass1234" });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("Password changed");

      // Verify new password works
      const loginRes = await request.post("/api/auth/login").send({
        email: "changepwd@test.com",
        password: "NewPass1234",
      });
      expect(loginRes.status).toBe(200);
    });

    it("should reject wrong current password", async () => {
      const { token } = await createTestUserWithToken({
        email: "wrongpwd@test.com",
        password: "RealPass123",
      });

      const res = await request
        .put("/api/users/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: "WrongPass", newPassword: "NewPass1234" });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("incorrect");
    });

    it("should reject short new password", async () => {
      const { token } = await createTestUserWithToken({
        email: "shortpwd@test.com",
        password: "OldPass1234",
      });

      const res = await request
        .put("/api/users/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: "OldPass1234", newPassword: "12" });

      expect(res.status).toBe(400);
    });
  });

  // ── SEEKERS LISTING ────────────────────────────────────────────────────

  describe("GET /api/users/seekers", () => {
    it("should list seeker profiles (public)", async () => {
      await createTestUserWithToken({ role: "seeker", email: "s1@test.com", name: "Seeker One" });
      await createTestUserWithToken({ role: "seeker", email: "s2@test.com", name: "Seeker Two" });
      await createTestUserWithToken({ role: "employer", email: "e1@test.com", name: "Employer" });

      const res = await request.get("/api/users/seekers");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Should only return seekers, not employers
      expect(res.body.total).toBe(2);
      expect(res.body.seekers.length).toBe(2);
    });

    it("should filter seekers by search query", async () => {
      await createTestUserWithToken({ role: "seeker", email: "react@test.com", name: "React Dev", title: "React Developer" });
      await createTestUserWithToken({ role: "seeker", email: "python@test.com", name: "Python Dev", title: "Python Developer" });

      const res = await request.get("/api/users/seekers?search=React");

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
    });

    it("should paginate results", async () => {
      // Create 5 seekers
      for (let i = 0; i < 5; i++) {
        await createTestUserWithToken({ role: "seeker", email: `page${i}@test.com` });
      }

      const res = await request.get("/api/users/seekers?page=1&limit=2");

      expect(res.status).toBe(200);
      expect(res.body.seekers.length).toBe(2);
      expect(res.body.total).toBe(5);
      expect(res.body.totalPages).toBe(3);
    });
  });

  // ── SEEKER BY ID ───────────────────────────────────────────────────────

  describe("GET /api/users/seekers/:id", () => {
    it("should return a seeker by valid ID", async () => {
      const { user } = await createTestUserWithToken({
        role: "seeker",
        email: "findme@test.com",
        name: "Find Me",
      });

      const res = await request.get(`/api/users/seekers/${user._id}`);

      expect(res.status).toBe(200);
      expect(res.body.seeker.name).toBe("Find Me");
      expect(res.body.seeker.passwordHash).toBeUndefined();
    });

    it("should return 404 for non-existent seeker", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const res = await request.get(`/api/users/seekers/${fakeId}`);

      expect(res.status).toBe(404);
    });

    it("should return 400 for invalid ID format", async () => {
      const res = await request.get("/api/users/seekers/not-a-valid-id");

      expect(res.status).toBe(400);
    });
  });
});
