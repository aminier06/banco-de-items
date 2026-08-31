import { Hono } from "jsr:@hono/hono@4";
import { Specs } from "../models/specs.ts";
import { requerirSesion, requerirTecnico } from "../auth.ts";
import { AREA_IDS } from "../constants.ts";
import { registrar, obtenerIp } from "../audit.ts";

export const specsRoutes = new Hono();
specsRoutes.use("*", requerirSesion);

specsRoutes.get("/", async (c) => {
  return c.json({ specs: await Specs.all() });
});

specsRoutes.put("/:area", requerirTecnico, async (c) => {
  const area = c.req.param("area");
  if (!AREA_IDS.includes(area)) return c.json({ error: "Area invalida." }, 400);
  const body = await c.req.json().catch(() => ({}));
  const competencias = Array.isArray(body.competencias) ? body.competencias : null;
  if (!competencias) return c.json({ error: "Falta el arreglo de competencias." }, 400);
  for (const comp of competencias) {
    if (!comp.nombre || !String(comp.nombre).trim()) return c.json({ error: "Cada competencia necesita un nombre." }, 400);
    const afirmaciones = Array.isArray(comp.afirmaciones) ? comp.afirmaciones : [];
    const suma = afirmaciones.reduce((s: number, a: any) => s + Number(a.peso || 0), 0);
    if (afirmaciones.length > 0 && suma !== 100) return c.json({ error: `En "${comp.nombre}": los pesos deben sumar 100% (suman ${suma}%).` }, 400);
  }
  const spec = await Specs.upsert(area, { competencias });
  const user = c.get("user");
  await registrar({ accion: "ACTUALIZAR_SPECS", entidad: "specs", entidad_id: area,
    usuario: { id: user.id, nombre: user.nombre, correo: user.correo },
    detalle: { area, competencias: competencias.map((c: any) => c.nombre) }, ip: obtenerIp(c) });
  return c.json({ spec });
});
