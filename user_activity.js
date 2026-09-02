const fs = require("fs");
const { runtimeFile, writeJsonAtomicSync } = require("./runtime_paths");

const ACTIVITY_FILE_NAME = "last_user_activity.json";

function requestEndsWithUserTurn(messages = []) {
  const list = Array.isArray(messages) ? messages : [];

  for (let i = list.length - 1; i >= 0; i -= 1) {
    const msg = list[i] || {};

    if (msg.role === "system" || msg.role === "tool") continue;

    return msg.role === "user";
  }

  return false;
}

function recordLastUserActivity(messages = [], options = {}) {
  if (!requestEndsWithUserTurn(messages)) return false;

  const env = options.env || process.env;
  const now = options.now instanceof Date ? options.now : new Date();
  const filePath = runtimeFile(ACTIVITY_FILE_NAME, env);

  writeJsonAtomicSync(filePath, {
    last_user_activity_at: now.toISOString()
  });

  return true;
}

function readLastUserActivity(options = {}) {
  const env = options.env || process.env;
  const filePath = runtimeFile(ACTIVITY_FILE_NAME, env);

  if (!fs.existsSync(filePath)) return null;

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const date = new Date(parsed.last_user_activity_at);

    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

module.exports = {
  ACTIVITY_FILE_NAME,
  requestEndsWithUserTurn,
  recordLastUserActivity,
  readLastUserActivity
};
