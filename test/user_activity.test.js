const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  recordLastUserActivity,
  readLastUserActivity
} = require("../user_activity");

function makeEnv() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dylan-user-activity-"));
  return { DATA_DIR: dir };
}

test("records activity when request ends with a user message", () => {
  const env = makeEnv();
  const now = new Date("2026-09-02T06:00:00.000Z");

  const recorded = recordLastUserActivity(
    [
      { role: "system", content: "rules" },
      { role: "assistant", content: "hello" },
      { role: "user", content: "hi" }
    ],
    { env, now }
  );

  assert.equal(recorded, true);
  assert.equal(readLastUserActivity({ env }).toISOString(), now.toISOString());
});

test("does not refresh activity for tool continuation", () => {
  const env = makeEnv();
  const first = new Date("2026-09-02T06:00:00.000Z");

  recordLastUserActivity(
    [{ role: "user", content: "check douyin" }],
    { env, now: first }
  );

  const recorded = recordLastUserActivity(
    [
      { role: "user", content: "check douyin" },
      {
        role: "assistant",
        tool_calls: [{ id: "1", type: "function" }]
      },
      { role: "tool", content: "result" }
    ],
    { env, now: new Date("2026-09-02T06:10:00.000Z") }
  );

  assert.equal(recorded, false);
  assert.equal(readLastUserActivity({ env }).toISOString(), first.toISOString());
});

test("returns null when no activity has been recorded", () => {
  const env = makeEnv();
  assert.equal(readLastUserActivity({ env }), null);
});
