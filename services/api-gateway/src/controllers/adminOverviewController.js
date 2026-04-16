import axios from "axios";

const userServiceUrl = process.env.USER_SERVICE_URL || "http://user-service:5001";
const doctorServiceUrl = process.env.DOCTOR_SERVICE_URL || "http://doctor-service:5002";
const appointmentServiceUrl =
  process.env.APPOINTMENT_SERVICE_URL || "http://appointment-service:5003";
const telemedicineServiceUrl =
  process.env.TELEMEDICINE_SERVICE_URL || "http://telemedicine-service:5005";
const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || "http://payment-service:5004";

function getRangeStart(range) {
  const now = new Date();

  if (range === "today") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  if (range === "week") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  // default: 24h
  return new Date(now.getTime() - 24 * 60 * 60 * 1000);
}

async function checkHealth(url) {
  try {
    await axios.get(`${url}/health`, { timeout: 2500 });
    return { up: true };
  } catch (e) {
    return { up: false, error: e.message };
  }
}

function forwardAuthHeader(req) {
  const headers = {};
  if (req.headers.authorization) {
    headers.authorization = req.headers.authorization;
  }
  return headers;
}

export async function getAdminOverview(req, res, next) {
  try {
    const range = (req.query.range || "24h").toString();
    const fromDate = getRangeStart(range).toISOString();
    const nowIso = new Date().toISOString();

    const headers = forwardAuthHeader(req);

    // 1) Service health checks
    const [userH, doctorH, appointmentH, telemedicineH, paymentH] = await Promise.all([
      checkHealth(userServiceUrl),
      checkHealth(doctorServiceUrl),
      checkHealth(appointmentServiceUrl),
      checkHealth(telemedicineServiceUrl),
      checkHealth(paymentServiceUrl),
    ]);

    // 2) Usage metrics (best-effort)
    // appointments from appointment-service (/api/appointments/me is role-scoped, not admin-wide)
    // so we use payment admin endpoint + pending doctors/users as partial metrics
    // and add optional admin aggregate endpoints later if needed.
    let pendingDoctorsCount = 0;
    let usersTotal = 0;
    let completedPayments = 0;
    let cancelledAppointments = 0;
    let completedAppointments = 0;
    let newAppointments = 0;
    let activityFeed = [];

    // user-service admin endpoints
    try {
      const [pendingDoctorsRes, usersRes] = await Promise.all([
        axios.get(`${userServiceUrl}/api/admin/doctors/pending`, { headers, timeout: 3000 }),
        axios.get(`${userServiceUrl}/api/admin/users?page=1&limit=1`, { headers, timeout: 3000 }),
      ]);
      pendingDoctorsCount = Array.isArray(pendingDoctorsRes.data)
        ? pendingDoctorsRes.data.length
        : 0;
      usersTotal = usersRes.data?.total || 0;
    } catch {
      // keep best-effort defaults
    }

    // payment-service admin endpoint (already added)
    try {
      const paymentsRes = await axios.get(`${paymentServiceUrl}/api/payments/admin`, {
        headers,
        params: { page: 1, limit: 200, fromDate, toDate: nowIso },
        timeout: 4000,
      });

      const paymentItems = paymentsRes.data?.items || [];
      completedPayments = paymentItems.filter((p) => p.status === "completed").length;
    } catch {
      // best-effort
    }

    // appointment activity + counts
    // Recommended endpoint to add in appointment-service:
    // GET /api/appointments/admin/feed?fromDate&toDate&limit
    // For now, attempt it (if available). If not, fallback empty.
    try {
      const feedRes = await axios.get(`${appointmentServiceUrl}/api/appointments/admin/feed`, {
        headers,
        params: { fromDate, toDate: nowIso, limit: 20 },
        timeout: 4000,
      });

      activityFeed = feedRes.data?.items || [];
      newAppointments = feedRes.data?.metrics?.newAppointments || 0;
      cancelledAppointments = feedRes.data?.metrics?.cancelledAppointments || 0;
      completedAppointments = feedRes.data?.metrics?.completedAppointments || 0;
    } catch {
      // best-effort (empty)
    }

    const serviceHealth = {
      "user-service": userH,
      "doctor-service": doctorH,
      "appointment-service": appointmentH,
      "telemedicine-service": telemedicineH,
      "payment-service": paymentH,
      "api-gateway": { up: true },
    };

    // DB status inferred from service health for now
    const dbUp = userH.up || doctorH.up || appointmentH.up || paymentH.up;

    return res.json({
      range,
      generatedAt: new Date().toISOString(),
      serviceHealth,
      databaseStatus: {
        mongoUp: dbUp,
        mode: "inferred",
      },
      usageMetrics: {
        usersTotal,
        pendingDoctorsCount,
        newAppointments,
        cancelledAppointments,
        completedAppointments,
        completedPayments,
      },
      activityFeed,
    });
  } catch (e) {
    next(e);
  }
}