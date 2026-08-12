import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import {
  request,
  connectDB,
  clearDB,
  disconnectDB,
  createTestUserWithToken,
  createTestJob,
} from "./setup.js";

describe("Notifications API", () => {
  let employer, employerToken;
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
      companyName: "TestCorp",
    });
    employer = empData.user;
    employerToken = empData.token;

    const seekData = await createTestUserWithToken({
      role: "seeker",
      email: "seeker@test.com",
      name: "Jane Candidate",
    });
    seeker = seekData.user;
    seekerToken = seekData.token;

    job = await createTestJob(employer._id, { title: "Senior React Engineer", status: "open" });
  });

  it("should create a notification for the employer when a candidate applies", async () => {
    const applyRes = await request
      .post("/api/applications")
      .set("Authorization", `Bearer ${seekerToken}`)
      .send({ jobId: job._id.toString(), coverLetter: "Excited to apply!" });

    expect(applyRes.status).toBe(201);

    // Now fetch notifications as employer
    const notifRes = await request
      .get("/api/notifications")
      .set("Authorization", `Bearer ${employerToken}`);

    expect(notifRes.status).toBe(200);
    expect(notifRes.body.success).toBe(true);
    expect(notifRes.body.unreadCount).toBe(1);
    expect(notifRes.body.notifications.length).toBe(1);

    const notification = notifRes.body.notifications[0];
    expect(notification.title).toBe("New Job Application");
    expect(notification.sender.name).toBe("Jane Candidate");
    expect(notification.job.title).toBe("Senior React Engineer");
  });

  it("should allow employer to mark notification as read", async () => {
    await request
      .post("/api/applications")
      .set("Authorization", `Bearer ${seekerToken}`)
      .send({ jobId: job._id.toString() });

    const getRes = await request
      .get("/api/notifications")
      .set("Authorization", `Bearer ${employerToken}`);

    const notifId = getRes.body.notifications[0]._id;

    const patchRes = await request
      .patch(`/api/notifications/${notifId}/read`)
      .set("Authorization", `Bearer ${employerToken}`);

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.notification.read).toBe(true);
    expect(patchRes.body.unreadCount).toBe(0);
  });

  it("should allow employer to mark all notifications as read", async () => {
    await request
      .post("/api/applications")
      .set("Authorization", `Bearer ${seekerToken}`)
      .send({ jobId: job._id.toString() });

    const readAllRes = await request
      .patch("/api/notifications/read-all")
      .set("Authorization", `Bearer ${employerToken}`);

    expect(readAllRes.status).toBe(200);
    expect(readAllRes.body.unreadCount).toBe(0);
  });
});
