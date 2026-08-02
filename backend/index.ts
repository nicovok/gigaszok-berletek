import { initDb } from "./db";
import { initEmailAssets } from "./email";
import { config } from "./config";
import { AuthError } from "./middleware";
import { authRoutes } from "./routes/auth";
import { passRoutes } from "./routes/passes";
import { sessionRoutes } from "./routes/sessions";
import frontend from "../frontend/index.html";

initDb();
await initEmailAssets();

const server = Bun.serve({
  port: config.port,
  routes: {
    "/": frontend,
    "/pass/:token": frontend,
    ...authRoutes,
    ...passRoutes,
    ...sessionRoutes,
  },
  error(err) {
    if (err instanceof AuthError) {
      return Response.json({ error: err.message }, { status: 401 });
    }
    console.error("[server error]", err);
    return Response.json({ error: String(err) }, { status: 500 });
  },
});

console.log(`Running on http://localhost:${server.port}`);
