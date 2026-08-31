export const NIVELES = [
  { id: "primaria", nombre: "Primaria" },
  { id: "secundaria", nombre: "Secundaria" },
];

export const GRADOS = [
  { id: "tercero", nombre: "3ro" },
  { id: "sexto", nombre: "6to" },
];

// Areas disponibles segun grado (igual para primaria y secundaria)
export const AREAS_POR_GRADO = {
  tercero: ["lengua", "matematica"],
  sexto: ["lengua", "ciencias_naturaleza", "ciencias_sociales", "matematica"],
};

export const AREAS = [
  { id: "lengua", nombre: "Lengua Espanola" },
  { id: "ciencias_naturaleza", nombre: "Ciencias de la Naturaleza" },
  { id: "ciencias_sociales", nombre: "Ciencias Sociales" },
  { id: "matematica", nombre: "Matematica" },
];

export function areaInfo(id) {
  return AREAS.find((a) => a.id === id) || { id, nombre: id };
}

export const ROL_LABELS = {
  elaborador: "Elaborador/a",
  revisor: "Revisor/a",
  administrador: "Administrador/a",
};

export const DIFICULTADES = ["Baja", "Media", "Alta"];

export const ESTADOS = ["borrador", "en_revision", "aprobado", "rechazado"];

export const ORDEN_ESTADOS = {
  borrador: 0,
  en_revision: 1,
  aprobado: 2,
  rechazado: 3,
};

