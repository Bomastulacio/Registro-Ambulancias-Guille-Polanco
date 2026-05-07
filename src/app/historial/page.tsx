"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Trash2, Download } from "lucide-react";
import type { Viaje } from "@/lib/db";

function formatTiempo(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

const RutaCell = ({ origen, destino }: { origen: string; destino: string }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = origen.length > 35 || destino.length > 35;

  return (
    <div className="flex flex-col items-start gap-1">
      <div className={`text-text-primary ${expanded ? '' : 'line-clamp-1 break-all'}`} title={expanded ? '' : origen}>
        {origen}
      </div>
      <div className={`font-mono text-caption text-text-secondary ${expanded ? '' : 'line-clamp-1 break-all'}`} title={expanded ? '' : destino}>
        ➝ {destino}
      </div>
      {isLong && (
        <button 
          onClick={() => setExpanded(!expanded)}
          className="mt-1 font-mono text-[10px] uppercase text-text-disabled hover:text-text-primary transition-colors tracking-widest flex items-center gap-1"
        >
          {expanded ? '[- COMPRIMIR ]' : '[+ VER MÁS ]'}
        </button>
      )}
    </div>
  );
};

export default function Historial() {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [ambulancia, setAmbulancia] = useState("");
  const [tripulante, setTripulante] = useState("");

  const fetchViajes = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      if (ambulancia) params.append("ambulancia", ambulancia);
      if (tripulante) params.append("tripulante", tripulante);

      const res = await fetch(`/api/viajes?${params.toString()}`);
      const data = await res.json();
      setViajes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchViajes();
  }, [from, to, ambulancia, tripulante]);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este registro permanentemente?")) return;
    
    try {
      const res = await fetch(`/api/viajes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setViajes(viajes.filter(v => v.id !== id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const exportExcel = async () => {
    if (viajes.length === 0) return;
    
    const XLSX = await import("xlsx");
    
    const data = viajes.map(v => {
      let tripStr = "";
      try {
        const arr = JSON.parse(v.tripulacion);
        tripStr = arr.join(", ");
      } catch (e) {
        tripStr = v.tripulacion;
      }
      
      return {
        ID: v.id,
        Fecha: v.fecha,
        Ambulancia: v.ambulancia,
        Tripulacion: tripStr,
        Origen: v.origen,
        Destino: v.destino,
        KM: v.km,
        "Tiempo Est. (Min)": v.tiempo_estimado_minutos,
        Notas: v.notas || ""
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Viajes");
    
    XLSX.writeFile(workbook, `viajes_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-doto text-text-display text-4xl mb-2">HISTORIAL</h1>
          <p className="font-mono text-text-secondary text-sm uppercase tracking-widest">
            / REGISTROS DE VIAJES
          </p>
        </div>
        <button 
          onClick={exportExcel}
          className="border border-nd-border-visible text-text-primary font-mono text-sm uppercase px-4 py-2 hover:bg-surface-raised transition-colors flex items-center gap-2"
        >
          <Download size={16} />
          Exportar EXCEL
        </button>
      </div>

      {/* FILTROS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-nd-border-visible bg-surface-raised">
        <div className="flex flex-col gap-1">
          <label className="font-mono text-label text-text-secondary uppercase">Desde</label>
          <input 
            type="date" 
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="bg-transparent border-b border-nd-border-visible py-1 text-text-primary font-mono outline-none focus:border-text-primary"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-mono text-label text-text-secondary uppercase">Hasta</label>
          <input 
            type="date" 
            value={to}
            onChange={e => setTo(e.target.value)}
            className="bg-transparent border-b border-nd-border-visible py-1 text-text-primary font-mono outline-none focus:border-text-primary"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-mono text-label text-text-secondary uppercase">Ambulancia</label>
          <input 
            type="text" 
            placeholder="Buscar..."
            value={ambulancia}
            onChange={e => setAmbulancia(e.target.value)}
            className="bg-transparent border-b border-nd-border-visible py-1 text-text-primary font-mono outline-none focus:border-text-primary"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-mono text-label text-text-secondary uppercase">Tripulante</label>
          <input 
            type="text" 
            placeholder="Buscar..."
            value={tripulante}
            onChange={e => setTripulante(e.target.value)}
            className="bg-transparent border-b border-nd-border-visible py-1 text-text-primary font-mono outline-none focus:border-text-primary"
          />
        </div>
      </div>

      {/* TABLA */}
      <div className="overflow-x-auto w-full">
        {isLoading ? (
          <div className="py-12 flex justify-center text-text-secondary font-mono tracking-widest uppercase">
            [ CARGANDO... ]
          </div>
        ) : viajes.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center gap-4 border border-nd-border-visible border-dashed">
            <h3 className="font-mono text-text-secondary uppercase tracking-widest">[ SIN REGISTROS ]</h3>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr>
                <th className="font-mono text-label text-text-secondary uppercase pb-4 border-b border-nd-border-visible px-2">Fecha</th>
                <th className="font-mono text-label text-text-secondary uppercase pb-4 border-b border-nd-border-visible px-2">Ambulancia</th>
                <th className="font-mono text-label text-text-secondary uppercase pb-4 border-b border-nd-border-visible px-2">Ruta</th>
                <th className="font-mono text-label text-text-secondary uppercase pb-4 border-b border-nd-border-visible px-2 text-right">Métricas</th>
                <th className="font-mono text-label text-text-secondary uppercase pb-4 border-b border-nd-border-visible px-2 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {viajes.map((viaje) => {
                let tripStr = "";
                try {
                  const arr = JSON.parse(viaje.tripulacion);
                  tripStr = arr.join(", ");
                } catch (e) {
                  tripStr = viaje.tripulacion;
                }

                return (
                  <tr key={viaje.id} className="hover:bg-surface-raised transition-colors group">
                    <td className="py-4 px-2 border-b border-nd-border-visible align-top">
                      <div className="font-mono text-text-primary">{viaje.fecha}</div>
                    </td>
                    <td className="py-4 px-2 border-b border-nd-border-visible align-top">
                      <div className="font-mono text-text-primary">{viaje.ambulancia}</div>
                      <div className="font-mono text-caption text-text-secondary mt-1 max-w-[200px] truncate" title={tripStr}>
                        {tripStr}
                      </div>
                    </td>
                    <td className="py-4 px-2 border-b border-nd-border-visible align-top max-w-[300px]">
                      <RutaCell origen={viaje.origen} destino={viaje.destino} />
                    </td>
                    <td className="py-4 px-2 border-b border-nd-border-visible align-top text-right">
                      <div className="flex justify-end gap-4">
                        <div>
                          <span className="font-mono text-text-primary">{viaje.km}</span>
                          <span className="font-mono text-label text-text-secondary ml-1">KM</span>
                        </div>
                        <div>
                          <span className="font-mono text-text-primary">{viaje.tiempo_estimado_minutos ? formatTiempo(viaje.tiempo_estimado_minutos) : "—"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2 border-b border-nd-border-visible align-top text-right w-16">
                      <button 
                        onClick={() => viaje.id && handleDelete(viaje.id)}
                        className="text-text-disabled hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
