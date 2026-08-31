import { Hono } from "jsr:@hono/hono@4";
import { requerirAdmin } from "../auth.ts";
import { sql } from "../db.ts";
import { parseJsonb } from "../jsonb.ts";

export const auditRoutes = new Hono();

auditRoutes.use("*", requerirAdmin);

// Devuelve los registros de auditoría con filtros opcionales.
// Solo accesible por administradores.
auditRoutes.get("/", async (c) => {
  const accion   = c.req.query("accion")   || null;
  const usuarioId = c.req.query("usuario") || null;
  const desde    = c.req.query("desde")    || null;
  const hasta    = c.req.query("hasta")    || null;
  const limite   = Math.min(Number(c.req.query("limite") || 100), 500);
  const offset   = Number(c.req.query("offset") || 0);

  let rows;

  if (accion && usuarioId && desde && hasta) {
    rows = await sql`SELECT * FROM audit_log WHERE accion = ${accion} AND usuario_id = ${usuarioId} AND timestamp BETWEEN ${desde}::timestamptz AND ${hasta}::timestamptz ORDER BY timestamp DESC LIMIT ${limite} OFFSET ${offset}`;
  } else if (accion && usuarioId) {
    rows = await sql`SELECT * FROM audit_log WHERE accion = ${accion} AND usuario_id = ${usuarioId} ORDER BY timestamp DESC LIMIT ${limite} OFFSET ${offset}`;
  } else if (accion && desde && hasta) {
    rows = await sql`SELECT * FROM audit_log WHERE accion = ${accion} AND timestamp BETWEEN ${desde}::timestamptz AND ${hasta}::timestamptz ORDER BY timestamp DESC LIMIT ${limite} OFFSET ${offset}`;
  } else if (usuarioId && desde && hasta) {
    rows = await sql`SELECT * FROM audit_log WHERE usuario_id = ${usuarioId} AND timestamp BETWEEN ${desde}::timestamptz AND ${hasta}::timestamptz ORDER BY timestamp DESC LIMIT ${limite} OFFSET ${offset}`;
  } else if (accion) {
    rows = await sql`SELECT * FROM audit_log WHERE accion = ${accion} ORDER BY timestamp DESC LIMIT ${limite} OFFSET ${offset}`;
  } else if (usuarioId) {
    rows = await sql`SELECT * FROM audit_log WHERE usuario_id = ${usuarioId} ORDER BY timestamp DESC LIMIT ${limite} OFFSET ${offset}`;
  } else if (desde && hasta) {
    rows = await sql`SELECT * FROM audit_log WHERE timestamp BETWEEN ${desde}::timestamptz AND ${hasta}::timestamptz ORDER BY timestamp DESC LIMIT ${limite} OFFSET ${offset}`;
  } else {
    rows = await sql`SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ${limite} OFFSET ${offset}`;
  }

  const registros = rows.map((r: any) => ({
    id: r.id,
    timestamp: r.timestamp,
    accion: r.accion,
    entidad: r.entidad,
    entidadId: r.entidad_id,
    usuarioId: r.usuario_id,
    usuarioNombre: r.usuario_nombre,
    usuarioCorreo: r.usuario_correo,
    detalle: parseJsonb(r.detalle),
    ip: r.ip,
  }));

  const [{ total }] = await sql`SELECT COUNT(*)::int AS total FROM audit_log`;

  return c.json({ registros, total });
});

// Devuelve el historial de auditoría de un ítem específico.
auditRoutes.get("/item/:id", async (c) => {
  const id = c.req.param("id");
  const rows = await sql`
    SELECT * FROM audit_log
    WHERE entidad = 'items' AND entidad_id = ${id}
    ORDER BY timestamp ASC
  `;
  return c.json({ registros: rows.map((r: any) => ({
    id: r.id,
    timestamp: r.timestamp,
    accion: r.accion,
    usuarioNombre: r.usuario_nombre,
    usuarioCorreo: r.usuario_correo,
    detalle: parseJsonb(r.detalle),
    ip: r.ip,
  }))});
});
