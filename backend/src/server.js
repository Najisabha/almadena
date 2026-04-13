import { createApp } from "./app.js";
import { env } from "./config/env.js";
import {
  ensureProfileImageColumns,
  ensureSignupPlacesSetting,
  ensureSignupPlacesTables,
  ensureInstructorsTable,
} from "./lib/ensureSchema.js";

const app = createApp();
const port = env.port;

try {
  await ensureInstructorsTable();
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn("[schema] ensureInstructorsTable:", err?.message || err);
}

try {
  await ensureProfileImageColumns();
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn("[schema] ensureProfileImageColumns:", err?.message || err);
}

try {
  await ensureSignupPlacesSetting();
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn("[schema] ensureSignupPlacesSetting:", err?.message || err);
}

try {
  await ensureSignupPlacesTables();
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn("[schema] ensureSignupPlacesTables:", err?.message || err);
}

app.listen(port, () => {
  const apiBaseUrl = `http://localhost:${port}/api`;
  const healthUrl = `${apiBaseUrl}/health`;

  // eslint-disable-next-line no-console
  console.log("");
  // eslint-disable-next-line no-console
  console.log("========================================");
  // eslint-disable-next-line no-console
  console.log(" API started successfully");
  // eslint-disable-next-line no-console
  console.log(` Base URL   : ${apiBaseUrl}`);
  // eslint-disable-next-line no-console
  console.log(` Health URL : ${healthUrl}`);
  // eslint-disable-next-line no-console
  console.log(` CORS Origins: ${env.clientOrigins.join(", ")}`);
  // eslint-disable-next-line no-console
  console.log("========================================");
  // eslint-disable-next-line no-console
  console.log("");
});
