import { Document, Packer, Paragraph, TextRun, ImageRun, PageBreak } from "docx";

const LETRAS = ["A", "B", "C", "D"];

async function fetchImagen(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase() || "png";
    const type = ext === "jpg" || ext === "jpeg" ? "jpg" : "png";
    return { data: buf, type };
  } catch {
    return null;
  }
}

function resolverTarea(item, specs) {
  const spec = specs[item.area];
  const competencias = Array.isArray(spec?.competencias)
    ? spec.competencias
    : Array.isArray(spec?.afirmaciones)
    ? [{ id: "principal", nombre: spec.nombre || "", afirmaciones: spec.afirmaciones }]
    : [];
  const comp = competencias.find((c) => c.id === item.competenciaId) || competencias[0];
  const af = comp?.afirmaciones?.find((a) => a.id === item.afirmacionId);
  const ev = af?.evidencias?.find((e) => e.id === item.evidenciaId);
  const tarea = ev?.tareas?.find((t) => t.id === item.tareaId);
  return { comp, af, ev, tarea };
}

export async function generarDocxItems(items, specs) {
  const children = [];

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const { comp, af, ev, tarea } = resolverTarea(item, specs);

    // Tarea (encima del item)
    if (tarea) {
      children.push(new Paragraph({
        children: [new TextRun({ text: `Tarea: ${tarea.texto}`, bold: true, size: 20, color: "1565c0" })],
        spacing: { after: 120 },
      }));
    } else if (ev) {
      children.push(new Paragraph({
        children: [new TextRun({ text: `Evidencia: ${ev.texto}`, bold: true, size: 20, color: "1565c0" })],
        spacing: { after: 120 },
      }));
    }

    // Contexto
    if (item.contexto?.trim()) {
      children.push(new Paragraph({
        children: [new TextRun({ text: item.contexto, italics: true, size: 22 })],
        spacing: { after: 140 },
        indent: { left: 360 },
      }));
    }

    // Imagen
    if (item.imagenUrl) {
      const img = await fetchImagen(item.imagenUrl);
      if (img) {
        children.push(new Paragraph({
          children: [new ImageRun({ data: img.data, type: img.type, transformation: { width: 380, height: 240 } })],
          spacing: { after: 140 },
        }));
      }
    }

    // Enunciado
    children.push(new Paragraph({
      children: [new TextRun({ text: item.enunciado, bold: true, size: 24 })],
      spacing: { after: 140 },
    }));

    // Opciones
    for (let i = 0; i < (item.opciones || []).length; i++) {
      children.push(new Paragraph({
        children: [new TextRun({ text: `${LETRAS[i]}. ${item.opciones[i]}`, size: 22 })],
        spacing: { after: 80 },
        indent: { left: 360 },
      }));
    }

    // Clave y justificaciones
    children.push(new Paragraph({
      children: [new TextRun({ text: `Clave: ${LETRAS[item.respuestaCorrecta] || "?"}`, bold: true, color: "3f6b4f", size: 22 })],
      spacing: { before: 200, after: 100 },
    }));

    if (item.justificacionCorrecta?.trim()) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: "Justificacion de la respuesta correcta: ", bold: true, size: 22 }),
          new TextRun({ text: item.justificacionCorrecta, size: 22 }),
        ],
        spacing: { after: 100 },
      }));
    }

    if (item.justificacionDistractores?.trim()) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: "Justificacion de los distractores: ", bold: true, size: 22 }),
          new TextRun({ text: item.justificacionDistractores, size: 22 }),
        ],
        spacing: { after: 100 },
      }));
    }

    // Salto de pagina entre items (excepto el ultimo)
    if (idx < items.length - 1) {
      children.push(new Paragraph({
        children: [new PageBreak()],
      }));
    }
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  return Packer.toBlob(doc);
}

export function descargarBlob(blob, nombreArchivo) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(url);
}
