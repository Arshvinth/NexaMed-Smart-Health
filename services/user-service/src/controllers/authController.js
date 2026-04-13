import {
  registerPatient,
  registerDoctor,
  login
} from "../services/authService.js";

function sanitizeUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    verificationStatus: user.verificationStatus,
    createdAt: user.createdAt
  };
}

export async function registerPatientHandler(req, res, next) {
  try {
    const { fullName, email, password } = req.body || {};
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "fullName, email, password are required" });
    }

    const { user, token } = await registerPatient({ fullName, email, password });
    res.status(201).json({ user: sanitizeUser(user), token });
  } catch (e) {
    next(e);
  }
}

export async function registerDoctorHandler(req, res, next) {
  try {
    const { fullName, email, password } = req.body || {};
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "fullName, email, password are required" });
    }

    const { user, token } = await registerDoctor({ fullName, email, password });
    res.status(201).json({ user: sanitizeUser(user), token });
  } catch (e) {
    next(e);
  }
}

export async function loginHandler(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const { user, token } = await login({ email, password });
    res.json({ user: sanitizeUser(user), token });
  } catch (e) {
    next(e);
  }
}