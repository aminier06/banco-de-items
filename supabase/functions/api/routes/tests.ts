import { Hono } from "jsr:@hono/hono@4";
import { Tests } from "../models/tests.ts";
import { Items } from "../models/items.ts";
import { requerirSesion, requerirTecnico, requerirAdmin } from "../auth.ts";
import { AREA_IDS } from "../constants.ts";
import { registrar, obtenerIp } from "../audit.ts";

export const testsRoutes = new Hono();
testsRoutes.use("*", requerirSesion);

testsRoutes.get("/", async (c) => {
  return c.json({ tests: await Tests.list() });
});

testsRoutes.post("/", requerirTecnico, async (c) => {
  const user = c.get("user");
  const b = await c.req.json().catch(() => ({}));
  if (!AREA_IDS.includes(b.area)) return c.json({ error: "Area invalida." }, 400);
  if (!Array.isArray(b.itemIds) || b.itemIds.length === 0) return c.json({ error: "Selecciona al menos un item." }, 400);
  const items = await Items.findByIds(b.itemIds);
  if (items.length !== b.itemIds.length) return c.json({ error: "Alguno de los items seleccionados ya no existe." }, 400);
  if (items.some((i: any) => i.area !== b.area || i.estado !== "aprobado")) return c.json({ error: "Solo se pueden usar items aprobados de la misma area." }, 400);
  const test = await Tests.create({
    nombre: b.nombre || `Prueba de ${b.area}`, area: b.area, grado: b.grado || "6to de Secundaria",
    convocatoria: b.convocatoria || "Primera convocatoria",
    totalItems: Number(b.totalItems) || b.itemIds.length, itemIds: b.itemIds,
  }, user.id);
  await registrar({ accion: "CREAR_PRUEBA", entidad: "tests", entidad_id: test.id,
    usuario: { id: user.id, nombre: user.nombre, correo: user.correo },
    detalle: { nombre: test.nombre, area: test.area, totalItems: test.totalItems }, ip: obtenerIp(c) });
  return c.json({ test }, 201);
});

testsRoutes.delete("/:id", requerirAdmin, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const test = await Tests.findById ? await Tests.findById(id) : null;
  const eliminado = await Tests.remove(id);
  if (!eliminado) return c.json({ error: "Prueba no encontrada." }, 404);
  await registrar({ accion: "ELIMINAR_PRUEBA", entidad: "tests", entidad_id: id,
    usuario: { id: user.id, nombre: user.nombre, correo: user.correo },
    detalle: { nombre: test?.nombre || id }, ip: obtenerIp(c) });
  return c.body(null, 204);
});
