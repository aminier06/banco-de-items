export const ROLES = ["elaborador", "revisor", "director_tecnico", "administrador"];

export const NIVELES = [
  { id: "primaria", nombre: "Primaria" },
  { id: "secundaria", nombre: "Secundaria" },
  { id: "adultos", nombre: "Adultos Secundaria" },
];
export const NIVEL_IDS = NIVELES.map((n) => n.id);

export const GRADOS = [
  { id: "tercero", nombre: "3ro" },
  { id: "sexto", nombre: "6to" },
  { id: "secundaria_adultos", nombre: "Secundaria" },
];
export const GRADO_IDS = GRADOS.map((g) => g.id);

export const GRADOS_POR_NIVEL: Record<string, string[]> = {
  primaria: ["tercero", "sexto"],
  secundaria: ["tercero", "sexto"],
  adultos: ["secundaria_adultos"],
};

export const AREAS_POR_GRADO: Record<string, string[]> = {
  tercero: ["lengua", "matematica"],
  sexto: ["lengua", "ciencias_naturaleza", "ciencias_sociales", "matematica"],
  secundaria_adultos: ["lengua", "ciencias_naturaleza", "ciencias_sociales", "matematica"],
};

export const AREAS = [
  { id: "lengua", nombre: "Lengua Espanola" },
  { id: "ciencias_naturaleza", nombre: "Ciencias de la Naturaleza" },
  { id: "ciencias_sociales", nombre: "Ciencias Sociales" },
  { id: "matematica", nombre: "Matematica" },
];
export const AREA_IDS = AREAS.map((a) => a.id);

export const DIFICULTADES = ["Baja", "Media", "Alta"];
export const ESTADOS = ["borrador", "en_revision", "revisado", "aprobado", "apto_para_pilotaje", "disponible", "descartado_pilotaje", "retirado", "liberado", "rechazado"];

export const esTecnico = (rol: string) => ["revisor", "director_tecnico", "administrador"].includes(rol);
export const esDirectorTecnico = (rol: string) => rol === "director_tecnico" || rol === "administrador";
export const esAdmin = (rol: string) => rol === "administrador";

