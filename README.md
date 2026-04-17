# NexaMed Smart Health Platform

NexaMed is a microservices-based healthcare platform for managing users, doctors, appointments, telemedicine sessions, payments, and admin operations.

---

## 🚀 Features

- **Authentication & Authorization**
  - Patient/Doctor/Admin registration and login
  - JWT-based authentication
  - Role-based access control (RBAC)

- **User Management**
  - Admin can create, update, delete, and list users
  - Doctor verification workflow (PENDING → VERIFIED/REJECTED)

- **Appointments**
  - Slot-based booking
  - Confirm/cancel/complete/reschedule appointment flows
  - Doctor-patient scoped appointment access

- **Telemedicine**
  - Session creation integrated with appointment confirmation
  - WebSocket support via API Gateway

- **Payments**
  - Stripe PaymentIntent integration
  - Webhook-based payment confirmation
  - Appointment confirmation after successful payment
  - Admin transaction listing with search/filter/pagination

- **Admin Operations Dashboard**
  - Service health monitoring
  - Usage metrics (Today / Last 24h / This Week)
  - Activity feed (new/cancelled/completed appointments)
  - Database status (inferred health)

---

## 🧱 Architecture

### Services

- `api-gateway` (Node.js/Express): entry point, routing/proxy, admin overview aggregation
- `user-service` (Node.js/Express/MongoDB): auth, users, admin user management
- `doctor-service` (Node.js/Express/MongoDB): doctor domain data
- `appointment-service` (Node.js/Express/MongoDB): booking lifecycle
- `telemedicine-service` (Node.js/Express): session handling
- `payment-service` (Node.js/Express/MongoDB): Stripe payment flow
- `patient-service`: patient-specific domain logic
- `SymtomesChecker-Service`: AI symptom checker

### High-Level Flow

1. Client calls **API Gateway**
2. Gateway proxies request to corresponding service
3. Service validates JWT + role
4. Service performs business logic + DB operation
5. Response returned through Gateway to Client

---

## 📂 Repository Structure

```text
.
├─ client/
├─ services/
│  ├─ api-gateway/
│  ├─ user-service/
│  ├─ doctor-service/
│  ├─ appointment-service/
│  ├─ telemedicine-service/
│  ├─ payment-service/
│  ├─ patient-service/
│  └─ SymtomesChecker-Service/
├─ deploy/
│  ├─ docker-compose/
│  └─ kubernetes/
└─ README.md
```

---

## ⚙️ Tech Stack

- **Frontend:** React, TailwindCSS, Axios
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **Payments:** Stripe
- **Realtime:** Socket.IO (proxied via API Gateway)
- **Containerization:** Docker / Docker Compose
- **Orchestration:** Kubernetes (Docker Desktop / local cluster)

---

## 🔐 Authentication & Roles

JWT payload includes:

- `userId`
- `role` (`PATIENT`, `DOCTOR`, `ADMIN`)
- `verificationStatus`

Protected routes use:
- `auth` middleware (JWT verification)
- `requireRole(...roles)` middleware

---

## 🛠️ Environment Variables

### Client (`client/.env`)
```env
REACT_APP_API_GATEWAY_URL=http://localhost:5000
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### Core Backend (common)
```env
JWT_SECRET=change_me_super_secret
CORS_ORIGIN=http://localhost:3000
```

### Payment Service
```env
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
INTERNAL_API_SECRET=your_internal_secret
```

---

## 🐳 Run with Docker Compose

```bash
cd deploy/docker-compose
docker compose up --build
```

API Gateway: `http://localhost:5000`  
MongoDB (Compass): `mongodb://127.0.0.1:27017`

> Inside containers, use `mongo` hostname, not `127.0.0.1`.

---

## ☸️ Run with Kubernetes (local)

```bash
kubectl apply -f deploy/kubernetes/ --recursive
kubectl get pods
kubectl get svc
kubectl port-forward svc/api-gateway 5000:5000
```

### Important
Ensure `JWT_SECRET` is present in:
- `user-service`
- `api-gateway`
- any service verifying JWT

---

## 📊 Admin Overview API

### Endpoint
`GET /api/admin/overview?range=today|24h|week`

### Requires
- Bearer token
- `ADMIN` role

### Returns
- service health
- usage metrics
- database status
- activity feed

---

## 💳 Payment APIs (sample)

- `POST /api/payments/create-intent`
- `POST /api/payments/webhook`
- `GET /api/payments/:id`
- `GET /api/payments/admin` (admin list + filters + pagination)

---

## 🧪 Health Endpoints

- `GET /health` on each service
- Gateway aggregates these in admin overview

