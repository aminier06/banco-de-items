import { Hono } from "jsr:@hono/hono@4";
import { Pilotajes } from "../models/pilotajes.ts";
import { Items } from "../models/items.ts";
import { requerirSesion, requerirTecnico, requerirAdmin } from "../auth.ts";
import { AREA_IDS, NIVEL_IDS, GRADO_IDS } from "../constants.ts";
import { registrar, obtenerIp } from "../audit.ts";

export const pilotajesRoutes = new Hono();
pilotajesRoutes.use("*", requerirSesion);

// Listar pilotajes del contexto actual
pilotajesRoutes.get("/", async (c) => {
  const nivel = c.req.query("nivel") || undefined;
  const grado = c.req.query("grado") || undefined;
  return c.json({ pilotajes: await Pilotajes.list(nivel, grado) });
});

// Crear pilotaje (solo equipo tecnico)
pilotajesRoutes.post("/", requerirTecnico, async (c) => {
  const user = c.get("user");
  const b = await c.req.json().catch(() => ({}));

  if (!b.nombre?.trim()) return c.json({ error: "El pilotaje necesita un nombre." }, 400);
  if (!AREA_IDS.includes(b.area)) return c.json({ error: "Area invalida." }, 400);
  if (!NIVEL_IDS.includes(b.nivel)) return c.json({ error: "Nivel invalido." }, 400);
  if (!GRADO_IDS.includes(b.grado)) return c.json({ error: "Grado invalido." }, 400);
  if (!Array.isArray(b.itemIds) || b.itemIds.length === 0) return c.json({ error: "Selecciona al menos un item." }, 400);

  // Solo items en estado apto_para_pilotaje del area/nivel/grado indicados
  const items = await Items.findByIds(b.itemIds);
  const invalidos = items.filter((i: any) => i.estado !== "apto_para_pilotaje");
  if (invalidos.length > 0) return c.json({ error: `${invalidos.length} item(s) no tienen estado "apto para pilotaje".` }, 400);

  const pilotaje = await Pilotajes.create(b, user.id);
  await registrar({
    accion: "CREAR_PRUEBA", entidad: "pilotajes", entidad_id: pilotaje.id,
    usuario: { id: user.id, nombre: user.nombre, correo: user.correo },
    detalle: { nombre: pilotaje.nombre, area: pilotaje.area, items: b.itemIds.length },
    ip: obtenerIp(c),
  });
  return c.json({ pilotaje }, 201);
});

// Actualizar pilotaje (nombre, notas, muestra, fecha, estado)
pilotajesRoutes.put("/:id", requerirTecnico, async (c) => {
  const id = c.req.param("id");
  if (!(await Pilotajes.findById(id))) return c.json({ error: "Pilotaje no encontrado." }, 404);
  const b = await c.req.json().catch(() => ({}));
  const pilotaje = await Pilotajes.update(id, b);
  return c.json({ pilotaje });
});

// Registrar resultado psicometrico de un item dentro de un pilotaje
// y mover el item a "disponible" o "descartado_pilotaje"
pilotajesRoutes.post("/:id/items/:itemId/resultado", requerirAdmin, async (c) => {
  const user = c.get("user");
  const { id, itemId } = c.req.param();
  const pilotaje = await Pilotajes.findById(id);
  if (!pilotaje) return c.json({ error: "Pilotaje no encontrado." }, 404);
  if (!pilotaje.itemIds.includes(itemId)) return c.json({ error: "El item no pertenece a este pilotaje." }, 400);

  const item = await Items.findById(itemId);
  if (!item) return c.json({ error: "Item no encontrado." }, 404);

  const b = await c.req.json().catch(() => ({}));
  const { aprobado, params } = b;

  // Guardar parametros psicometricos
  await Items.setParamsPsicometricos(itemId, params || {});

  // Mover el item al estado que corresponde
  const nuevoEstado = aprobado ? "disponible" : "descartado_pilotaje";
  const historial = [
    ...(item.historial || []),
    {
      fecha: new Date().toISOString().slice(0, 10),
      autor: user.nombre,
      accion: aprobado ? "Calibrado y disponible para uso operativo." : "Descartado tras analisis psicometrico.",
      comentario: b.comentario || undefined,
    },
  ];
  await Items.setEstado(itemId, nuevoEstado, historial);

  await registrar({
    accion: aprobado ? "APROBAR_ITEM" : "RECHAZAR_ITEM",
    entidad: "items", entidad_id: itemId,
    usuario: { id: user.id, nombre: user.nombre, correo: user.correo },
    detalle: { pilotaje: id, estado: nuevoEstado, params },
    ip: obtenerIp(c),
  });
  return c.json({ ok: true, estado: nuevoEstado });
});

// Eliminar pilotaje
pilotajesRoutes.delete("/:id", requerirAdmin, async (c) => {
  const id = c.req.param("id");
  const eliminado = await Pilotajes.remove(id);
  if (!eliminado) return c.json({ error: "Pilotaje no encontrado." }, 404);
  return c.body(null, 204);
});
