import { Hono } from "jsr:@hono/hono@4";
import { cors } from "jsr:@hono/hono@4/cors";
import { autenticar } from "./auth.ts";
import { authRoutes } from "./routes/auth.ts";
import { usersRoutes } from "./routes/users.ts";
import { specsRoutes } from "./routes/specs.ts";
import { itemsRoutes } from "./routes/items.ts";
import { testsRoutes } from "./routes/tests.ts";
import { pilotajesRoutes } from "./routes/pilotajes.ts";
import { auditRoutes } from "./routes/audit_routes.ts";
import { adminRoutes } from "./routes/admin.ts";

// El nombre de la funci?n es "api"; todas las rutas deben ir prefijadas
// con /api porque as? las reenv?a la pasarela de Supabase.
const app = new Hono().basePath("/api");

const origenesPermitidos = (Deno.env.get("CORS_ORIGIN") || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  "*",
  cors({
    origin: origenesPermitidos.length ? origenesPermitidos : "*",
    allowHeaders: ["Content-Type", "Authorization", "x-seed-secret"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// Igual que el middleware "autenticar" del backend en Express: siempre se
// ejecuta y adjunta el usuario (o null) sin rechazar la petici?n por s? solo.
app.use("*", autenticar);

app.get("/health", (c) => c.json({ ok: true }));

app.route("/auth", authRoutes);
app.route("/users", usersRoutes);
app.route("/specs", specsRoutes);
app.route("/items", itemsRoutes);
app.route("/tests", testsRoutes);
app.route("/pilotajes", pilotajesRoutes);
app.route("/audit", auditRoutes);
app.route("/admin", adminRoutes);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Error interno del servidor." }, 500);
});

Deno.serve(app.fetch);




