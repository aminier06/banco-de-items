import { Hono } from "jsr:@hono/hono@4";
import bcrypt from "npm:bcryptjs@2.4.3";
import { Users, toPublic } from "../models/users.ts";
import { firmarToken, requerirSesion } from "../auth.ts";
import { registrar, obtenerIp } from "../audit.ts";

export const authRoutes = new Hono();

authRoutes.post("/login", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { correo, password } = body;
  const ip = obtenerIp(c);
  if (!correo || !password) return c.json({ error: "Correo y contrasena son obligatorios." }, 400);
  const user = await Users.findByCorreo(correo.trim().toLowerCase());
  if (!user) {
    await registrar({ accion: "LOGIN_FALLIDO", detalle: { correo: correo.trim().toLowerCase(), motivo: "Usuario no encontrado" }, ip });
    return c.json({ error: "Correo o contrasena incorrectos." }, 401);
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    await registrar({ accion: "LOGIN_FALLIDO", usuario: { id: user.id, nombre: user.nombre, correo: user.correo }, detalle: { motivo: "Contrasena incorrecta" }, ip });
    return c.json({ error: "Correo o contrasena incorrectos." }, 401);
  }
  const token = firmarToken(user);
  await registrar({ accion: "LOGIN_EXITOSO", usuario: { id: user.id, nombre: user.nombre, correo: user.correo }, ip });
  return c.json({ token, user: toPublic(user) });
});

authRoutes.get("/me", requerirSesion, (c) => {
  return c.json({ user: toPublic(c.get("user")) });
});

authRoutes.post("/change-password", requerirSesion, async (c) => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  const { passwordActual, passwordNueva } = body;
  if (!passwordActual || !passwordNueva) return c.json({ error: "Indica tu contrasena actual y la nueva." }, 400);
  if (passwordNueva.length < 4) return c.json({ error: "La nueva contrasena debe tener al menos 4 caracteres." }, 400);
  const ok = await bcrypt.compare(passwordActual, user.passwordHash);
  if (!ok) return c.json({ error: "Tu contrasena actual no es correcta." }, 401);
  const passwordHash = await bcrypt.hash(passwordNueva, 10);
  await Users.updatePassword(user.id, passwordHash);
  await registrar({ accion: "RESETEAR_PASSWORD", entidad: "users", entidad_id: user.id, usuario: { id: user.id, nombre: user.nombre, correo: user.correo }, ip: obtenerIp(c) });
  return c.json({ ok: true });
});
