import { Hono } from "jsr:@hono/hono@4";
import bcrypt from "npm:bcryptjs@2.4.3";
import { Users, toPublic } from "../models/users.ts";
import { requerirAdmin } from "../auth.ts";
import { ROLES, AREA_IDS } from "../constants.ts";
import { registrar, obtenerIp } from "../audit.ts";

export const usersRoutes = new Hono();

function generarPasswordTemporal() {
  return Math.random().toString(36).slice(2, 10);
}

function validarPayload(body: any, { exigirPassword }: { exigirPassword: boolean }) {
  const errores: string[] = [];
  if (!body.nombre || !body.nombre.trim()) errores.push("Falta el nombre.");
  if (!body.correo || !body.correo.trim()) errores.push("Falta el correo.");
  if (!ROLES.includes(body.rol)) errores.push("Rol invalido.");
  if (body.rol === "elaborador" && !AREA_IDS.includes(body.area)) errores.push("El elaborador necesita un area valida.");
  if (body.rol === "revisor" && body.areasAsignadas !== null && body.areasAsignadas !== undefined) {
    if (!Array.isArray(body.areasAsignadas)) errores.push("areasAsignadas debe ser un array o null.");
    else if (body.areasAsignadas.some((a: string) => !AREA_IDS.includes(a))) errores.push("Una o mas areas asignadas son invalidas.");
  }
  if (exigirPassword && (!body.password || body.password.length < 4)) errores.push("La contrasena debe tener al menos 4 caracteres.");
  return errores;
}

usersRoutes.use("*", requerirAdmin);

usersRoutes.get("/", async (c) => {
  const users = await Users.list();
  return c.json({ users: users.map(toPublic) });
});

usersRoutes.post("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const errores = validarPayload(body, { exigirPassword: true });
  if (errores.length) return c.json({ error: errores.join(" ") }, 400);
  const correo = body.correo.trim().toLowerCase();
  if (await Users.findByCorreo(correo)) return c.json({ error: "Ya existe una cuenta con ese correo." }, 409);
  const passwordHash = await bcrypt.hash(body.password, 10);
  const areasAsignadas = body.rol === "revisor" ? (body.areasAsignadas ?? null) : null;
  const user = await Users.create({
    nombre: body.nombre.trim(), correo, passwordHash, rol: body.rol,
    area: body.rol === "elaborador" ? body.area : null, areasAsignadas,
  });
  const admin = c.get("user");
  await registrar({ accion: "CREAR_USUARIO", entidad: "users", entidad_id: user.id,
    usuario: { id: admin.id, nombre: admin.nombre, correo: admin.correo },
    detalle: { nombre: user.nombre, correo: user.correo, rol: user.rol }, ip: obtenerIp(c) });
  return c.json({ user: toPublic(user) }, 201);
});

usersRoutes.put("/:id", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const errores = validarPayload(body, { exigirPassword: false });
  if (errores.length) return c.json({ error: errores.join(" ") }, 400);
  const id = c.req.param("id");
  const correo = body.correo.trim().toLowerCase();
  const otro = await Users.findByCorreo(correo);
  if (otro && otro.id !== id) return c.json({ error: "Ese correo ya esta en uso." }, 409);
  if (!(await Users.findById(id))) return c.json({ error: "Usuario no encontrado." }, 404);
  const areasAsignadas = body.rol === "revisor" ? (body.areasAsignadas ?? null) : null;
  const user = await Users.update(id, {
    nombre: body.nombre.trim(), correo, rol: body.rol,
    area: body.rol === "elaborador" ? body.area : null, areasAsignadas,
  });
  const admin = c.get("user");
  await registrar({ accion: "EDITAR_USUARIO", entidad: "users", entidad_id: id,
    usuario: { id: admin.id, nombre: admin.nombre, correo: admin.correo },
    detalle: { nombre: user.nombre, correo: user.correo, rol: user.rol }, ip: obtenerIp(c) });
  return c.json({ user: toPublic(user) });
});

usersRoutes.post("/:id/reset-password", async (c) => {
  const id = c.req.param("id");
  const objetivo = await Users.findById(id);
  if (!objetivo) return c.json({ error: "Usuario no encontrado." }, 404);
  const body = await c.req.json().catch(() => ({}));
  if (body.password && body.password.length < 4) return c.json({ error: "La contrasena debe tener al menos 4 caracteres." }, 400);
  const nueva = body.password || generarPasswordTemporal();
  const passwordHash = await bcrypt.hash(nueva, 10);
  await Users.updatePassword(id, passwordHash);
  const admin = c.get("user");
  await registrar({ accion: "RESETEAR_PASSWORD", entidad: "users", entidad_id: id,
    usuario: { id: admin.id, nombre: admin.nombre, correo: admin.correo },
    detalle: { correo_afectado: objetivo.correo }, ip: obtenerIp(c) });
  return c.json({ password: nueva });
});

usersRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const actual = c.get("user");
  if (id === actual.id) return c.json({ error: "No puedes eliminar tu propia cuenta." }, 400);
  const objetivo = await Users.findById(id);
  if (!objetivo) return c.json({ error: "Usuario no encontrado." }, 404);
  const eliminado = await Users.remove(id);
  if (!eliminado) return c.json({ error: "Usuario no encontrado." }, 404);
  await registrar({ accion: "ELIMINAR_USUARIO", entidad: "users", entidad_id: id,
    usuario: { id: actual.id, nombre: actual.nombre, correo: actual.correo },
    detalle: { nombre: objetivo.nombre, correo: objetivo.correo, rol: objetivo.rol }, ip: obtenerIp(c) });
  return c.body(null, 204);
});
