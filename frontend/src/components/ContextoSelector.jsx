import React from "react";
import { NIVELES, GRADOS, GRADOS_POR_NIVEL } from "../lib/constants.js";

export default function ContextoSelector({ nivel, grado, onChange }) {
  const gradosDisponibles = GRADOS.filter(g => (GRADOS_POR_NIVEL[nivel] || []).includes(g.id));

  const handleNivel = (nuevoNivel) => {
    const disponibles = GRADOS_POR_NIVEL[nuevoNivel] || [];
    const nuevoGrado = disponibles.includes(grado) ? grado : disponibles[0];
    onChange(nuevoNivel, nuevoGrado);
  };

  return (
    <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.08)", borderRadius: 6, marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
        Contexto de trabajo
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <select
          value={nivel}
          onChange={(e) => handleNivel(e.target.value)}
          style={{
            background: "rgba(255,255,255,0.12)", color: "#fff",
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
        {gradosDisponibles.length > 1 && (
          <select
            value={grado}
            onChange={(e) => onChange(nivel, e.target.value)}
            style={{
              background: "rgba(255,255,255,0.12)", color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4,
              padding: "4px 6px", fontSize: 12, cursor: "pointer",
            }}
          >
            {gradosDisponibles.map((g) => (
              <option key={g.id} value={g.id} style={{ background: "#1c3144", color: "#fff" }}>
                {g.nombre}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
