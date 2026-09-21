const fs = require("node:fs");
const path = require("node:path");

const dataDirectory = path.join(__dirname, "data");
const dataFile = path.join(dataDirectory, "incidents.json");

function loadIncidents() {
  fs.mkdirSync(dataDirectory, { recursive: true });

  // Start with an empty list only when no saved file exists.
  if (!fs.existsSync(dataFile)) {
    return [];
  }

  const content = fs.readFileSync(dataFile, "utf8");
  const incidents = JSON.parse(content);

  if (!Array.isArray(incidents)) {
    throw new Error("Incident storage must contain a JSON array.");
  }

  return incidents;
}

function saveIncidents(incidents) {
  fs.mkdirSync(dataDirectory, { recursive: true });

  const temporaryFile = `${dataFile}.tmp`;

  // Write the new contents before replacing the existing file.
  fs.writeFileSync(
    temporaryFile,
    JSON.stringify(incidents, null, 2),
    "utf8"
  );

  fs.renameSync(temporaryFile, dataFile);
}

module.exports = {
  loadIncidents,
  saveIncidents,
};