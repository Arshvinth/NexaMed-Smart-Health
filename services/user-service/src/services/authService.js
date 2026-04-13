import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const SALT_ROUNDS = 10;

function signToken(user) {
  const payload = {
    userId: user._id.toString(),
    role: user.role,
    verificationStatus: user.verificationStatus
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
}

export async function registerPatient({ fullName, email, password }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    const err = new Error("Email already registered");
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    passwordHash,
    role: "PATIENT",
    verificationStatus: "VERIFIED"
  });

  const token = signToken(user);
  return { user, token };
}

export async function registerDoctor({ fullName, email, password }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    const err = new Error("Email already registered");
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    passwordHash,
    role: "DOCTOR",
    verificationStatus: "PENDING"
  });

  const token = signToken(user);
  return { user, token };
}

export async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  const token = signToken(user);
  return { user, token };
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}