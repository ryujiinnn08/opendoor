# opendoor# OpenDoor — Microservices Lab

## Project Overview
OpenDoor is an accommodation-aware job matching platform connecting persons with disabilities (PWDs) to inclusive employers, verifying employer follow-through on accommodation promises. This repository contains our System Integration and Architecture course lab: a working slice of OpenDoor's proposed service-oriented architecture, demonstrating REST-based service-to-service communication with both JSON and XML data exchange.

Full project context: [TODO — teammate: link or summary from proposal Section 3]

## Microservice Architecture

| Service | Role in this lab | Business Responsibility |
|---|---|---|
| `services/job-listing` | Service B (data owner) | Owns job postings — creates, retrieves, and lists jobs with structured accommodation fields |
| `services/matching` | Service A (initiates integration call) | Matches candidates to jobs; must retrieve a job's details from Job Listing Service before completing a match |
| `gateway` | API Gateway | Single entry point; routes client requests to the correct backend service |

**Why separated:** Job Listing and Matching are separated because they own different data (job postings vs. candidate/match data) and change for different reasons — new job fields shouldn't require redeploying the matching logic, and vice versa. This mirrors our full OpenDoor proposal's service decomposition (see Section 9).

**Note on structure:** we use `services/job-listing` and `services/matching` instead of generic `service-a`/`service-b` names since these map directly to real services in our approved capstone architecture. Node/Express (`package.json` per service) is used instead of Python, so there is no root-level `requirements.txt` — each service manages its own dependencies independently.

## Architecture Diagram
[TODO — teammate: add diagram to `docs/architecture/` and reference it here]

```
        Client / Postman
               |
               v
          API Gateway
               |
     +---------+---------+
     |                   |
     v                   v
Matching Service   Job Listing Service
 (Service A)         (Service B)
     |                   ^
     |    REST + JSON/XML|
     +-------------------+
```

## API Documentation

### Job Listing Service (`services/job-listing`, port 5001)

| Method | Endpoint | Purpose | Input | Response |
|---|---|---|---|---|
| GET | `/health` | Health check | — | `{ "status": "UP", "service": "job-listing" }` |
| GET | `/jobs/:id` | Retrieve a job by ID; supports content negotiation | `Accept: application/json` or `application/xml` | Job resource in requested format, or 404 |
| POST | `/jobs` | Create a new job | JSON or XML body with `title`, `employerId` required | 201 with created job, or 400/415 on error |

### Matching Service (`services/matching`, port 5002)
[TODO — fill in once built]

### API Gateway (port 5000)
[TODO — fill in once built]

## Data Representation
We exchange a `Job` resource in both JSON and XML — see `docs/examples/resource.json` and `docs/examples/resource.xml` for full samples. Both represent the same logical fields: `jobId`, `title`, `employerId`, `accommodationType`, `location`, `active`.

## Integration Flow
[TODO — fill in once Matching Service is built: Matching Service receives a match request → calls `GET /jobs/:id` on Job Listing Service with `Accept: application/json` → deserializes the response → validates the job is active → creates the match]

## Error Handling
| Scenario | Response |
|---|---|
| Missing required field (`title`/`employerId`) | 400 `VALIDATION_ERROR` |
| Job not found | 404 `NOT_FOUND` |
| Unsupported `Content-Type` | 415 `UNSUPPORTED_MEDIA_TYPE` |
| Malformed JSON/XML body | 400 `MALFORMED_BODY` |
| [TODO] Dependent service unavailable | 503 |

## Installation and Execution

**Prerequisites:** Node.js (LTS), Docker Desktop

1. Clone the repo and check out `develop`:
   ```
   git clone https://github.com/ryujiinnn08/opendoor.git
   cd opendoor
   git checkout develop
   ```
2. Start Postgres:
   ```
   docker-compose up -d
   ```
3. Install and run Job Listing Service:
   ```
   cd services/job-listing
   npm install
   node server.js
   ```
   Runs on `http://localhost:5001`.
4. [TODO — add once Matching Service and Gateway exist]

## Testing
A Postman collection is provided at `postman/collection.json`, covering health checks, JSON/XML GET and POST requests, error scenarios, and the Service A → Service B integration flow. Import it into Postman and run requests individually, or use the Collection Runner to execute all in sequence.