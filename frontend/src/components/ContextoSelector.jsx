import React from "react";
import { NIVELES, GRADOS } from "../lib/constants.js";

// Selector de contexto de trabajo: nivel educativo + grado.
// Aparece en el menu lateral y define todo lo que el usuario ve y crea.
export default function ContextoSelector({ nivel, grado, onChange }) {
  return (
    <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.08)", borderRadius: 6, marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
        Contexto de trabajo
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <select
          value={nivel}
          onChange={(e) => onChange(e.target.value, grado)}
          style={{
            flex: 1, background: "rgba(255,255,255,0.12)", color: "#fff",
            border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4,
            padding: "4px 6px", fontSize: 12, cursor: "pointer",
          }}
        >
          {NIVELES.map((n) => (
            <option key={n.id} value={n.id} style={{ background: "#1c3144", color: "#fff" }}>
              {n.nombre}
            </option>
          ))}
        </select>
        <select
          value={grado}
          onChange={(e) => onChange(nivel, e.target.value)}
          style={{
            flex: 1, background: "rgba(255,255,255,0.12)", color: "#fff",
            border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4,
            padding: "4px 6px", fontSize: 12, cursor: "pointer",
          }}
        >
          {GRADOS.map((g) => (
            <option key={g.id} value={g.id} style={{ background: "#1c3144", color: "#fff" }}>
              {g.nombre}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
