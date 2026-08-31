import React, { useState, useEffect, useCallback } from "react";
import { Search, Download } from "lucide-react";

const ACCIONES = [
  "LOGIN_EXITOSO", "LOGIN_FALLIDO",
  "CREAR_ITEM", "EDITAR_ITEM", "ELIMINAR_ITEM",
  "ENVIAR_REVISION", "APROBAR_ITEM", "RECHAZAR_ITEM", "IMPORTAR_ITEMS",
  "CREAR_USUARIO", "EDITAR_USUARIO", "ELIMINAR_USUARIO", "RESETEAR_PASSWORD",
  "ACTUALIZAR_SPECS", "CREAR_PRUEBA", "ELIMINAR_PRUEBA",
];

const ETIQUETAS = {
  LOGIN_EXITOSO: "Inicio de sesion",
  LOGIN_FALLIDO: "Intento fallido de acceso",
  CREAR_ITEM: "Creacion de item",
  EDITAR_ITEM: "Edicion de item",
  ELIMINAR_ITEM: "Eliminacion de item",
  ENVIAR_REVISION: "Envio a revision",
  APROBAR_ITEM: "Aprobacion de item",
  RECHAZAR_ITEM: "Rechazo de item",
  IMPORTAR_ITEMS: "Importacion masiva",
  CREAR_USUARIO: "Creacion de usuario",
  EDITAR_USUARIO: "Edicion de usuario",
  ELIMINAR_USUARIO: "Eliminacion de usuario",
  RESETEAR_PASSWORD: "Cambio de contrasena",
  ACTUALIZAR_SPECS: "Actualizacion de especificaciones",
  CREAR_PRUEBA: "Creacion de prueba",
  ELIMINAR_PRUEBA: "Eliminacion de prueba",
};

const COLORES = {
  LOGIN_EXITOSO: "var(--green)",
  LOGIN_FALLIDO: "var(--red)",
  ELIMINAR_ITEM: "var(--red)",
  ELIMINAR_USUARIO: "var(--red)",
  ELIMINAR_PRUEBA: "var(--red)",
  APROBAR_ITEM: "var(--green)",
  RECHAZAR_ITEM: "var(--amber)",
};

function formatearFecha(ts) {
  if (!ts) return "-";
  const d = new Date(ts);
  return d.toLocaleString("es-DO", { dateStyle: "short", timeStyle: "medium" });
}

