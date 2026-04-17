# Doctor Service — API Contract

Base URL (local dev): `http://localhost:5002`

Gateway route mapping (API Gateway):
- `/api/doctors/*` -> doctor-service
- `/api/prescriptions/*` -> doctor-service

Authentication
- Supports two modes via `AUTH_MODE` env: `dev` (default) or `jwt`.

Dev mode (useful for local dev / Postman): provide headers on each request:
- `x-user-id`: string (e.g. `doc-123`)
- `x-role`: `DOCTOR` | `PATIENT` | `ADMIN`
- `x-verification-status`: `VERIFIED` | `PENDING` | `REJECTED` (optional; defaults to `VERIFIED` in dev)

JWT mode: set `AUTH_MODE=jwt` and include `Authorization: Bearer <token>` where token is signed with `JWT_SECRET`.

---

## Health

GET `/health`

Response 200
```json
{ "status": "ok", "service": "doctor-service" }
```

---

## Doctor Profile

GET `/api/doctors/me/profile`
- Auth: `auth` middleware (dev headers or JWT)
- Role: `DOCTOR`

Response 200: doctor profile object or `null` if none exists.

PUT `/api/doctors/me/profile`
- Auth: `auth`
- Role: `DOCTOR`
- Body: partial or full doctor profile JSON (see `Doctor` model below)

Response 200: saved/updated profile object

Doctor model (important fields)
```json
{
	"userId": "doc-123",
	"fullName": "Dr. Alice",
	"phone": "",
	"specialization": "General Medicine",
	"registrationNo": "REG-001",
	"experienceYears": 5,
	"fee": 500,
	"bio": "...",
	"verificationStatus": "PENDING|VERIFIED|REJECTED"
}
```

---

## Availability (doctor time slots)

POST `/api/doctors/me/availability`
- Auth: `auth`
- Role: `DOCTOR`
- Additional: `requireVerifiedDoctor` (doctor must be VERIFIED)
- Body:
```json
{ "startTime": "2026-04-20T09:00:00Z", "endTime": "2026-04-20T10:00:00Z" }
```

Responses:
- 201 Created: created slot object
- 409 Conflict: overlapping availability
- 400 Bad Request: invalid date inputs

GET `/api/doctors/me/availability`
- Auth: `auth`, Role: `DOCTOR`
- Response 200: list of availability slots for logged-in doctor

DELETE `/api/doctors/me/availability/:availabilityId`
- Auth: `auth`, Role: `DOCTOR`, `requireVerifiedDoctor`
- Response 200: deleted slot or 404 if not found

GET `/api/doctors/:doctorUserId/availability`
- Public endpoint: returns slots for the specified `doctorUserId`
- Optional query params: `from` (ISO date), `to` (ISO date)

---

## Doctors listing

GET `/api/doctors`
- Public listing of verified doctors
- Optional query params:
	- `specialization` (string) — filter by specialization
	- `q` (string) — text search across name/bio

Response 200: array of doctor profiles (only VERIFIED doctors are returned)

## Doctor profile lookup

GET `/api/doctors/:doctorId`
- Public lookup by MongoDB `_id`. Non-VERIFIED doctors return 404.

---

## Prescriptions

POST `/api/prescriptions`
- Auth: `auth`, Role: `DOCTOR`, `requireVerifiedDoctor`
- Body:
```json
{
	"appointmentId": "apt-001",
	"patientUserId": "pat-001",
	"items": [
		{ "medicineName": "Paracetamol", "dosage": "500mg", "frequency": "TID", "durationDays": 5 }
	],
	"notes": "Take after food"
}
```

Responses:
- 201 Created: created prescription object
- 400 Bad Request: missing required fields

GET `/api/prescriptions`
- Auth: `auth`, Role: `DOCTOR` or `PATIENT`
- Query params (optional): `appointmentId`, `patientUserId` (doctor only)
- Response 200: list of prescriptions visible to the caller (controller enforces ownership)

GET `/api/prescriptions/:id`
- Auth: `auth`, Role: `DOCTOR` or `PATIENT`
- Response 200: prescription object (403 if access denied, 404 if not found)

PUT `/api/prescriptions/:id`
- Auth: `auth`, Role: `DOCTOR`, `requireVerifiedDoctor`
- Body: partial update (e.g., `items`, `notes`)
- Response 200: updated prescription or 404

DELETE `/api/prescriptions/:id`
- Auth: `auth`, Role: `DOCTOR`, `requireVerifiedDoctor`
- Response 204 No Content on success

Prescription item schema
```json
{
	"medicineName": "Paracetamol",
	"dosage": "500mg",
	"frequency": "TID",
	"durationDays": 5
}
```

---

Errors & status codes (common)
- 400 Bad Request: invalid input (missing fields / invalid dates)
- 401 Unauthorized: missing dev auth headers or invalid JWT
- 403 Forbidden: role/ownership/verification restrictions
- 404 Not Found: resource not found (doctor/prescription)
- 409 Conflict: overlapping availability

---

Notes
- Replace dev auth headers with real JWTs when running in `AUTH_MODE=jwt`.
- Default service port: `5002` (use `PORT` env to override).
