import React, { useState, useMemo } from "react";
import { Plus, Save, CheckCircle, XCircle, FlaskConical, Trash2 } from "lucide-react";
import { AREAS, areaInfo } from "../lib/constants.js";
import { Banner } from "./shared.jsx";

const ESTADO_LABELS = {
  en_proceso: { label: "En proceso", color: "var(--amber)" },
  finalizado: { label: "Finalizado", color: "var(--green)" },
  cancelado:  { label: "Cancelado",  color: "var(--red)" },
};

const UMBRAL_EXPOSICION = 3;

function ModalNuevoPilotaje({ items, nivel, grado, currentUser, onGuardar, onCerrar }) {
  const [nombre, setNombre] = useState("");
  const [area, setArea] = useState("lengua");
  const [convocatoria, setConvocatoria] = useState("Primera convocatoria");
  const [muestraN, setMuestraN] = useState("");
  const [fechaAplicacion, setFechaAplicacion] = useState("");
  const [seleccionados, setSeleccionados] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const aptos = items.filter((i) => i.area === area && i.nivel === nivel && i.grado === grado && i.estado === "apto_para_pilotaje");

  const toggle = (id) => setSeleccionados((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const guardar = async () => {
    if (!nombre.trim()) { setError("El pilotaje necesita un nombre."); return; }
    if (seleccionados.length === 0) { setError("Selecciona al menos un item."); return; }
    setGuardando(true);
    try {
      await onGuardar({ nombre: nombre.trim(), nivel, grado, area, convocatoria, muestraN: Number(muestraN) || null, fechaAplicacion: fechaAplicacion || null, itemIds: seleccionados });
      onCerrar();
    } catch (err) {
      setError(err.message || "No se pudo crear el pilotaje.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="bib-card" style={{ width: 640, maxHeight: "90vh", overflowY: "auto", padding: 24 }}>
        <h2 className="f-display" style={{ fontSize: 18, marginBottom: 16 }}>Nuevo pilotaje</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label className="bib-label">Nombre del pilotaje</label>
            <input className="bib-input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Pilotaje 2026 Lengua Secundaria 6to" />
          </div>
          <div>
            <label className="bib-label">Area</label>
            <select className="bib-select" value={area} onChange={(e) => { setArea(e.target.value); setSeleccionados([]); }}>
              {AREAS.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="bib-label">Convocatoria</label>
            <select className="bib-select" value={convocatoria} onChange={(e) => setConvocatoria(e.target.value)}>
              <option>Primera convocatoria</option>
              <option>Segunda convocatoria</option>
              <option>Tercera convocatoria</option>
            </select>
          </div>
          <div>
            <label className="bib-label">Tamaño de la muestra</label>
            <input className="bib-input" type="number" value={muestraN} onChange={(e) => setMuestraN(e.target.value)} placeholder="Ej. 800" />
          </div>
          <div>
            <label className="bib-label">Fecha de aplicacion</label>
            <input className="bib-input" type="date" value={fechaAplicacion} onChange={(e) => setFechaAplicacion(e.target.value)} />
          </div>
        </div>

        <label className="bib-label">Items aptos para pilotaje ({aptos.length} disponibles)</label>
        {aptos.length === 0 ? (
          <Banner tone="amber">No hay items con estado "apto para pilotaje" en {areaInfo(area).nombre} para este contexto.</Banner>
        ) : (
          <div style={{ maxHeight: 240, overflowY: "auto", border: "1px solid var(--rule)", borderRadius: 4, marginBottom: 14 }}>
            {aptos.map((it) => (
              <label key={it.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 10px", borderBottom: "1px solid var(--rule)", cursor: "pointer", background: seleccionados.includes(it.id) ? "rgba(28,49,68,0.06)" : "#fff" }}>
                <input type="checkbox" checked={seleccionados.includes(it.id)} onChange={() => toggle(it.id)} style={{ marginTop: 2 }} />
                <span style={{ fontSize: 13 }}>{it.enunciado?.slice(0, 90)}... <span className="code-pill">{it.dificultad}</span></span>
              </label>
            ))}
          </div>
        )}

        {error && <div style={{ color: "var(--red)", fontSize: 12.5, marginBottom: 10 }}>{error}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="bib-btn bib-btn-ghost" onClick={onCerrar}>Cancelar</button>
          <button className="bib-btn bib-btn-primary" disabled={guardando} onClick={guardar}>
            <Save size={14} /> {guardando ? "Guardando..." : `Crear pilotaje (${seleccionados.length} items)`}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalResultado({ item, pilotajeId, onGuardar, onCerrar }) {
  const [aprobado, setAprobado] = useState(null);
  const [dificultad, setDificultad] = useState("");
  const [discriminacion, setDiscriminacion] = useState("");
  const [b, setB] = useState("");
  const [a, setA] = useState("");
  const [resultadoDif, setResultadoDif] = useState("sin_dif");
  const [comentario, setComentario] = useState("");
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (aprobado === null) return;
    setGuardando(true);
    const params = {
      dificultad_tct: dificultad ? Number(dificultad) : undefined,
      discriminacion: discriminacion ? Number(discriminacion) : undefined,
      parametros_rasch: (b || a) ? { b: b ? Number(b) : undefined, a: a ? Number(a) : undefined } : undefined,
      resultado_dif: resultadoDif,
    };
    await onGuardar(item.id, pilotajeId, aprobado, params, comentario);
    onCerrar();
    setGuardando(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="bib-card" style={{ width: 520, padding: 24 }}>
        <h3 className="f-display" style={{ fontSize: 16, marginBottom: 4 }}>Resultado psicometrico</h3>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 16 }}>{item.enunciado?.slice(0, 80)}...</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div>
            <label className="bib-label">Dificultad TCT (p)</label>
            <input className="bib-input" type="number" step="0.01" min="0" max="1" placeholder="0.00 - 1.00" value={dificultad} onChange={(e) => setDificultad(e.target.value)} />
          </div>
          <div>
            <label className="bib-label">Discriminacion (rpb)</label>
            <input className="bib-input" type="number" step="0.01" min="-1" max="1" placeholder="-1.00 - 1.00" value={discriminacion} onChange={(e) => setDiscriminacion(e.target.value)} />
          </div>
          <div>
            <label className="bib-label">Parametro b (Rasch)</label>
            <input className="bib-input" type="number" step="0.01" placeholder="Logits" value={b} onChange={(e) => setB(e.target.value)} />
          </div>
          <div>
            <label className="bib-label">Parametro a (discriminacion TRI)</label>
            <input className="bib-input" type="number" step="0.01" placeholder="0 - 2.5" value={a} onChange={(e) => setA(e.target.value)} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label className="bib-label">Resultado DIF</label>
            <select className="bib-select" value={resultadoDif} onChange={(e) => setResultadoDif(e.target.value)}>
              <option value="sin_dif">Sin DIF detectado</option>
              <option value="dif_moderado">DIF moderado</option>
              <option value="dif_alto">DIF alto</option>
            </select>
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label className="bib-label">Comentario (opcional)</label>
            <textarea className="bib-textarea" rows={2} value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Observaciones sobre el item..." />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="bib-label">Decision</label>
          <div style={{ display: "flex", gap: 10 }}>
            <button className={`bib-btn ${aprobado === true ? "bib-btn-primary" : "bib-btn-ghost"}`} style={aprobado === true ? { background: "var(--green)", borderColor: "var(--green)" } : {}} onClick={() => setAprobado(true)}>
              <CheckCircle size={14} /> Disponible (pasa psicometria)
            </button>
            <button className={`bib-btn ${aprobado === false ? "bib-btn-primary" : "bib-btn-ghost"}`} style={aprobado === false ? { background: "var(--red)", borderColor: "var(--red)" } : {}} onClick={() => setAprobado(false)}>
              <XCircle size={14} /> Descartar (no pasa)
            </button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="bib-btn bib-btn-ghost" onClick={onCerrar}>Cancelar</button>
          <button className="bib-btn bib-btn-primary" disabled={aprobado === null || guardando} onClick={guardar}>
            <Save size={14} /> {guardando ? "Guardando..." : "Guardar resultado"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PilotajePanel({ pilotajes, items, nivel, grado, isAdmin, esTecnico, onCrear, onResultado, onEliminar }) {
  const [creando, setCreando] = useState(false);
  const [resultandoItem, setResultandoItem] = useState(null);
  const [resultandoPilotajeId, setResultandoPilotajeId] = useState(null);

  const pilotajesFiltrados = pilotajes.filter((p) => p.nivel === nivel && p.grado === grado);

  // Items con sobreexposicion
  const sobreexpuestos = items.filter((i) => i.exposicionCount >= UMBRAL_EXPOSICION && ["disponible", "aprobado"].includes(i.estado));

  return (
    <div>
      <h1 className="f-display" style={{ fontSize: 24, marginBottom: 2 }}>Pilotaje</h1>
      <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginBottom: 16 }}>
        Gestiona los cuadernillos piloto y registra los resultados psicometricos de cada item.
      </p>

      {sobreexpuestos.length > 0 && (
        <Banner tone="amber" style={{ marginBottom: 16 }}>
          <strong>{sobreexpuestos.length} item(s)</strong> han superado el umbral de exposicion ({UMBRAL_EXPOSICION} pruebas operativas). Considera retirarlos o liberarlos desde el Banco de items.
        </Banner>
      )}

      {esTecnico && (
        <button className="bib-btn bib-btn-primary" style={{ marginBottom: 16 }} onClick={() => setCreando(true)}>
          <Plus size={14} /> Nuevo pilotaje
        </button>
      )}

      {pilotajesFiltrados.length === 0 && (
        <div className="bib-card" style={{ padding: 20, textAlign: "center", color: "var(--ink-soft)" }}>
          No hay pilotajes para este contexto todavia.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {pilotajesFiltrados.map((p) => {
          const itemsPilotaje = items.filter((i) => p.itemIds.includes(i.id));
          const pendientes = itemsPilotaje.filter((i) => i.estado === "apto_para_pilotaje");
          const disponibles = itemsPilotaje.filter((i) => i.estado === "disponible");
          const descartados = itemsPilotaje.filter((i) => i.estado === "descartado_pilotaje");

          return (
            <div key={p.id} className="bib-card" style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{p.nombre}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
                    <span className="code-pill">{areaInfo(p.area).nombre}</span> &nbsp;·&nbsp;
                    {p.convocatoria} &nbsp;·&nbsp;
                    {p.muestraN ? `N = ${p.muestraN}` : "Muestra no definida"} &nbsp;·&nbsp;
                    {p.fechaAplicacion || "Fecha pendiente"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: ESTADO_LABELS[p.estado]?.color }}>{ESTADO_LABELS[p.estado]?.label}</span>
                  {isAdmin && <button className="bib-btn bib-btn-ghost" style={{ color: "var(--red)" }} onClick={() => { if (confirm("Eliminar este pilotaje?")) onEliminar(p.id); }}><Trash2 size={13} /></button>}
                </div>
              </div>

              <div style={{ display: "flex", gap: 16, fontSize: 12.5, marginBottom: 12 }}>
                <span>Total: <strong>{p.itemIds.length}</strong></span>
                <span style={{ color: "var(--amber)" }}>Pendientes: <strong>{pendientes.length}</strong></span>
                <span style={{ color: "var(--green)" }}>Disponibles: <strong>{disponibles.length}</strong></span>
                <span style={{ color: "var(--red)" }}>Descartados: <strong>{descartados.length}</strong></span>
              </div>

              {isAdmin && pendientes.length > 0 && (
                <div>
                  <div className="bib-label" style={{ marginBottom: 6 }}>Items pendientes de resultado</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {pendientes.map((it) => (
                      <div key={it.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "var(--surface)", borderRadius: 4, fontSize: 13 }}>
                        <span>{it.enunciado?.slice(0, 80)}...</span>
                        <button className="bib-btn bib-btn-ghost" style={{ fontSize: 11 }} onClick={() => { setResultandoItem(it); setResultandoPilotajeId(p.id); }}>
                          <FlaskConical size={12} /> Registrar resultado
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {creando && (
        <ModalNuevoPilotaje items={items} nivel={nivel} grado={grado} onGuardar={onCrear} onCerrar={() => setCreando(false)} />
      )}
      {resultandoItem && (
        <ModalResultado item={resultandoItem} pilotajeId={resultandoPilotajeId} onGuardar={onResultado} onCerrar={() => { setResultandoItem(null); setResultandoPilotajeId(null); }} />
      )}
    </div>
  );
}