export default function AuditoriaLog({ api }) {
  const [registros, setRegistros] = useState([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [accion, setAccion] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [pagina, setPagina] = useState(0);
  const LIMITE = 50;

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (accion) params.set("accion", accion);
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta + "T23:59:59");
      params.set("limite", LIMITE);
      params.set("offset", pagina * LIMITE);
      const data = await api.get(`/audit?${params.toString()}`);
      setRegistros(data.registros || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, [accion, desde, hasta, pagina, api]);

  useEffect(() => { cargar(); }, [cargar]);

  const filtrados = busqueda.trim()
    ? registros.filter((r) =>
        (r.usuarioNombre || "").toLowerCase().includes(busqueda.toLowerCase()) ||
        (r.usuarioCorreo || "").toLowerCase().includes(busqueda.toLowerCase()) ||
        (r.entidadId || "").toLowerCase().includes(busqueda.toLowerCase())
      )
    : registros;

  const exportarCSV = () => {
    const cabecera = ["Fecha/Hora", "Accion", "Usuario", "Correo", "Entidad", "ID Entidad", "IP", "Detalle"];
    const filas = filtrados.map((r) => [
      formatearFecha(r.timestamp),
      ETIQUETAS[r.accion] || r.accion,
      r.usuarioNombre || "-",
      r.usuarioCorreo || "-",
      r.entidad || "-",
      r.entidadId || "-",
      r.ip || "-",
      r.detalle ? JSON.stringify(r.detalle) : "-",
    ]);
    const csv = [cabecera, ...filas].map((f) => f.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1 className="f-display" style={{ fontSize: 24, marginBottom: 2 }}>Registro de auditoría</h1>
      <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginBottom: 16 }}>
        Historial completo de acciones en el sistema. Solo visible para administradores.
      </p>

      <div className="bib-card" style={{ padding: 14, marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <label className="bib-label">Tipo de accion</label>
          <select className="bib-select" value={accion} onChange={(e) => { setAccion(e.target.value); setPagina(0); }}>
            <option value="">Todas</option>
            {ACCIONES.map((a) => <option key={a} value={a}>{ETIQUETAS[a] || a}</option>)}
          </select>
        </div>
        <div>
          <label className="bib-label">Desde</label>
          <input className="bib-input" type="date" value={desde} onChange={(e) => { setDesde(e.target.value); setPagina(0); }} />
        </div>
        <div>
          <label className="bib-label">Hasta</label>
          <input className="bib-input" type="date" value={hasta} onChange={(e) => { setHasta(e.target.value); setPagina(0); }} />
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label className="bib-label">Buscar usuario o ID</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input className="bib-input" placeholder="Nombre, correo o ID de entidad..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ flex: 1 }} />
          </div>
        </div>
        <button className="bib-btn bib-btn-ghost" onClick={exportarCSV} title="Exportar a CSV">
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 8 }}>
        {cargando ? "Cargando..." : `Mostrando ${filtrados.length} de ${total} registros totales`}
      </div>

      <div style={{ overflowX: "auto", border: "1px solid var(--rule)", borderRadius: 3 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: "var(--surface)", borderBottom: "2px solid var(--rule)" }}>
              <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600 }}>Fecha/Hora</th>
              <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600 }}>Accion</th>
              <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600 }}>Usuario</th>
              <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600 }}>Entidad</th>
              <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600 }}>IP</th>
              <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600 }}>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 20, textAlign: "center", color: "var(--ink-soft)" }}>
                  {cargando ? "Cargando registros..." : "No se encontraron registros con los filtros aplicados."}
                </td>
              </tr>
            )}
            {filtrados.map((r, i) => (
              <tr key={r.id} style={{ borderBottom: "1px solid var(--rule)", background: i % 2 === 0 ? "#fff" : "var(--surface)" }}>
                <td style={{ padding: "7px 10px", whiteSpace: "nowrap", color: "var(--ink-soft)" }}>
                  {formatearFecha(r.timestamp)}
                </td>
                <td style={{ padding: "7px 10px" }}>
                  <span style={{ color: COLORES[r.accion] || "var(--navy)", fontWeight: 600 }}>
                    {ETIQUETAS[r.accion] || r.accion}
                  </span>
                </td>
                <td style={{ padding: "7px 10px" }}>
                  <div style={{ fontWeight: 500 }}>{r.usuarioNombre || <em style={{ color: "var(--ink-soft)" }}>Desconocido</em>}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>{r.usuarioCorreo}</div>
                </td>
                <td style={{ padding: "7px 10px" }}>
                  {r.entidad && <span className="code-pill">{r.entidad}</span>}
                  {r.entidadId && <div style={{ fontSize: 10.5, color: "var(--ink-soft)", marginTop: 2 }}>{r.entidadId.slice(0, 12)}...</div>}
                </td>
                <td style={{ padding: "7px 10px", color: "var(--ink-soft)", fontSize: 11 }}>{r.ip || "-"}</td>
                <td style={{ padding: "7px 10px", fontSize: 11, color: "var(--ink-soft)", maxWidth: 250 }}>
                  {r.detalle ? (
                    <details>
                      <summary style={{ cursor: "pointer" }}>Ver detalle</summary>
                      <pre style={{ fontSize: 10, marginTop: 4, whiteSpace: "pre-wrap" }}>{JSON.stringify(r.detalle, null, 2)}</pre>
                    </details>
                  ) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > LIMITE && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
          <button className="bib-btn bib-btn-ghost" disabled={pagina === 0} onClick={() => setPagina(p => p - 1)}>
            Anterior
          </button>
          <span style={{ padding: "6px 10px", fontSize: 13 }}>
            Pagina {pagina + 1} de {Math.ceil(total / LIMITE)}
          </span>
          <button className="bib-btn bib-btn-ghost" disabled={(pagina + 1) * LIMITE >= total} onClick={() => setPagina(p => p + 1)}>
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
