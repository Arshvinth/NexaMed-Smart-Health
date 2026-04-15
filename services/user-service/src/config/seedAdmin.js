import bcrypt from "bcryptjs";
import User from "../models/User.js";

export async function seedAdminIfNeeded() {
  const enabled = (process.env.ADMIN_SEED_ENABLED || "false").toLowerCase() === "true";
  if (!enabled) return;

  const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "";
  const fullName = process.env.ADMIN_NAME || "System Admin";

  if (!email || !password) {
    console.warn("[user-service] Admin seed skipped: ADMIN_EMAIL/ADMIN_PASSWORD missing");
    return;
  }

  const existing = await User.findOne({ email });

  if (existing) {
    // Ensure role/status are correct if user already exists
    let changed = false;
    if (existing.role !== "ADMIN") {
      existing.role = "ADMIN";
      changed = true;
    }
    if (existing.verificationStatus !== "VERIFIED") {
      existing.verificationStatus = "VERIFIED";
      changed = true;
    }
    if (changed) {
      await existing.save();
      console.log("[user-service] Admin user updated");
    } else {
      console.log("[user-service] Admin already exists");
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await User.create({
    fullName,
    email,
    passwordHash,
    role: "ADMIN",
    verificationStatus: "VERIFIED"
  });

  console.log("[user-service] Admin seeded successfully");
}