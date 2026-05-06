"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Activity, Users, Truck, Route } from "lucide-react";

interface Stats {
  totals: { viajes: number; km: number; promedio: number };
  ambulancias: { ambulancia: string; viajes: number; km: number }[];
  tripulacion: { nombre: string; viajes: number; km: number }[];
  topRutas: { ruta: string; cantidad: number }[];
}

export default function Resumen() {
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/stats?month=${month}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setStats(data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [month]);

  if (isLoading && !stats) {
    return (
      <div className="flex justify-center py-24">
        <span className="font-mono text-text-secondary uppercase tracking-widest">[ CALCULANDO MÉTRICAS... ]</span>
      </div>
    );
  }

  // Segmented Bar helper
  const SegmentedBar = ({ value, max }: { value: number; max: number }) => {
    if (max === 0) return null;
    const segments = 20; // 20 discrete blocks
    const filledSegments = Math.ceil((value / max) * segments);
    
    return (
      <div className="flex gap-[2px] w-full h-[8px] mt-2">
        {Array.from({ length: segments }).map((_, i) => (
          <div 
            key={i} 
            className={`flex-1 ${i < filledSegments ? 'bg-text-display' : 'bg-nd-border'}`} 
          />
        ))}
      </div>
    );
  };

  const maxRuta = stats?.topRutas.length ? Math.max(...stats.topRutas.map(r => r.cantidad)) : 0;

  return (
    <div className="flex flex-col gap-12">
      <div className="flex justify-between items-end border-b border-nd-border-visible pb-4">
        <div>
          <h1 className="font-doto text-text-display text-4xl mb-2">RESUMEN</h1>
          <p className="font-mono text-text-secondary text-sm uppercase tracking-widest">
            / MÉTRICAS OPERATIVAS
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-mono text-label text-text-secondary uppercase">Período</label>
          <input 
            type="month" 
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="bg-transparent border-b border-nd-border-visible py-1 text-text-primary font-mono outline-none focus:border-text-primary text-right"
          />
        </div>
      </div>

      {/* TOTALS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-raised border border-nd-border-visible p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <span className="font-mono text-label text-text-secondary uppercase">Totales</span>
            <Activity className="text-text-secondary" size={20} />
          </div>
          <div>
            <div className="font-doto text-text-display text-6xl leading-none tracking-tighter">
              {stats?.totals.viajes || 0}
            </div>
            <div className="font-mono text-text-secondary text-sm uppercase mt-2">Viajes en el período</div>
          </div>
        </div>

        <div className="bg-surface-raised border border-nd-border-visible p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <span className="font-mono text-label text-text-secondary uppercase">Distancia</span>
            <Route className="text-text-secondary" size={20} />
          </div>
          <div>
            <div className="font-doto text-text-display text-6xl leading-none tracking-tighter flex items-baseline gap-2">
              {Math.round(stats?.totals.km || 0)}
              <span className="text-xl font-mono text-text-secondary">KM</span>
            </div>
            <div className="font-mono text-text-secondary text-sm uppercase mt-2">Recorridos totales</div>
          </div>
        </div>

        <div className="bg-surface-raised border border-nd-border-visible p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <span className="font-mono text-label text-text-secondary uppercase">Promedio</span>
            <Activity className="text-text-secondary" size={20} />
          </div>
          <div>
            <div className="font-doto text-text-display text-6xl leading-none tracking-tighter flex items-baseline gap-2">
              {(stats?.totals.promedio || 0).toFixed(1)}
              <span className="text-xl font-mono text-text-secondary">KM</span>
            </div>
            <div className="font-mono text-text-secondary text-sm uppercase mt-2">Promedio por viaje</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* TRIPULACION */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-nd-border-visible pb-2">
            <Users className="text-text-secondary" size={18} />
            <h2 className="font-mono text-text-primary tracking-widest uppercase">Tripulación</h2>
          </div>
          {stats?.tripulacion.length === 0 ? (
             <span className="font-mono text-text-disabled text-sm">SIN DATOS</span>
          ) : (
            <div className="flex flex-col">
              {stats?.tripulacion.map((t, idx) => (
                <div key={idx} className="flex justify-between items-center py-3 border-b border-nd-border-visible/50 last:border-0">
                  <span className="font-mono text-text-primary">{t.nombre}</span>
                  <div className="flex gap-6 text-right font-mono">
                    <div className="w-16">
                      <span className="text-text-primary">{t.viajes}</span>
                      <span className="text-label text-text-secondary block">VIAJES</span>
                    </div>
                    <div className="w-20">
                      <span className="text-text-primary">{Math.round(t.km)}</span>
                      <span className="text-label text-text-secondary block">KM</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AMBULANCIAS */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-nd-border-visible pb-2">
            <Truck className="text-text-secondary" size={18} />
            <h2 className="font-mono text-text-primary tracking-widest uppercase">Unidades</h2>
          </div>
          {stats?.ambulancias.length === 0 ? (
             <span className="font-mono text-text-disabled text-sm">SIN DATOS</span>
          ) : (
            <div className="flex flex-col">
              {stats?.ambulancias.map((a, idx) => (
                <div key={idx} className="flex justify-between items-center py-3 border-b border-nd-border-visible/50 last:border-0">
                  <span className="font-mono text-text-primary">{a.ambulancia}</span>
                  <div className="flex gap-6 text-right font-mono">
                    <div className="w-16">
                      <span className="text-text-primary">{a.viajes}</span>
                      <span className="text-label text-text-secondary block">VIAJES</span>
                    </div>
                    <div className="w-20">
                      <span className="text-text-primary">{Math.round(a.km)}</span>
                      <span className="text-label text-text-secondary block">KM</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TOP RUTAS */}
      <div className="flex flex-col gap-6 mt-4">
        <div className="flex items-center gap-3 border-b border-nd-border-visible pb-2">
          <Route className="text-text-secondary" size={18} />
          <h2 className="font-mono text-text-primary tracking-widest uppercase">Top 5 Rutas</h2>
        </div>
        
        {stats?.topRutas.length === 0 ? (
             <span className="font-mono text-text-disabled text-sm">SIN DATOS</span>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats?.topRutas.map((ruta, idx) => (
              <div key={idx} className="flex flex-col p-4 border border-nd-border-visible">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <span className="text-text-primary text-sm font-medium leading-snug">{ruta.ruta}</span>
                  <span className="font-mono text-text-display">{ruta.cantidad}</span>
                </div>
                <SegmentedBar value={ruta.cantidad} max={maxRuta} />
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
