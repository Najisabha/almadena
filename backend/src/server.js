import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();
const port = env.port;
const origin = env.clientOrigin;

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
  console.log(` CORS Origin: ${origin}`);
  // eslint-disable-next-line no-console
  console.log("========================================");
  // eslint-disable-next-line no-console
  console.log("");
});
