# OpenDoor — Microservices Lab

## Project Overview
OpenDoor is an accommodation-aware job matching platform that connects persons with disabilities (PWDs) to inclusive employers, and verifies — through a post-hire feedback loop — whether employers actually deliver on the workplace accommodations they advertise. The platform addresses a persistent gap in existing PWD job boards in the Philippines: none of them structure accommodation needs as filterable data, and none verify employer follow-through after hiring.

This repository contains our System Integration and Architecture course lab: a working slice of OpenDoor's proposed service-oriented architecture, demonstrating REST-based service-to-service communication with both JSON and XML data exchange, content negotiation, and centralized routing through an API Gateway.

## Microservice Architecture

| Service | Role in this lab | Business Responsibility |
|---|---|---|
| `services/job-listing` | Service B (data owner) | Owns job postings — creates, retrieves, and lists jobs with structured accommodation fields |
| `services/matching` | Service A (initiates integration call) | Matches candidates to jobs; retrieves a job's details from Job Listing Service before completing a match |
| `gateway` | API Gateway | Single entry point; routes client requests to the correct backend service |

**Why separated:** Job Listing and Matching own different data (job postings vs. match records) and change for different reasons — adding a new job field shouldn't require redeploying the matching logic, and vice versa. This mirrors our full OpenDoor capstone proposal's service decomposition, where Job Listing, Matching, and Employer Verification are independently owned and deployed services coordinated through a shared API Gateway.

**Note on structure:** we use `services/job-listing` and `services/matching` (rather than generic `service-a`/`service-b` names) since these map directly to two of the three core services in our approved capstone architecture — this lab is a real, working slice of that larger system, not a standalone exercise. Node.js/Express is used instead of Python for all services, consistent with our proposal's technology stack, so each service manages its own dependencies via its own `package.json` rather than a shared root-level `requirements.txt`.

## Architecture Diagram

```
        Client / Postman
               |
               v
          API Gateway (port 5000)
               |
     +---------+---------+
     |                   |
     v                   v
Matching Service    Job Listing Service
 (port 5002)          (port 5001)
     |                   ^
     |   REST + JSON/XML |
     +-------------------+
   (Matching calls Job Listing directly
    to retrieve job details for a match)
```

A visual diagram is available at `docs/architecture/` *(to be added)*.

## API Documentation

All client-facing requests go through the **API Gateway** at `http://localhost:5000`. Services can also be reached directly on their own ports for isolated testing.

### API Gateway (port 5000)

| Method | Endpoint | Purpose | Input | Response |
|---|---|---|---|---|
| GET | `/health` | Gateway health check | — | `{ "status": "UP", "service": "gateway" }` |
| * | `/api/jobs/*` | Proxies to Job Listing Service | — | Forwards Job Listing Service's response |
| * | `/api/matches/*` | Proxies to Matching Service | — | Forwards Matching Service's response |

### Job Listing Service (`services/job-listing`, port 5001)

| Method | Endpoint | Purpose | Input | Response |
|---|---|---|---|---|
| GET | `/health` | Health check | — | `{ "status": "UP", "service": "job-listing" }` |
| GET | `/jobs/:id` | Retrieve a job by ID; supports content negotiation | Header `Accept: application/json` or `application/xml` | 200 with job in requested format; 404 if not found |
| POST | `/jobs` | Create a new job | JSON or XML body with `title` and `employerId` required; optional `accommodationType`, `location` | 201 with created job; 400 on validation/parse error; 415 on unsupported `Content-Type` |

### Matching Service (`services/matching`, port 5002)

| Method | Endpoint | Purpose | Input | Response |
|---|---|---|---|---|
| GET | `/health` | Health check | — | `{ "status": "UP", "service": "matching" }` |
| POST | `/matches` | Create a match — internally calls Job Listing Service to retrieve job details | JSON body: `{ "candidateId": number, "jobId": number }` | 201 with match record; 400 on missing fields; 404 if job doesn't exist; 409 if job is inactive; 503 if Job Listing Service is unreachable |

## Data Representation

We exchange a **Job** resource in both JSON and XML — full samples in `docs/examples/resource.json` and `docs/examples/resource.xml`. Both represent the same logical fields: `jobId`, `title`, `employerId`, `accommodationType`, `location`, `active`.

