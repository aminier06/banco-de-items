import { Hono } from "jsr:@hono/hono@4";
import { Specs } from "../models/specs.ts";
import { requerirSesion, requerirTecnico } from "../auth.ts";
import { AREA_IDS, NIVEL_IDS, GRADO_IDS, AREAS_POR_GRADO } from "../constants.ts";
import { registrar, obtenerIp } from "../audit.ts";

export const specsRoutes = new Hono();
specsRoutes.use("*", requerirSesion);

// GET /specs?nivel=primaria&grado=sexto
specsRoutes.get("/", async (c) => {
  const nivel = c.req.query("nivel") || "secundaria";
  const grado = c.req.query("grado") || "sexto";
  if (!NIVEL_IDS.includes(nivel) || !GRADO_IDS.includes(grado)) {
    return c.json({ error: "Nivel o grado invalido." }, 400);
  }
  return c.json({ specs: await Specs.all(nivel, grado) });
});

// PUT /specs/:area?nivel=primaria&grado=sexto
specsRoutes.put("/:area", requerirTecnico, async (c) => {
  const area = c.req.param("area");
  const nivel = c.req.query("nivel") || "secundaria";
  const grado = c.req.query("grado") || "sexto";

  if (!AREA_IDS.includes(area)) return c.json({ error: "Area invalida." }, 400);
  if (!NIVEL_IDS.includes(nivel) || !GRADO_IDS.includes(grado)) return c.json({ error: "Nivel o grado invalido." }, 400);

  // Validar que el area este disponible para ese grado
  if (!AREAS_POR_GRADO[grado]?.includes(area)) {
    return c.json({ error: `El area "${area}" no se evalua en ${grado}.` }, 400);
  }

  const body = await c.req.json().catch(() => ({}));
  const competencias = Array.isArray(body.competencias) ? body.competencias : null;
  if (!competencias) return c.json({ error: "Falta el arreglo de competencias." }, 400);

  for (const comp of competencias) {
    if (!comp.nombre || !String(comp.nombre).trim()) return c.json({ error: "Cada competencia necesita un nombre." }, 400);
    const afirmaciones = Array.isArray(comp.afirmaciones) ? comp.afirmaciones : [];
    const suma = afirmaciones.reduce((s: number, a: any) => s + Number(a.peso || 0), 0);
    if (afirmaciones.length > 0 && suma !== 100) {
      return c.json({ error: `En "${comp.nombre}": los pesos deben sumar 100% (suman ${suma}%).` }, 400);
    }
  }

  const spec = await Specs.upsert(area, nivel, grado, { competencias });
  const user = c.get("user");
  await registrar({
    accion: "ACTUALIZAR_SPECS", entidad: "specs", entidad_id: `${area}-${nivel}-${grado}`,
    usuario: { id: user.id, nombre: user.nombre, correo: user.correo },
    detalle: { area, nivel, grado, competencias: competencias.map((c: any) => c.nombre) },
    ip: obtenerIp(c),
  });
  return c.json({ spec });
});
