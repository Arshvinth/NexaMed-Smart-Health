import {
  registerPatient,
  registerDoctor,
  login,
  getUserById,
  getCurrentUser,
  logoutToken
} from "../services/authService.js";

function sanitizeUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    verificationStatus: user.verificationStatus,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
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

export async function getUserByIdHandler(req, res, next) {
  try {
    const user = await getUserById(req.params.userId);
    res.json(sanitizeUser(user));
  } catch (e) {
    next(e);
  }
}

export async function getCurrentUserHandler(req, res, next) {
  try {
    const user = await getCurrentUser(req.user.userId);
    res.json(sanitizeUser(user));
  } catch (e) {
    next(e);
  }
}

export async function logoutHandler(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) return res.status(400).json({ message: "Token required" });

    await logoutToken(token);
    res.json({ message: "Logged out successfully" });
  } catch (e) {
    next(e);
  }
}
