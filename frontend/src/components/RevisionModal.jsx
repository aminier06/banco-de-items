import React, { useState } from "react";
import { CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { ModalShell } from "./shared.jsx";

// Modal de revision con tres opciones:
// - Revisor: "Aprobar y enviar al Director Tecnico" / "Rechazar"
// - Director Tecnico: "Aprobar para pilotaje" / "Devolver al revisor" / "Rechazar definitivamente"
export default function RevisionModal({ item, currentUser, esDirector, onClose, onDecidir }) {
  const [decision, setDecision] = useState(null);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  if (!item) return null;

  const requiereComentario = decision === "rechazar" || decision === "devolver";

  const confirmar = async () => {
    if (requiereComentario && !comentario.trim()) {
      setError("El comentario es obligatorio al rechazar o devolver un item.");
      return;
    }
    setEnviando(true);
    setError("");
    try {
      await onDecidir(item, decision, comentario);
    } catch (err) {
      setError(err.message || "No se pudo procesar la decision.");
      setEnviando(false);
    }
  };

  const opciones = esDirector
    ? [
        { id: "aprobar", label: "Aprobar para pilotaje", color: "var(--green)", icono: <CheckCircle size={14} />, desc: "El item queda como apto para pilotaje." },
        { id: "devolver", label: "Devolver al revisor", color: "var(--amber)", icono: <RotateCcw size={14} />, desc: "El item vuelve a en revision con tu comentario." },
        { id: "rechazar", label: "Rechazar definitivamente", color: "var(--red)", icono: <XCircle size={14} />, desc: "El item queda rechazado y el elaborador debe corregirlo." },
      ]
    : [
        { id: "aprobar", label: "Aprobar y enviar al Director Tecnico", color: "var(--green)", icono: <CheckCircle size={14} />, desc: "El item pasa a revision del Director Tecnico." },
        { id: "rechazar", label: "Rechazar", color: "var(--red)", icono: <XCircle size={14} />, desc: "El item vuelve al elaborador con tu comentario." },
      ];

  return (
    <ModalShell onClose={onClose} title="Revision del item" wide>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 6 }}>Enunciado</div>
        <p style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>{item.enunciado}</p>
        {item.contexto && (
          <div style={{ marginTop: 10, padding: "10px 14px", background: "var(--surface)", borderRadius: 4, fontSize: 13, lineHeight: 1.6, color: "var(--ink-soft)" }}>
            {item.contexto}
          </div>
        )}
        {item.imagenUrl && (
          <img src={item.imagenUrl} alt="" style={{ marginTop: 10, maxWidth: 240, maxHeight: 160, objectFit: "contain", border: "1px solid var(--rule)", borderRadius: 3 }} />
        )}
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 6 }}>Opciones de respuesta</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {(item.opciones || []).map((op, idx) => (
            <div key={idx} style={{ display: "flex", gap: 8, padding: "6px 10px", background: idx === item.respuestaCorrecta ? "rgba(63,107,79,0.08)" : "transparent", borderRadius: 4, border: "1px solid var(--rule)", fontSize: 13 }}>
              <span className="f-mono" style={{ fontWeight: 700, minWidth: 18 }}>{String.fromCharCode(65+idx)}.</span>
              <span>{op}</span>
              {idx === item.respuestaCorrecta && <span style={{ marginLeft: "auto", color: "var(--green)", fontSize: 11 }}>Correcta</span>}
            </div>
          ))}
        </div>
      </div>

      {item.justificacionCorrecta && (
        <div style={{ marginBottom: 14, padding: "8px 12px", background: "rgba(63,107,79,0.05)", borderRadius: 4, fontSize: 12.5 }}>
          <strong>Justificacion de la respuesta correcta:</strong> {item.justificacionCorrecta}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div className="bib-label">Decision</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {opciones.map((op) => (
            <label key={op.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 14px", border: `2px solid ${decision === op.id ? op.color : "var(--rule)"}`, borderRadius: 6, cursor: "pointer", background: decision === op.id ? `${op.color}10` : "#fff" }}>
              <input type="radio" name="decision" value={op.id} checked={decision === op.id} onChange={() => { setDecision(op.id); setError(""); }} style={{ marginTop: 2 }} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 13.5, color: op.color }}>
                  {op.icono} {op.label}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>{op.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="bib-label">
          Comentario {requiereComentario ? "(obligatorio)" : "(opcional)"}
        </label>
        <textarea className="bib-textarea" rows={3} value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder={requiereComentario ? "Explica el motivo de tu decision..." : "Observaciones para el elaborador o el Director Tecnico..."} />
      </div>

      {error && <div style={{ color: "var(--red)", fontSize: 12.5, marginBottom: 10 }}>{error}</div>}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button className="bib-btn bib-btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="bib-btn bib-btn-primary" disabled={!decision || enviando} onClick={confirmar}>
          {enviando ? "Procesando..." : "Confirmar decision"}
        </button>
      </div>
    </ModalShell>
  );
}
