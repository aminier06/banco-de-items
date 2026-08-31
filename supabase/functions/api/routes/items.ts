import { Hono } from "jsr:@hono/hono@4";
import { Items } from "../models/items.ts";
import { requerirSesion, requerirAdmin } from "../auth.ts";
import { AREA_IDS, DIFICULTADES, esTecnico } from "../constants.ts";
import { registrar, obtenerIp } from "../audit.ts";

export const itemsRoutes = new Hono();
itemsRoutes.use("*", requerirSesion);

function puedeEditarItem(user: any, item: any) {
  return esTecnico(user.rol) || (item.autorId === user.id && (item.estado === "borrador" || item.estado === "rechazado"));
}

function puedeCrearEnArea(user: any, area: string) {
  return esTecnico(user.rol) || user.area === area;
}

const BUCKET = "item-images";
const LIMITE_BYTES = 5 * 1024 * 1024;

function obtenerClaveDeServicio(): string | null {
  const secretKeysJson = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeysJson) {
    try {
      const dict = JSON.parse(secretKeysJson);
      const primera = Object.values(dict)[0];
      if (typeof primera === "string" && primera) return primera;
    } catch { /* continuar con respaldo */ }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || null;
}

itemsRoutes.post("/upload-imagen", async (c) => {
  const body = await c.req.parseBody().catch(() => null);
  const archivo = body ? body["archivo"] : null;
  if (!(archivo instanceof File)) return c.json({ error: "No se recibio ningun archivo." }, 400);
  if (!archivo.type.startsWith("image/")) return c.json({ error: "El archivo debe ser una imagen." }, 400);
  if (archivo.size > LIMITE_BYTES) return c.json({ error: "La imagen no debe superar 5 MB." }, 400);
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = obtenerClaveDeServicio();
  if (!supabaseUrl || !serviceKey) return c.json({ error: "El almacenamiento no esta configurado." }, 500);
  const ext = (archivo.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const nombreArchivo = `${crypto.randomUUID()}.${ext}`;
  const bytes = await archivo.arrayBuffer();
  const subida = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}/${nombreArchivo}`, {
    method: "POST",
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": archivo.type },
    body: bytes,
  });
  if (!subida.ok) {
    const detalle = await subida.text().catch(() => "");
    console.error("Error subiendo imagen a Storage:", subida.status, detalle);
    return c.json({ error: "No se pudo subir la imagen. Verifica que el bucket 'item-images' exista." }, 500);
  }
  const url = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${nombreArchivo}`;
  return c.json({ url });
});

itemsRoutes.get("/", async (c) => {
  const area = c.req.query("area");
  const estado = c.req.query("estado");
  const items = await Items.list({ area, estado });
  return c.json({ items });
});

itemsRoutes.post("/", async (c) => {
  const user = c.get("user");
  const b = await c.req.json().catch(() => ({}));
  if (!AREA_IDS.includes(b.area)) return c.json({ error: "Area invalida." }, 400);
  if (!puedeCrearEnArea(user, b.area)) return c.json({ error: "No tienes permiso para crear items en esa area." }, 403);
  if (!b.enunciado?.trim()) return c.json({ error: "Falta el enunciado." }, 400);
  if (!Array.isArray(b.opciones) || b.opciones.length !== 4 || b.opciones.some((o: string) => !o?.trim())) return c.json({ error: "Se requieren las 4 opciones." }, 400);
  if (![0,1,2,3].includes(b.respuestaCorrecta)) return c.json({ error: "Respuesta correcta invalida." }, 400);
  if (!DIFICULTADES.includes(b.dificultad)) return c.json({ error: "Dificultad invalida." }, 400);
  const item = await Items.create({
    area: b.area, competenciaId: b.competenciaId, afirmacionId: b.afirmacionId,
    evidenciaId: b.evidenciaId, tareaId: b.tareaId, imagenUrl: b.imagenUrl,
    tipoTexto: b.tipoTexto, dificultad: b.dificultad, contexto: b.contexto,
    enunciado: b.enunciado.trim(), opciones: b.opciones, respuestaCorrecta: b.respuestaCorrecta,
    justificacionCorrecta: b.justificacionCorrecta, justificacionDistractores: b.justificacionDistractores,
    estado: "borrador",
    historial: [{ fecha: new Date().toISOString().slice(0,10), autor: user.nombre, accion: "Creacion del item." }],
  }, user.id);
  await registrar({ accion: "CREAR_ITEM", entidad: "items", entidad_id: item.id,
    usuario: { id: user.id, nombre: user.nombre, correo: user.correo },
    detalle: { area: item.area, dificultad: item.dificultad }, ip: obtenerIp(c) });
  return c.json({ item }, 201);
});

itemsRoutes.put("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const existente = await Items.findById(id);
  if (!existente) return c.json({ error: "Item no encontrado." }, 404);
  if (!puedeEditarItem(user, existente)) return c.json({ error: "No tienes permiso para editar este item." }, 403);
  const body = await c.req.json().catch(() => ({}));
  const item = await Items.update(id, body);
  await registrar({ accion: "EDITAR_ITEM", entidad: "items", entidad_id: id,
    usuario: { id: user.id, nombre: user.nombre, correo: user.correo },
    detalle: { area: existente.area, estado: existente.estado }, ip: obtenerIp(c) });
  return c.json({ item });
});

