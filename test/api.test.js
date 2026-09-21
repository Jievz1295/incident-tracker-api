const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");

const BASE_URL = "http://127.0.0.1:3000";

// These tests require the local server to be running.
test("Health endpoint returns OK", async () => {
  const response = await fetch(`${BASE_URL}/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.service, "incident-tracker-api");
});

test("Invalid incident input is rejected", async () => {
  const invalidInputs = [
    { service: "demo-api", severity: "high" },
    { title: "Test", service: "demo-api", severity: "urgent" },
    {
      title: "Test",
      service: "demo-api",
      severity: "low",
      description: 123,
    },
  ];

  for (const input of invalidInputs) {
    const response = await fetch(`${BASE_URL}/incidents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    assert.equal(response.status, 400);
    assert.equal(typeof (await response.json()).error, "string");
  }
});

test("Unknown incident returns 404", async () => {
  const response = await fetch(
    `${BASE_URL}/incidents/${randomUUID()}`
  );

  assert.equal(response.status, 404);
});

test("Incident can be created, read, updated, filtered and deleted", async (t) => {
  const createResponse = await fetch(`${BASE_URL}/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Automated lifecycle test",
      service: "demo-test-api",
      severity: "medium",
      description: "Fictional incident created by the test suite.",
    }),
  });

  assert.equal(createResponse.status, 201);

  const created = (await createResponse.json()).data;
  assert.equal(typeof created.id, "string");

  const incidentUrl = `${BASE_URL}/incidents/${created.id}`;

  // Remove this test's record even if a later assertion fails.
  t.after(async () => {
    const response = await fetch(incidentUrl, {
      method: "DELETE",
    });

    assert.ok([204, 404].includes(response.status));
  });

  assert.equal(created.status, "open");

  const readResponse = await fetch(incidentUrl);
  assert.equal(readResponse.status, 200);
  assert.equal((await readResponse.json()).data.id, created.id);

  // An invalid status must be rejected without changing the record.
  const invalidUpdate = await fetch(incidentUrl, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "finished" }),
  });

  assert.equal(invalidUpdate.status, 400);

  const unchanged = await fetch(incidentUrl);
  assert.equal((await unchanged.json()).data.status, "open");

  const updateResponse = await fetch(incidentUrl, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "resolved" }),
  });

  assert.equal(updateResponse.status, 200);

  const updated = (await updateResponse.json()).data;
  assert.equal(updated.status, "resolved");
  assert.equal(updated.createdAt, created.createdAt);

  const filterResponse = await fetch(
    `${BASE_URL}/incidents?status=resolved`
  );

  assert.equal(filterResponse.status, 200);

  const filtered = await filterResponse.json();
  assert.ok(filtered.data.some((item) => item.id === created.id));
  assert.ok(filtered.data.every((item) => item.status === "resolved"));

  const deleteResponse = await fetch(incidentUrl, {
    method: "DELETE",
  });

  assert.equal(deleteResponse.status, 204);

  const missingResponse = await fetch(incidentUrl);
  assert.equal(missingResponse.status, 404);
});