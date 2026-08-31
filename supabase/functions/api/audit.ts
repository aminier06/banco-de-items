// Módulo de auditoría: registra en la tabla audit_log todas las acciones
// relevantes del sistema. Se llama desde cada ruta después de que la
// acción principal ya se completó, para no bloquear la respuesta al cliente.
import { sql } from "./db.ts";

export type AccionAuditoria =
  | "LOGIN_EXITOSO"
  | "LOGIN_FALLIDO"
  | "CREAR_ITEM"
  | "EDITAR_ITEM"
  | "ELIMINAR_ITEM"
  | "ENVIAR_REVISION"
  | "APROBAR_ITEM"
  | "RECHAZAR_ITEM"
  | "IMPORTAR_ITEMS"
  | "CREAR_USUARIO"
  | "EDITAR_USUARIO"
  | "ELIMINAR_USUARIO"
  | "RESETEAR_PASSWORD"
  | "ACTUALIZAR_SPECS"
  | "CREAR_PRUEBA"
  | "ELIMINAR_PRUEBA";

interface RegistroAuditoria {
  accion: AccionAuditoria;
  entidad?: string;
  entidad_id?: string;
  usuario?: { id: string; nombre: string; correo: string } | null;
  detalle?: Record<string, unknown>;
  ip?: string | null;
}

export async function registrar(entrada: RegistroAuditoria): Promise<void> {
  try {
    const id = crypto.randomUUID();
    const detalle = entrada.detalle ? JSON.stringify(entrada.detalle) : null;
    await sql`
      INSERT INTO audit_log
        (id, accion, entidad, entidad_id, usuario_id, usuario_nombre, usuario_correo, detalle, ip)
      VALUES (
        ${id},
        ${entrada.accion},
        ${entrada.entidad ?? null},
        ${entrada.entidad_id ?? null},
        ${entrada.usuario?.id ?? null},
        ${entrada.usuario?.nombre ?? null},
        ${entrada.usuario?.correo ?? null},
        ${detalle ? sql`${detalle}::jsonb` : null},
        ${entrada.ip ?? null}
      )
    `;
  } catch (err) {
    // El registro de auditoría nunca debe tumbar la operación principal.
    console.error("Error registrando auditoría:", err);
  }
}

// Extrae la IP real del cliente desde los headers de Cloudflare/Supabase.
export function obtenerIp(c: { req: { header: (h: string) => string | undefined } }): string | null {
  return (
    c.req.header("cf-connecting-ip") ||
    c.req.header("x-real-ip") ||
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    null
  );
}
