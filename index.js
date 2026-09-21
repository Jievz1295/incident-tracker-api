const express = require("express");
const { randomUUID } = require("node:crypto");
const { loadIncidents, saveIncidents } = require("./storage");

const app = express();
const PORT = 3000;

app.use(express.json());

// Load previously saved incidents when the server starts.
let incidents = loadIncidents();

const allowedSeverities = ["low", "medium", "high", "critical"];
const allowedStatuses = ["open", "investigating", "resolved"];

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "incident-tracker-api",
    timestamp: new Date().toISOString(),
  });
});

// List all incidents.
app.get("/incidents", (req, res) => {
  const { status } = req.query;

  if (status !== undefined && !allowedStatuses.includes(status)) {
    return res.status(400).json({
      error: "Status must be open, investigating, or resolved.",
    });
  }

  const filteredIncidents =
    status === undefined
      ? incidents
      : incidents.filter((incident) => incident.status === status);

  return res.status(200).json({
    count: filteredIncidents.length,
    data: filteredIncidents,
  });
});

// Create an incident.
app.post("/incidents", (req, res) => {
  const { title, service, severity, description } = req.body || {};

  // Check that required fields contain non-empty text.
  if (
    typeof title !== "string" ||
    title.trim() === "" ||
    typeof service !== "string" ||
    service.trim() === ""
  ) {
    return res.status(400).json({
      error: "Title and service are required and must be non-empty strings.",
    });
  }

  if (!allowedSeverities.includes(severity)) {
    return res.status(400).json({
      error: "Severity must be low, medium, high, or critical.",
    });
  }

  if (description !== undefined && typeof description !== "string") {
    return res.status(400).json({
      error: "Description must be a string.",
    });
  }

  const now = new Date().toISOString();

  const incident = {
    id: randomUUID(),
    title: title.trim(),
    service: service.trim(),
    severity,
    description: description === undefined ? "" : description.trim(),
    status: "open",
    createdAt: now,
    updatedAt: now,
  };

  const updatedIncidents = [...incidents, incident];

    // Save successfully before updating memory or returning success.
    saveIncidents(updatedIncidents);
    incidents = updatedIncidents;

  return res.status(201).json({
    message: "Incident created successfully.",
    data: incident,
  });
});

// Retrieve one incident by ID.
app.get("/incidents/:id", (req, res) => {
  const incident = incidents.find(
    (item) => item.id === req.params.id
  );

  if (!incident) {
    return res.status(404).json({
      error: "Incident not found.",
    });
  }

  return res.status(200).json({
    data: incident,
  });
});

// Update only an incident's status.
app.patch("/incidents/:id", (req, res) => {
  const incident = incidents.find(
    (item) => item.id === req.params.id
  );

  if (!incident) {
    return res.status(404).json({
      error: "Incident not found.",
    });
  }

  const { status } = req.body || {};

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      error: "Status must be open, investigating, or resolved.",
    });
  }

  const updatedIncident = {
    ...incident,
    status,
    updatedAt: new Date().toISOString(),
  };

  const updatedIncidents = incidents.map((item) =>
    item.id === incident.id ? updatedIncident : item
  );

  saveIncidents(updatedIncidents);
  incidents = updatedIncidents;

  return res.status(200).json({
    message: "Incident status updated.",
    data: updatedIncident,
  });
});

// Delete one incident by ID.
app.delete("/incidents/:id", (req, res) => {
  const incident = incidents.find(
    (item) => item.id === req.params.id
  );

  if (!incident) {
    return res.status(404).json({
      error: "Incident not found.",
    });
  }

  const updatedIncidents = incidents.filter(
    (item) => item.id !== incident.id
  );

  saveIncidents(updatedIncidents);
  incidents = updatedIncidents;

  return res.status(204).send();
});

// Keep this AFTER all valid routes.
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// Return JSON when a request contains malformed JSON.
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: "Invalid JSON in request body.",
    });
  }

  console.error(err);

  return res.status(500).json({
    error: "Internal server error.",
  });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Server running at http://127.0.0.1:${PORT}`);
});