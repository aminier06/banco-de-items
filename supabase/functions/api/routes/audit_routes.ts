import { Hono } from "jsr:@hono/hono@4";
import { requerirAdmin } from "../auth.ts";
import { sql } from "../db.ts";
import { parseJsonb } from "../jsonb.ts";

export const auditRoutes = new Hono();
auditRoutes.use("*", requerirAdmin);

auditRoutes.get("/", async (c) => {
  const accion = c.req.query("accion") || null;
  const desde  = c.req.query("desde")  || null;
  const hasta  = c.req.query("hasta")  || null;
  const limite = Math.min(Number(c.req.query("limite") || 100), 500);
  const offset = Number(c.req.query("offset") || 0);

  let rows;
  if (accion && desde && hasta) {
    rows = await sql`SELECT * FROM audit_log WHERE accion = ${accion} AND timestamp BETWEEN ${desde}::timestamptz AND ${hasta}::timestamptz ORDER BY timestamp DESC LIMIT ${limite} OFFSET ${offset}`;
  } else if (accion) {
    rows = await sql`SELECT * FROM audit_log WHERE accion = ${accion} ORDER BY timestamp DESC LIMIT ${limite} OFFSET ${offset}`;
  } else if (desde && hasta) {
    rows = await sql`SELECT * FROM audit_log WHERE timestamp BETWEEN ${desde}::timestamptz AND ${hasta}::timestamptz ORDER BY timestamp DESC LIMIT ${limite} OFFSET ${offset}`;
  } else {
    rows = await sql`SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ${limite} OFFSET ${offset}`;
  }

  const registros = rows.map((r: any) => ({
    id: r.id, timestamp: r.timestamp, accion: r.accion,
    entidad: r.entidad, entidadId: r.entidad_id,
    usuarioId: r.usuario_id, usuarioNombre: r.usuario_nombre,
    usuarioCorreo: r.usuario_correo, detalle: parseJsonb(r.detalle), ip: r.ip,
  }));

  const [{ total }] = await sql`SELECT COUNT(*)::int AS total FROM audit_log`;
  return c.json({ registros, total });
});