**JSON:**
```json
{
  "jobId": 1001,
  "title": "Data Entry Clerk",
  "employerId": 501,
  "accommodationType": "Flexible schedule",
  "location": "Manila",
  "active": true
}
```

**XML (equivalent):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<job>
  <jobId>1001</jobId>
  <title>Data Entry Clerk</title>
  <employerId>501</employerId>
  <accommodationType>Flexible schedule</accommodationType>
  <location>Manila</location>
  <active>true</active>
</job>
```

Job Listing Service serializes/deserializes both formats depending on the request's `Content-Type` (incoming) and `Accept` (outgoing) headers.

## Integration Flow

The core service-to-service transaction demonstrated in this lab:

1. Client sends `POST /api/matches` to the **API Gateway** with a `candidateId` and `jobId`.
2. Gateway proxies the request to **Matching Service**.
3. Matching Service validates the input, then calls `GET /jobs/:jobId` on **Job Listing Service** directly, requesting `Accept: application/json`.
4. Job Listing Service serializes and returns the job as JSON.
5. Matching Service deserializes the response, checks the job is `active`, and builds a match record using the retrieved job data (`title`, `accommodationType`).
6. Matching Service returns the completed match (201) back through the Gateway to the client.

If Job Listing Service is unreachable at step 3, Matching Service catches the failed request and returns `503 SERVICE_UNAVAILABLE` instead of crashing or hanging — demonstrating graceful degradation when a dependent service is down.

## Error Handling

| Scenario | HTTP Status | Response |
|---|---|---|
| Missing required field (`title`, `employerId`, `candidateId`, `jobId`) | 400 | `{ "error": "VALIDATION_ERROR", "field": "...", "message": "..." }` |
| Malformed JSON body | 400 | `{ "error": "MALFORMED_BODY", "message": "Could not parse request body" }` |
| Job not found | 404 | `{ "error": "NOT_FOUND", "message": "Job {id} does not exist" }` |
| Unsupported `Content-Type` on job creation | 415 | `{ "error": "UNSUPPORTED_MEDIA_TYPE", "message": "Use application/json or application/xml" }` |
| Job exists but is inactive | 409 | `{ "error": "CONFLICT", "message": "This job is no longer active" }` |
| Job Listing Service unreachable (Matching Service call fails) | 503 | `{ "error": "SERVICE_UNAVAILABLE", "message": "Job Listing Service is unreachable" }` |

Services do not crash on invalid input — all client errors are caught and returned as structured JSON rather than raw stack traces.

## Installation and Execution

**Prerequisites:** Node.js (LTS), Docker Desktop, Postman.

1. Clone the repo and check out `develop` (or `main` for the latest merged milestone):
   ```
   git clone https://github.com/ryujiinnn08/opendoor.git
   cd opendoor
   git checkout develop
   ```

2. Start Postgres (used by future services; not yet required by Job Listing or Matching, which currently run in-memory):
   ```
   docker-compose up -d
   ```

3. Install and run **Job Listing Service** (in its own terminal):
   ```
   cd services/job-listing
   npm install
   node server.js
   ```
   Runs on `http://localhost:5001`.

4. Install and run **Matching Service** (in a second terminal):
   ```
   cd services/matching
   npm install
   node server.js
   ```
   Runs on `http://localhost:5002`.

5. Install and run the **API Gateway** (in a third terminal):
   ```
   cd gateway
   npm install
   node server.js
   ```
   Runs on `http://localhost:5000`.

All three must be running simultaneously for the full integration flow (Gateway → Matching → Job Listing) to work. Once all three show their "running on port ..." message, the system is ready to test.

## Testing

A Postman collection is provided at `postman/collection.json`, covering:

1. Job Listing Health
2. Matching Health
3. Get Job - JSON
4. Get Job - XML
5. Create Job - JSON
6. Missing Required Field
7. Malformed JSON
8. Job Not Found
9. Unsupported Media Type
10. Create Match - Integrated Transaction

**To use it:**
1. Open Postman → **Import** → select `postman/collection.json`.
2. Ensure Job Listing Service, Matching Service, and the API Gateway are all running locally (see Installation and Execution above).
3. Run requests individually, or select the collection and use **Run** (Collection Runner) to execute all requests in sequence and review pass/fail results.

All requests route through the Gateway (`localhost:5000`) except the two direct health checks, which hit each service's own port to confirm it is independently reachable.
