import { sql } from "../db.ts";
import { parseJsonb } from "../jsonb.ts";

function mapRow(row: any) {
  if (!row) return null;
  return { area: row.area, nivel: row.nivel, grado: row.grado, nombre: row.nombre, ...parseJsonb(row.data) };
}

export const Specs = {
  // Devuelve todas las specs del nivel+grado activo, indexadas por area.
  async all(nivel: string, grado: string) {
    const rows = await sql`SELECT * FROM specs WHERE nivel = ${nivel} AND grado = ${grado}`;
    const porArea: Record<string, any> = {};
    rows.forEach((f: any) => { porArea[f.area] = mapRow(f); });
    return porArea;
  },

  async get(area: string, nivel: string, grado: string) {
    const rows = await sql`SELECT * FROM specs WHERE area = ${area} AND nivel = ${nivel} AND grado = ${grado}`;
    return mapRow(rows[0]);
  },

  async upsert(area: string, nivel: string, grado: string, body: any) {
    const competencias = Array.isArray(body?.competencias) ? body.competencias : [];
    const data = JSON.stringify({ competencias });
    await sql`
      INSERT INTO specs (area, nivel, grado, nombre, data)
      VALUES (${area}, ${nivel}, ${grado}, ${area}, ${data}::jsonb)
      ON CONFLICT (area, nivel, grado) DO UPDATE SET data = EXCLUDED.data
    `;
    return this.get(area, nivel, grado);
  },
};
