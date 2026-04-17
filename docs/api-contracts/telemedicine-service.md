
# Telemedicine Service — API Contract

Base URL (local dev): `http://localhost:5005`

Gateway route mapping (API Gateway):
- `/api/sessions/*` -> telemedicine-service

Authentication
- Supports `dev` (default) and `jwt` via `AUTH_MODE` env.

Dev mode headers (for Postman / local testing):
- `x-user-id`: string (example: `pat-001`)
- `x-role`: `doctor` | `patient` | `admin`

JWT mode: provide `Authorization: Bearer <token>` signed with `JWT_SECRET`.

---

## 1. Health Check

GET `/health`

Response 200
```json
{
  "success": true,
  "message": "telemedicine-service OK"
}
```

---

## 2. Create Session Link (stateless)

POST `/api/sessions`

Headers:
- `x-user-id` (dev) or `Authorization` (jwt)
- `x-role` (dev)

Body:
```json
{ "appointmentId": "apt-001" }
```

Response 201
```json
{
  "success": true,
  "data": {
    "appointmentId": "apt-001",
    "roomName": "nexamed-apt-001",
    "meetingLink": "https://meet.jit.si/nexamed-apt-001",
    "provider": "jitsi"
  }
}
```

Errors
- 400 Bad Request: missing/invalid `appointmentId`
- 401 Unauthorized: missing dev headers or invalid JWT

---

## 3. Get Session Link

GET `/api/sessions/:appointmentId`

Headers: same as above

Response 200
```json
{
  "success": true,
  "data": {
    "appointmentId": "apt-001",
    "roomName": "nexamed-apt-001",
    "meetingLink": "https://meet.jit.si/nexamed-apt-001",
    "provider": "jitsi"
  }
}
```

Notes
- This service is intentionally stateless for session links: `create` merely derives a deterministic room name from `appointmentId` using `buildSession()`.
- Default service port: `5005` (use `PORT` env to override).