---

## 🧯 Troubleshooting

### Invalid or expired token on all pages
- Verify same `JWT_SECRET` across issuer/verifier services
- Re-login after changing secret
- Confirm env in running pod/container (not only local `.env` files)

### Cannot GET `/api/admin/overview`
- Ensure route is mounted in gateway before proxy middleware
- Exclude `/api/admin/overview` from user-service proxy catch-all

### Stripe publishable key undefined (frontend)
- Add `REACT_APP_STRIPE_PUBLISHABLE_KEY` to `client/.env`
- Restart React dev server

---

## 🔭 Future Improvements

- Centralized logging and tracing
- Prometheus/Grafana metrics
- Circuit breaker and retry policy
- Token revocation/blacklist logout strategy
- Namespace-based Kubernetes manifests
- CI/CD pipeline (build, test, deploy)

---

## 👨‍💻 Contributors

- Arachchi E R D
- POOJANI K H S
- ARSHVINTH S
- SONALI G D D

## Docker Desktop & Compose quickstart

1. Install Docker Desktop and start the Docker engine in Docker Desktop.

2. Start all services with Docker Compose (run from repository root):

```bash
docker compose -f deploy/docker-compose/docker-compose.yml up --build
```

Wait ~10–15 seconds for services to initialize.

3. Start the frontend (client) in a separate terminal:

```bash
cd client
npm start
```

4. To stop the Docker Compose stack:

```bash
docker compose -f deploy/docker-compose/docker-compose.yml down
```

---

## Kubernetes deployment and run all services

### Terminal 1 (repo root: NexaMed-Smart-Health/)

Build images expected by the deployments:

```bash
docker build -t api-gateway:local services/api-gateway
```

```bash
docker build -t user-service:local services/user-service
```

```bash
docker build -t doctor-service:local services/doctor-service
```

```bash
docker build -t appointment-service:local services/appointment-service
```

```bash
docker build -t payment-service:local services/payment-service
```

```bash
docker build -t telemedicine-service:local services/telemedicine-service
```

```bash
docker build -t symtomeschecker-service:local services/SymtomesChecker-Service
```

```bash
docker build -t patient-service:local services/patient-service
```

Switch kubectl context and create secrets:

```bash
kubectl config use-context docker-desktop
```

```bash
kubectl apply -f deploy/kubernetes/shared/app-secrets.yaml
```

Create `jwt-secret`:

```bash
kubectl create secret generic jwt-secret --from-literal=secret="change_me_super_secret" --dry-run=client -o yaml | kubectl apply -f -
```

Create `internal-secret`:

```bash
kubectl create secret generic internal-secret --from-literal=secret="0c154b6369f2b9a28f02bb4a9091d2e5aff1e7fbcfd026017b55aca21c15237cf2a2ecf65cade6e5e22d66c7e718b572" --dry-run=client -o yaml | kubectl apply -f -
```

Create `stripe-secret` (replace values for production):

```bash
kubectl create secret generic stripe-secret --from-literal=secret_key="sk_test_..." --from-literal=publishable_key="pk_test_..." --from-literal=webhook_secret="whsec_your_webhook_secret" --dry-run=client -o yaml | kubectl apply -f -
```

Apply service manifests (example: SymtomesChecker + patient):

```bash
kubectl apply -f deploy/kubernetes/symtomeschecker-service
```

```bash
kubectl apply -f deploy/kubernetes/patient-service
```

Set `AI_SERVICE_URL` in-cluster for `patient-service` (or edit the manifest):

```bash
kubectl set env deployment/patient-service AI_SERVICE_URL=http://symtomeschecker-service:8000
```

Apply all manifests (PowerShell-safe):

```bash
kubectl apply -f deploy/kubernetes/ --recursive
```

Check pods and services:

```bash
kubectl get pods
```

```bash
kubectl get svc
```

Expose API Gateway locally (port-forward):

```bash
kubectl port-forward svc/api-gateway 5000:5000
```

### Terminal 2 (client)

Start the frontend dev server:

```bash
cd client
npm start
```

### Terminal 3 (repo root)

Port-forward MongoDB for local tooling:

```bash
kubectl port-forward svc/mongo 27017:27017
```

Then open MongoDB Compass and connect to:

```text
mongodb://localhost:27017/
```

After making manifest or image changes:

```bash
# re-apply manifests
kubectl apply -f deploy/kubernetes/ --recursive
```

```bash
# restart all deployments to pick up env changes
kubectl rollout restart deployment
```

To shut down the Kubernetes resources created by these manifests:

```bash
kubectl delete -f deploy/kubernetes/ --recursive
```


