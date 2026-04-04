# Doctor Service API Contract

Base URL (dev): `http://localhost:5000`

Gateway route mapping:
- `/api/doctors/*` -> doctor-service
- `/api/prescriptions/*` -> doctor-service

## Auth (temporary dev mode)
Send headers in Postman:
- `x-user-id: <string>`
- `x-role: DOCTOR|PATIENT|ADMIN`
- `x-verification-status: VERIFIED|PENDING|REJECTED` (optional)

---

## Health
### GET `/health`
Response: `200 OK`
```json
{ "status": "ok", "service": "doctor-service" }
```

---

## Doctor Profile
### PUT `/api/doctors/me/profile` (DOCTOR)
### GET `/api/doctors/me/profile` (DOCTOR)

---

## Availability
### POST `/api/doctors/me/availability` (DOCTOR + VERIFIED)
### GET `/api/doctors/me/availability` (DOCTOR)
### DELETE `/api/doctors/me/availability/:availabilityId` (DOCTOR + VERIFIED)
### GET `/api/doctors/:doctorUserId/availability` (Public)

---

## Prescriptions
### POST `/api/prescriptions` (DOCTOR + VERIFIED)
### GET `/api/prescriptions` (DOCTOR or PATIENT)
### GET `/api/prescriptions/:id` (DOCTOR or PATIENT)