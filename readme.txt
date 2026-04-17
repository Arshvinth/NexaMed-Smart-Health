
============================================================
Docker Desktop & Compose quickstart
------------------------------------------------------------
1) Install Docker Desktop and start the Docker engine in Docker Desktop.

2) From repository root, start all services with Docker Compose:

	Terminal 1 (repo root: NexaMed-Smart-Health/)

	docker compose -f deploy/docker-compose/docker-compose.yml up --build

	Wait ~10–15 seconds for services to initialize.

3) Start the frontend in a separate terminal:

	Terminal 2 (client)

	cd client
	npm start

4) To stop the Docker Compose stack:

	docker compose -f deploy/docker-compose/docker-compose.yml down

============================================================

Kubernetes deployment and run all services
------------------------------------------------------------
Terminal 1 (repo root: NexaMed-Smart-Health/)

# Build images expected by the deployments
docker build -t api-gateway:local services/api-gateway
docker build -t user-service:local services/user-service
docker build -t doctor-service:local services/doctor-service
docker build -t appointment-service:local services/appointment-service
docker build -t payment-service:local services/payment-service
docker build -t telemedicine-service:local services/telemedicine-service
docker build -t symtomeschecker-service:local services/SymtomesChecker-Service
docker build -t patient-service:local services/patient-service

# Switch kubectl context and create secrets
kubectl config use-context docker-desktop

kubectl apply -f deploy/kubernetes/shared/app-secrets.yaml

# Create jwt-secret (replace value as needed)
kubectl create secret generic jwt-secret --from-literal=secret="change_me_super_secret" --dry-run=client -o yaml | kubectl apply -f -

# Create internal-secret (replace value as needed)
kubectl create secret generic internal-secret --from-literal=secret="REPLACE_WITH_YOUR_INTERNAL_SECRET" --dry-run=client -o yaml | kubectl apply -f -

# Create stripe-secret (replace test keys for your environment)
kubectl create secret generic stripe-secret --from-literal=secret_key="sk_test_..." --from-literal=publishable_key="pk_test_..." --from-literal=webhook_secret="whsec_your_webhook_secret" --dry-run=client -o yaml | kubectl apply -f -

# Apply service manifests (example: SymtomesChecker + patient)
kubectl apply -f deploy/kubernetes/symtomeschecker-service
kubectl apply -f deploy/kubernetes/patient-service

# Set AI_SERVICE_URL in-cluster for patient-service (or edit manifest)
kubectl set env deployment/patient-service AI_SERVICE_URL=http://symtomeschecker-service:8000

# Apply all manifests (PowerShell-safe)
kubectl apply -f deploy/kubernetes/ --recursive

# Check pods and services
kubectl get pods
kubectl get svc

# Expose API Gateway locally (port-forward)
kubectl port-forward svc/api-gateway 5000:5000

Terminal 2 (client)

cd client
npm start

Terminal 3 (repo root)

# Port-forward MongoDB for local tooling
kubectl port-forward svc/mongo 27017:27017

Open MongoDB Compass and connect to:

mongodb://localhost:27017/

After making manifest or image changes:

# Re-apply manifests
kubectl apply -f deploy/kubernetes/ --recursive

# Restart all deployments to pick up env changes
kubectl rollout restart deployment

To shut down the Kubernetes resources created by these manifests:

kubectl delete -f deploy/kubernetes/ --recursive

Note: Replace placeholder secret values with real secrets before deploying to shared or production clusters.

============================================================
