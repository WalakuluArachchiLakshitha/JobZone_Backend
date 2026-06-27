import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import {
  request,
  connectDB,
  clearDB,
  disconnectDB,
  createTestUser,
} from "./setup.js";

describe("Auth API", () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDB();
  });

  // ── REGISTRATION ───────────────────────────────────────────────────────

  describe("POST /api/auth/register", () => {
    it("should register a new seeker (candidate role)", async () => {
      const res = await request.post("/api/auth/register").send({
        name: "John Doe",
        email: "john@test.com",
        password: "Test1234",
        role: "candidate",
        firstName: "John",
        lastName: "Doe",
        country: "Sri Lanka",
        region: "Western",
        city: "Colombo",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.role).toBe("seeker");
      expect(res.body.user.email).toBe("john@test.com");
      // passwordHash must NEVER be returned
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it("should register a new employer with organization name", async () => {
      const res = await request.post("/api/auth/register").send({
        name: "Jane Corp",
        email: "jane@corp.com",
        password: "Test1234",
        role: "employer",
        organizationName: "JaneCorp Ltd",
      });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe("employer");
      expect(res.body.user.companyName).toBe("JaneCorp Ltd");
    });

    it("should reject duplicate email", async () => {
      await createTestUser({ email: "dup@test.com" });

      const res = await request.post("/api/auth/register").send({
        name: "Duplicate",
        email: "dup@test.com",
        password: "Test1234",
        role: "candidate",
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it("should reject missing password", async () => {
      const res = await request.post("/api/auth/register").send({
        email: "nopwd@test.com",
        role: "candidate",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject short password (< 6 chars)", async () => {
      const res = await request.post("/api/auth/register").send({
        email: "short@test.com",
        password: "123",
        role: "candidate",
      });

      expect(res.status).toBe(400);
    });

    it("should reject invalid email format", async () => {
      const res = await request.post("/api/auth/register").send({
        email: "notanemail",
        password: "Test1234",
        role: "candidate",
      });

      expect(res.status).toBe(400);
    });

    it("should BLOCK admin registration", async () => {
      const res = await request.post("/api/auth/register").send({
        name: "Hacker",
        email: "admin@hack.com",
        password: "Test1234",
        role: "admin",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject invalid role", async () => {
      const res = await request.post("/api/auth/register").send({
        email: "bad@test.com",
        password: "Test1234",
        role: "superuser",
      });

      expect(res.status).toBe(400);
    });
  });

  // ── LOGIN ──────────────────────────────────────────────────────────────

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await createTestUser({
        email: "login@test.com",
        password: "Test1234",
        role: "seeker",
      });
    });

    it("should login with correct credentials", async () => {
      const res = await request.post("/api/auth/login").send({
        email: "login@test.com",
        password: "Test1234",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it("should reject wrong password", async () => {
      const res = await request.post("/api/auth/login").send({
        email: "login@test.com",
        password: "WrongPass",
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid email or password.");
    });

    it("should reject non-existent email", async () => {
      const res = await request.post("/api/auth/login").send({
        email: "nobody@test.com",
        password: "Test1234",
      });

      expect(res.status).toBe(401);
      // Same message as wrong password (no email enumeration)
      expect(res.body.message).toBe("Invalid email or password.");
    });

    it("should reject empty body", async () => {
      const res = await request.post("/api/auth/login").send({});

      expect(res.status).toBe(400);
    });
  });

  // ── TOKEN VERIFICATION ─────────────────────────────────────────────────

  describe("Token verification", () => {
    it("should reject request without token", async () => {
      const res = await request.get("/api/users/profile");

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("No token provided");
    });

    it("should reject invalid token", async () => {
      const res = await request
        .get("/api/users/profile")
        .set("Authorization", "Bearer invalid-token-here");

      expect(res.status).toBe(401);
    });

    it("should accept valid token", async () => {
      const user = await createTestUser({ email: "token@test.com" });
      const loginRes = await request.post("/api/auth/login").send({
        email: "token@test.com",
        password: "Test1234",
      });

      const res = await request
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${loginRes.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe("token@test.com");
    });
  });
});
