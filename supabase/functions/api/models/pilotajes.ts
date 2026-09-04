import { sql } from "../db.ts";
import { parseJsonb } from "../jsonb.ts";

function mapRow(row: any) {
  if (!row) return null;
  return {
    id: row.id, nombre: row.nombre, nivel: row.nivel, grado: row.grado,
    area: row.area, convocatoria: row.convocatoria, muestraN: row.muestra_n,
    fechaAplicacion: row.fecha_aplicacion, estado: row.estado,
    itemIds: parseJsonb(row.item_ids), notas: row.notas,
    creadoPorId: row.creado_por_id, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export const Pilotajes = {
  async list(nivel?: string, grado?: string) {
    const rows = nivel && grado
      ? await sql`SELECT * FROM pilotajes WHERE nivel = ${nivel} AND grado = ${grado} ORDER BY created_at DESC`
      : await sql`SELECT * FROM pilotajes ORDER BY created_at DESC`;
    return rows.map(mapRow);
  },
  async findById(id: string) {
    const rows = await sql`SELECT * FROM pilotajes WHERE id = ${id}`;
    return mapRow(rows[0]);
  },
  async create(b: any, creadoPorId: string) {
    const id = crypto.randomUUID();
    await sql`
      INSERT INTO pilotajes (id, nombre, nivel, grado, area, convocatoria, muestra_n, fecha_aplicacion, item_ids, notas, creado_por_id)
      VALUES (${id}, ${b.nombre}, ${b.nivel}, ${b.grado}, ${b.area}, ${b.convocatoria || null},
        ${b.muestraN || null}, ${b.fechaAplicacion || null},
        ${JSON.stringify(b.itemIds || [])}::jsonb, ${b.notas || null}, ${creadoPorId})
    `;
    return this.findById(id);
  },
  async update(id: string, b: any) {
    await sql`
      UPDATE pilotajes SET nombre = ${b.nombre}, convocatoria = ${b.convocatoria || null},
        muestra_n = ${b.muestraN || null}, fecha_aplicacion = ${b.fechaAplicacion || null},
        estado = ${b.estado || "en_proceso"}, notas = ${b.notas || null}, updated_at = now()
      WHERE id = ${id}
    `;
    return this.findById(id);
  },
  async remove(id: string) {
    const result = await sql`DELETE FROM pilotajes WHERE id = ${id}`;
    return result.count > 0;
  },
};
