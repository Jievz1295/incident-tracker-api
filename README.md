# Incident Tracker API

A local REST API built with Node.js and Express for tracking fictional
service incidents.

I built this guided learning project to practise backend development
alongside my experience in production monitoring and incident recovery.

## Features

- Create incidents with a title, service, severity and description.
- List incidents and filter by status.
- Retrieve an incident by ID.
- Update incident status.
- Delete incidents.
- Persist records in a local JSON file.
- Validate required fields, severity and status.
- Return JSON error responses.
- Run automated API tests.

## Technology

- Node.js
- Express
- Node.js built-in file system and crypto modules
- Node.js built-in test runner and assertion module
- Git and GitHub

## Requirements

- Node.js 24.x and npm
- Git to clone the repository

## Getting Started

```bash
git clone https://github.com/Jievz1295/incident-tracker-api.git
cd incident-tracker-api
npm ci
npm start
```

The server runs at:

```text
http://127.0.0.1:3000
```

Check the health endpoint:

```text
http://127.0.0.1:3000/health
```

## API Endpoints

| Method | Endpoint | Purpose | Success |
| --- | --- | --- | --- |
| GET | /health | Check server responsiveness | 200 |
| POST | /incidents | Create an incident | 201 |
| GET | /incidents | List incidents | 200 |
| GET | /incidents?status=open | Filter by status | 200 |
| GET | /incidents/:id | Retrieve one incident | 200 |
| PATCH | /incidents/:id | Update status only | 200 |
| DELETE | /incidents/:id | Delete an incident | 204 |

Invalid input returns 400. Unknown incidents or routes return 404.
Unexpected server errors return 500.

### Create an Incident

Send this JSON to `POST /incidents` with
`Content-Type: application/json`:

```json
{
  "title": "Slow response from demo login service",
  "service": "demo-login-api",
  "severity": "high",
  "description": "Response time exceeded 3 seconds during a practice test."
}
```

- `title` and `service`: required, non-empty strings.
- `severity`: low, medium, high or critical.
- `description`: optional string.
- New incidents receive a generated UUID, open status and timestamps.

### Update Status

Send this JSON to `PATCH /incidents/:id`:

```json
{
  "status": "investigating"
}
```

Allowed statuses: open, investigating and resolved.
This endpoint changes status only; it does not edit other incident fields.
The prototype allows changes between any of the supported statuses.

## Tests

Start the server in one terminal:

```bash
npm start
```

Run tests in a second terminal:

```bash
npm test
```

The four automated tests cover:

1. Health endpoint response.
2. Rejection of invalid incident input.
3. A 404 response for an unknown incident.
4. Creation, retrieval, invalid and valid status updates, filtering,
   deletion and retrieval after deletion.

Tests use the running local server and its data file. The lifecycle test
creates a fictional incident and attempts to remove it during cleanup.

Persistence was also checked manually by creating an incident,
restarting the server and retrieving the same ID.

## Project Files

- `index.js`: Express server, routes, validation and error handling.
- `storage.js`: JSON file loading and saving.
- `test/api.test.js`: automated HTTP API tests.
- `data/incidents.json`: local records, created after saving an incident.
- `.gitignore`: excludes dependencies, local data, environment files and logs.

## Storage Design

Records are loaded into memory when the server starts.
Changes are written to a temporary file before replacing the data file.
The in-memory list is updated only after saving succeeds.

The data directory is excluded from Git.
No real banking incidents or internal company data are included.

## Limitations

This is a learning prototype, not a production banking application.

- Synchronous file operations block the Node.js event loop.
- JSON storage is intended for one local server process.
- Authentication and authorisation are not implemented.
- Results are not paginated.
- Tests currently share the development server and storage.
- The health endpoint checks responsiveness, not storage health.
- A malformed data file prevents startup rather than silently resetting records.

## Future Improvements

- Database-backed persistence.
- Isolated test storage and automatic test server startup.
- Authentication and role-based access.
- Pagination and additional filters.
- Structured logging and broader error-path tests.

## Learning Context

Developed with AI-assisted guidance as a practical introduction to
Node.js, Express, REST APIs, file persistence, automated testing and Git.