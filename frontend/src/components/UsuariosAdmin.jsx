import React, { useState } from "react";
import { UserPlus, Edit2, Trash2, KeyRound, Eye, EyeOff } from "lucide-react";
import { AREAS, AREA_IDS } from "../lib/constants.js";
import { Banner } from "./shared.jsx";

const ROLES_LABEL = { elaborador: "Elaborador/a", revisor: "Revisor/a", administrador: "Administrador/a" };

function FormUsuario({ inicial, onGuardar, onCancelar, titulo }) {
  const [form, setForm] = useState(inicial);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  const esNuevo = !inicial.id;
  const esElaborador = form.rol === "elaborador";
  const esRevisor = form.rol === "revisor";
  // areasAsignadas para revisores: null = todas, [] = ninguna, [ids] = esas areas
  const todasLasAreas = form.areasAsignadas === null || form.areasAsignadas === undefined;

  const toggleArea = (areaId) => {
    const actuales = form.areasAsignadas || [];
    if (actuales.includes(areaId)) {
      setForm({ ...form, areasAsignadas: actuales.filter((a) => a !== areaId) });
    } else {
      setForm({ ...form, areasAsignadas: [...actuales, areaId] });
    }
  };

  const guardar = async () => {
    setError("");
    setGuardando(true);
    try {
      await onGuardar(form);
    } catch (err: any) {
      setError(err.message || "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="bib-card" style={{ padding: 16, marginBottom: 16 }}>
      <h3 className="f-display" style={{ fontSize: 15, marginBottom: 12 }}>{titulo}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <label className="bib-label">Nombre completo</label>
          <input className="bib-input" value={form.nombre || ""} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </div>
        <div>
          <label className="bib-label">Correo institucional</label>
          <input className="bib-input" type="email" value={form.correo || ""} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
        </div>
        <div>
          <label className="bib-label">Rol</label>
          <select className="bib-select" value={form.rol || "elaborador"} onChange={(e) => setForm({ ...form, rol: e.target.value, area: "", areasAsignadas: null })}>
            <option value="elaborador">Elaborador/a</option>
            <option value="revisor">Revisor/a</option>
            <option value="administrador">Administrador/a</option>
          </select>
        </div>
        {esElaborador && (
          <div>
            <label className="bib-label">Area asignada</label>
            <select className="bib-select" value={form.area || ""} onChange={(e) => setForm({ ...form, area: e.target.value })}>
              <option value="">Selecciona un area...</option>
              {AREAS.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
        )}
        {esNuevo && (
          <div>
            <label className="bib-label">Contrasena inicial</label>
            <div style={{ display: "flex", gap: 6 }}>
              <input className="bib-input" type={verPassword ? "text" : "password"} value={form.password || ""} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ flex: 1 }} />
              <button className="bib-btn bib-btn-ghost" onClick={() => setVerPassword(!verPassword)} style={{ padding: "0 8px" }}>
                {verPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        )}
      </div>

      {esRevisor && (
        <div style={{ marginBottom: 12 }}>
          <label className="bib-label">Areas que puede revisar</label>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={todasLasAreas}
                onChange={(e) => setForm({ ...form, areasAsignadas: e.target.checked ? null : [] })}
              />
              Todas las areas
            </label>
          </div>
          {!todasLasAreas && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingLeft: 4 }}>
              {AREAS.map((a) => (
                <label key={a.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={(form.areasAsignadas || []).includes(a.id)}
                    onChange={() => toggleArea(a.id)}
                  />
                  {a.nombre}
                </label>
              ))}
            </div>
          )}
          {!todasLasAreas && (form.areasAsignadas || []).length === 0 && (
            <div style={{ fontSize: 12, color: "var(--amber)", marginTop: 4 }}>Sin areas seleccionadas: no podra revisar ningun item.</div>
          )}
        </div>
      )}

      {error && <div style={{ color: "var(--red)", fontSize: 12.5, marginBottom: 10 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="bib-btn bib-btn-primary" disabled={guardando} onClick={guardar}>
          {guardando ? "Guardando..." : "Guardar"}
        </button>
        <button className="bib-btn bib-btn-ghost" onClick={onCancelar}>Cancelar</button>
      </div>
    </div>
  );
}

export default function UsuariosAdmin({ users, onCreate, onUpdate, onDelete, onResetPassword }) {
  const [creando, setCreando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [passwordMostrado, setPasswordMostrado] = useState({});
  const [busqueda, setBusqueda] = useState("");

  const filtrados = users.filter((u) =>
    u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.correo.toLowerCase().includes(busqueda.toLowerCase())
  );

  const resetear = async (id) => {
    const resultado = await onResetPassword(id);
    if (resultado?.password) {
      setPasswordMostrado((prev) => ({ ...prev, [id]: resultado.password }));
    }
  };

  const etiquetaAreas = (user) => {
    if (user.rol !== "revisor") return null;
    if (!user.areasAsignadas || user.areasAsignadas.length === 0) return "Todas las areas";
    return user.areasAsignadas.map((id) => AREAS.find((a) => a.id === id)?.nombre || id).join(", ");
  };

  return (
    <div>
      <h1 className="f-display" style={{ fontSize: 24, marginBottom: 2 }}>Gestion de usuarios</h1>
      <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginBottom: 16 }}>
        Crea y administra las cuentas del equipo. Los revisores/as pueden tener asignadas una, varias o todas las areas.
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input className="bib-input" style={{ flex: 1 }} placeholder="Buscar por nombre o correo..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        {!creando && (
          <button className="bib-btn bib-btn-primary" onClick={() => { setCreando(true); setEditandoId(null); }}>
            <UserPlus size={14} /> Nuevo usuario
          </button>
        )}
      </div>

      {creando && (
        <FormUsuario
          titulo="Crear usuario"
          inicial={{ nombre: "", correo: "", rol: "elaborador", area: "", password: "", areasAsignadas: null }}
          onGuardar={async (form) => { await onCreate(form); setCreando(false); }}
          onCancelar={() => setCreando(false)}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtrados.map((u) => (
          <div key={u.id}>
            {editandoId === u.id ? (
              <FormUsuario
                titulo={`Editar: ${u.nombre}`}
                inicial={{ ...u, password: "" }}
                onGuardar={async (form) => { await onUpdate(u.id, form); setEditandoId(null); }}
                onCancelar={() => setEditandoId(null)}
              />
            ) : (
              <div className="bib-card" style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{u.nombre}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    {u.correo} &nbsp;·&nbsp;
                    <span className="code-pill">{ROLES_LABEL[u.rol] || u.rol}</span>
                    {u.rol === "elaborador" && u.area && (
                      <> &nbsp;·&nbsp; {AREAS.find((a) => a.id === u.area)?.nombre || u.area}</>
                    )}
                    {u.rol === "revisor" && (
                      <> &nbsp;·&nbsp; <span style={{ color: "var(--ink-soft)" }}>{etiquetaAreas(u)}</span></>
                    )}
                  </div>
                  {passwordMostrado[u.id] && (
                    <Banner tone="amber" style={{ marginTop: 6 }}>
                      Contrasena temporal: <strong>{passwordMostrado[u.id]}</strong> — comparte esto con la persona y pide que la cambie de inmediato.
                    </Banner>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="bib-btn bib-btn-ghost" onClick={() => { setEditandoId(u.id); setCreando(false); }}>
                    <Edit2 size={13} />
                  </button>
                  <button className="bib-btn bib-btn-ghost" onClick={() => resetear(u.id)} title="Restablecer contrasena">
                    <KeyRound size={13} />
                  </button>
                  <button className="bib-btn bib-btn-ghost" style={{ color: "var(--red)" }} onClick={() => { if (confirm(`Eliminar a ${u.nombre}?`)) onDelete(u.id); }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtrados.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--ink-soft)", padding: 20 }}>No se encontraron usuarios.</div>
        )}
      </div>
    </div>
  );
}

