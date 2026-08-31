export const ROLES = ["elaborador", "revisor", "administrador"];

export const NIVELES = [
  { id: "primaria", nombre: "Primaria" },
  { id: "secundaria", nombre: "Secundaria" },
];
export const NIVEL_IDS = NIVELES.map((n) => n.id);

export const GRADOS = [
  { id: "tercero", nombre: "3ro" },
  { id: "sexto", nombre: "6to" },
];
export const GRADO_IDS = GRADOS.map((g) => g.id);

// Areas disponibles segun el grado (igual para primaria y secundaria).
// En 3ro solo se evaluan Lengua y Matematica.
export const AREAS_POR_GRADO: Record<string, string[]> = {
  tercero: ["lengua", "matematica"],
  sexto: ["lengua", "ciencias_naturaleza", "ciencias_sociales", "matematica"],
};

export const AREAS = [
  { id: "lengua", nombre: "Lengua Espanola" },
  { id: "ciencias_naturaleza", nombre: "Ciencias de la Naturaleza" },
  { id: "ciencias_sociales", nombre: "Ciencias Sociales" },
  { id: "matematica", nombre: "Matematica" },
];
export const AREA_IDS = AREAS.map((a) => a.id);

export const DIFICULTADES = ["Baja", "Media", "Alta"];
export const ESTADOS = ["borrador", "en_revision", "aprobado", "rechazado"];

export const esTecnico = (rol: string) => rol === "revisor" || rol === "administrador";
export const esAdmin = (rol: string) => rol === "administrador";
