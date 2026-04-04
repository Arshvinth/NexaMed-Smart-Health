# Telemedicine Service — API Contract

## Base URL
- Docker Compose / Local: `http://localhost:5000`

Gateway route mapping:
- `/api/sessions/*` -> telemedicine-service

## Authentication (DEV mode)
This service uses dev-auth headers (until JWT is integrated).

### Required headers
- `x-user-id`: string (example: `pat-001`)
- `x-role`: `doctor` | `patient` | `admin`

If headers are missing, API returns:
- `401 Unauthorized`

---

## 1. Health Check

### Request
**GET** `/health`

### Response
**200 OK**
```json
{
  "success": true,
  "message": "telemedicine-service OK"
}
```

---

## 2. Create Session Link (Stateless)

### Request
**POST** `/api/sessions`

Headers:
- `x-user-id`
- `x-role`

Body:
```json
{
  "appointmentId": "apt-001"
}
```

### Response
**201 Created**
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

### Errors
- **400 Bad Request** if `appointmentId` is missing/empty
- **401 Unauthorized** if auth headers missing

---

## 3. Get Session Link

### Request
**GET** `/api/sessions/:appointmentId`

Headers:
- `x-user-id`
- `x-role`

Example:
`GET /api/sessions/apt-001`

### Response
**200 OK**
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