itemsRoutes.post("/:id/submit", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const item = await Items.findById(id);
  if (!item) return c.json({ error: "Item no encontrado." }, 404);
  if (item.autorId !== user.id || !["borrador","rechazado"].includes(item.estado)) return c.json({ error: "No puedes enviar este item a revision." }, 403);
  if (!item.afirmacionId || !item.evidenciaId) return c.json({ error: "Asigna afirmacion y evidencia antes de enviar." }, 400);
  const historial = [...item.historial, { fecha: new Date().toISOString().slice(0,10), autor: user.nombre, accion: "Enviado a revision." }];
  const actualizado = await Items.setEstado(item.id, "en_revision", historial);
  await registrar({ accion: "ENVIAR_REVISION", entidad: "items", entidad_id: id,
    usuario: { id: user.id, nombre: user.nombre, correo: user.correo },
    detalle: { area: item.area }, ip: obtenerIp(c) });
  return c.json({ item: actualizado });
});

itemsRoutes.post("/:id/review", async (c) => {
  const user = c.get("user");
  if (!esTecnico(user.rol)) return c.json({ error: "Requiere rol de Revisor/a o administrador." }, 403);
  const id = c.req.param("id");
  const item = await Items.findById(id);
  if (!item) return c.json({ error: "Item no encontrado." }, 404);
  if (item.estado !== "en_revision") return c.json({ error: "Este item no esta en revision." }, 400);
  if (user.rol === "revisor" && user.areasAsignadas !== null && user.areasAsignadas !== undefined) {
    if (!Array.isArray(user.areasAsignadas) || !user.areasAsignadas.includes(item.area)) {
      return c.json({ error: `No tienes asignada el area "${item.area}" para revisar este item.` }, 403);
    }
  }
  const body = await c.req.json().catch(() => ({}));
  const { aprobar, comentario } = body;
  if (!aprobar && !comentario?.trim()) return c.json({ error: "El comentario es obligatorio al rechazar." }, 400);
  const historial = [...item.historial, {
    fecha: new Date().toISOString().slice(0,10), autor: user.nombre,
    accion: aprobar ? "Aprobado." : "Rechazado.", comentario: comentario || undefined,
  }];
  const nuevoEstado = aprobar ? "aprobado" : "rechazado";
  const actualizado = await Items.setEstado(item.id, nuevoEstado, historial);
  await registrar({ accion: aprobar ? "APROBAR_ITEM" : "RECHAZAR_ITEM", entidad: "items", entidad_id: id,
    usuario: { id: user.id, nombre: user.nombre, correo: user.correo },
    detalle: { area: item.area, comentario: comentario || null }, ip: obtenerIp(c) });
  return c.json({ item: actualizado });
});

itemsRoutes.delete("/:id", requerirAdmin, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const item = await Items.findById(id);
  const eliminado = await Items.remove(id);
  if (!eliminado) return c.json({ error: "Item no encontrado." }, 404);
  await registrar({ accion: "ELIMINAR_ITEM", entidad: "items", entidad_id: id,
    usuario: { id: user.id, nombre: user.nombre, correo: user.correo },
    detalle: { area: item?.area, enunciado: item?.enunciado?.slice(0,80) }, ip: obtenerIp(c) });
  return c.body(null, 204);
});

itemsRoutes.post("/import", requerirAdmin, async (c) => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  const filas = Array.isArray(body?.items) ? body.items : [];
  if (filas.length === 0) return c.json({ error: "No se recibieron filas para importar." }, 400);
  const nombreArchivo = body?.nombreArchivo || "archivo externo";
  const validas = filas.filter((f: any) =>
    AREA_IDS.includes(f.area) && f.enunciado?.trim() &&
    Array.isArray(f.opciones) && f.opciones.length === 4 &&
    f.opciones.every((o: string) => o?.trim()) && [0,1,2,3].includes(f.respuestaCorrecta)
  ).map((f: any) => ({
    ...f,
    dificultad: DIFICULTADES.includes(f.dificultad) ? f.dificultad : "Media",
    justificacionCorrecta: f.justificacionCorrecta || "(Pendiente de revision).",
    historial: [{ fecha: new Date().toISOString().slice(0,10), autor: user.nombre, accion: `Migrado desde "${nombreArchivo}".` }],
  }));
  const creados = await Items.bulkImport(validas, user.id);
  await registrar({ accion: "IMPORTAR_ITEMS", entidad: "items", entidad_id: null,
    usuario: { id: user.id, nombre: user.nombre, correo: user.correo },
    detalle: { archivo: nombreArchivo, importados: creados, descartados: filas.length - validas.length }, ip: obtenerIp(c) });
  return c.json({ importados: creados, descartados: filas.length - validas.length }, 201);
});
