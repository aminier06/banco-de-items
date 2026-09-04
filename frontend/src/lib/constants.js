export const NIVELES = [
  { id: "primaria", nombre: "Primaria" },
  { id: "secundaria", nombre: "Secundaria" },
  { id: "adultos", nombre: "Adultos Secundaria" },
];

export const GRADOS = [
  { id: "tercero", nombre: "3ro" },
  { id: "sexto", nombre: "6to" },
  { id: "secundaria_adultos", nombre: "Secundaria" },
];

export const GRADOS_POR_NIVEL = {
  primaria: ["tercero", "sexto"],
  secundaria: ["tercero", "sexto"],
  adultos: ["secundaria_adultos"],
};

export const AREAS_POR_GRADO = {
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

export function areaInfo(id) {
  return AREAS.find((a) => a.id === id) || { id, nombre: id };
}

export const ROL_LABELS = {
  elaborador: "Elaborador/a",
  revisor: "Revisor/a",
  administrador: "Administrador/a",
};

export const DIFICULTADES = ["Baja", "Media", "Alta"];

export const ORDEN_ESTADOS = ["borrador","en_revision","aprobado","apto_para_pilotaje","disponible","descartado_pilotaje","retirado","liberado","rechazado"];

export const ESTADOS = {
  borrador:            { label: "Borrador",           color: "#8a8a8a" },
  en_revision:         { label: "En revision",        color: "#d4a017" },
  aprobado:            { label: "Aprobado",           color: "#3f6b4f" },
  apto_para_pilotaje:  { label: "Apto para pilotaje", color: "#1a6fa8" },
  disponible:          { label: "Disponible",         color: "#2e7d32" },
  descartado_pilotaje: { label: "Descartado",         color: "#b71c1c" },
  retirado:            { label: "Retirado",           color: "#6d4c41" },
  liberado:            { label: "Liberado",           color: "#6a1b9a" },
  rechazado:           { label: "Rechazado",          color: "#a23b3b" },
};

