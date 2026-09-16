import React from "react";
import { X } from "lucide-react";

// Vista previa del item tal como lo veria un estudiante:
// muestra contexto, imagen, enunciado y opciones sin marcar la correcta.
export default function ItemPreviewModal({ item, onClose }) {
  if (!item) return null;
  const letras = ["A", "B", "C", "D"];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 8, maxWidth: 680, width: "100%", maxHeight: "90vh", overflowY: "auto", padding: 32, position: "relative", fontFamily: "'PT Serif', serif" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", color: "#666" }}>
          <X size={20} />
        </button>

        <div style={{ fontSize: 11, color: "#888", marginBottom: 20, textTransform: "uppercase", letterSpacing: 1 }}>
          Vista previa del item
        </div>

        {item.contexto && (
          <div style={{ background: "#f8f7f4", border: "1px solid #ddd", borderRadius: 6, padding: "14px 18px", marginBottom: 20, fontSize: 14, lineHeight: 1.7, color: "#222" }}>
            {item.contexto}
          </div>
        )}

        {item.imagenUrl && (
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <img
              src={item.imagenUrl}
              alt="Material de apoyo"
              style={{ maxWidth: "100%", maxHeight: 300, objectFit: "contain", border: "1px solid #ddd", borderRadius: 4 }}
            />
          </div>
        )}

        <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.6, marginBottom: 18, color: "#1a1a1a" }}>
          {item.enunciado}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(item.opciones || []).map((op, idx) => (
            <div key={idx} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 14px", border: "1px solid #ddd", borderRadius: 6, background: "#fff", fontSize: 14, lineHeight: 1.5 }}>
              <span style={{ fontWeight: 700, minWidth: 22, color: "#333" }}>{letras[idx]}.</span>
              <span>{op}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #eee", fontSize: 11.5, color: "#999", display: "flex", gap: 16 }}>
          <span>Area: {item.area}</span>
          {item.dificultad && <span>Dificultad: {item.dificultad}</span>}
          {item.afirmacionId && <span>Afirmacion: {item.afirmacionId}</span>}
          {item.evidenciaId && <span>Evidencia: {item.evidenciaId}</span>}
        </div>
      </div>
    </div>
  );
}
