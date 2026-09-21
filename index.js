const express = require("express");
const { randomUUID } = require("node:crypto");
const { loadIncidents, saveIncidents } = require("./storage");

const app = express();
const PORT = 3000;

app.use(express.json());

// Load previously saved incidents when the server starts.
let incidents = loadIncidents();

const allowedSeverities = ["low", "medium", "high", "critical"];

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "incident-tracker-api",
    timestamp: new Date().toISOString(),
  });
});

// List all incidents.
app.get("/incidents", (req, res) => {
  res.status(200).json({
    count: incidents.length,
    data: incidents,
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