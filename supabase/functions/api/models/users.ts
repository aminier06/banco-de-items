import { sql } from "../db.ts";
import { parseJsonb } from "../jsonb.ts";

function mapRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre,
    correo: row.correo,
    passwordHash: row.password_hash,
    rol: row.rol,
    area: row.area,
    areasAsignadas: parseJsonb(row.areas_asignadas),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toPublic(user: any) {
  if (!user) return null;
  const { passwordHash, ...resto } = user;
  return resto;
}

export const Users = {
  async list() {
    const rows = await sql`SELECT * FROM users ORDER BY nombre ASC`;
    return rows.map(mapRow);
  },

  async findById(id: string) {
    const rows = await sql`SELECT * FROM users WHERE id = ${id}`;
    return mapRow(rows[0]);
  },

  async findByCorreo(correo: string) {
    const rows = await sql`SELECT * FROM users WHERE correo = ${correo}`;
    return mapRow(rows[0]);
  },

  async create({ nombre, correo, passwordHash, rol, area, areasAsignadas }: any) {
    const id = crypto.randomUUID();
    const areasJson = areasAsignadas ? JSON.stringify(areasAsignadas) : null;
    await sql`
      INSERT INTO users (id, nombre, correo, password_hash, rol, area, areas_asignadas)
      VALUES (${id}, ${nombre}, ${correo}, ${passwordHash}, ${rol}, ${area ?? null}, ${areasJson ? sql`${areasJson}::jsonb` : null})
    `;
    return this.findById(id);
  },

  async update(id: string, { nombre, correo, rol, area, areasAsignadas }: any) {
    const areasJson = areasAsignadas ? JSON.stringify(areasAsignadas) : null;
    await sql`
      UPDATE users SET
        nombre = ${nombre},
        correo = ${correo},
        rol = ${rol},
        area = ${area ?? null},
        areas_asignadas = ${areasJson ? sql`${areasJson}::jsonb` : null},
        updated_at = now()
      WHERE id = ${id}
    `;
    return this.findById(id);
  },

  async updatePassword(id: string, passwordHash: string) {
    await sql`UPDATE users SET password_hash = ${passwordHash}, updated_at = now() WHERE id = ${id}`;
  },

  async remove(id: string) {
    const result = await sql`DELETE FROM users WHERE id = ${id}`;
    return result.count > 0;
  },
};
