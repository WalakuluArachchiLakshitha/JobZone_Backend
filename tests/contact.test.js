import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import {
  request,
  connectDB,
  clearDB,
  disconnectDB,
  createTestUserWithToken,
  Contact,
} from "./setup.js";

describe("Contact API", () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDB();
  });

  // ── SUBMIT CONTACT (Public) ────────────────────────────────────────────

  describe("POST /api/contact", () => {
    it("should submit a valid contact form", async () => {
      const res = await request.post("/api/contact").send({
        name: "John Doe",
        email: "john@example.com",
        message: "Hello, I need help!",
        subject: "Support",
        phone: "+94123456789",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      // Verify it's in the database
      const messages = await Contact.find();
      expect(messages.length).toBe(1);
      expect(messages[0].email).toBe("john@example.com");
    });

    it("should reject missing name", async () => {
      const res = await request.post("/api/contact").send({
        email: "test@test.com",
        message: "Hello",
      });

      expect(res.status).toBe(400);
    });

    it("should reject missing email", async () => {
      const res = await request.post("/api/contact").send({
        name: "Test",
        message: "Hello",
      });

      expect(res.status).toBe(400);
    });

    it("should reject invalid email", async () => {
      const res = await request.post("/api/contact").send({
        name: "Test",
        email: "not-an-email",
        message: "Hello",
      });

      expect(res.status).toBe(400);
    });

    it("should reject missing message", async () => {
      const res = await request.post("/api/contact").send({
        name: "Test",
        email: "test@test.com",
      });

      expect(res.status).toBe(400);
    });

    it("should reject message > 5000 chars", async () => {
      const res = await request.post("/api/contact").send({
        name: "Test",
        email: "test@test.com",
        message: "A".repeat(5001),
      });

      expect(res.status).toBe(400);
    });
  });

  // ── GET CONTACT MESSAGES (Admin only) ──────────────────────────────────

  describe("GET /api/contact", () => {
    it("should require authentication", async () => {
      const res = await request.get("/api/contact");
      expect(res.status).toBe(401);
    });

    it("should reject non-admin users", async () => {
      const { token } = await createTestUserWithToken({
        role: "seeker",
        email: "seeker@test.com",
      });

      const res = await request
        .get("/api/contact")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it("should reject employer users", async () => {
      const { token } = await createTestUserWithToken({
        role: "employer",
        email: "emp@test.com",
      });

      const res = await request
        .get("/api/contact")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it("should allow admin to list messages", async () => {
      // Create admin user directly in DB (since registration is blocked)
      const { token } = await createTestUserWithToken({
        role: "admin",
        email: "admin@test.com",
      });

      // Submit some contact messages
      await Contact.create([
        { name: "A", email: "a@test.com", message: "Hello A" },
        { name: "B", email: "b@test.com", message: "Hello B" },
      ]);

      const res = await request
        .get("/api/contact")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
    });
  });
});
