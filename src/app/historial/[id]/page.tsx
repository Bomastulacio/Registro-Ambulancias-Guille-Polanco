"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, MapPin, Truck, Users, User, FileText, Route } from "lucide-react";
import type { Viaje } from "@/lib/db";

function formatTiempo(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

function parseList(val: string): string[] {
  try { const arr = JSON.parse(val); return Array.isArray(arr) ? arr : []; }
  catch { return val ? [val] : []; }
}

const RouteMap = dynamic(() => import("@/components/RouteMap"), { ssr: false });

export default function DetalleViaje() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/viajes/${id}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => setViaje(data))
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, [id]);

  const hasCoords =
    viaje?.origen_lat != null &&
    viaje?.origen_lon != null &&
    viaje?.destino_lat != null &&
    viaje?.destino_lon != null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <span className="font-mono text-text-secondary uppercase tracking-widest">[ CARGANDO... ]</span>
      </div>
    );
  }

  if (error || !viaje) {
    return (
      <div className="flex flex-col items-center gap-6 py-24">
        <span className="font-mono text-text-secondary uppercase tracking-widest">[ REGISTRO NO ENCONTRADO ]</span>
        <Link href="/historial" className="font-mono text-xs text-text-secondary uppercase tracking-widest hover:text-text-primary transition-colors flex items-center gap-2">
          <ArrowLeft size={14} /> VOLVER AL HISTORIAL
        </Link>
      </div>
    );
  }

  const tripulacion = parseList(viaje.tripulacion);
  const pacientes = parseList(viaje.pacientes ?? "[]");

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">

      {/* BACK + HEADER */}
      <div className="flex flex-col gap-6 border-b border-nd-border-visible pb-6">
        <button
          onClick={() => router.back()}
          className="font-mono text-xs text-text-secondary uppercase tracking-widest hover:text-text-primary transition-colors flex items-center gap-2 self-start"
        >
          <ArrowLeft size={14} />
          HISTORIAL
        </button>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex flex-col gap-2 min-w-0">
            <span className="font-mono text-xs text-text-disabled uppercase tracking-widest">{viaje.fecha}</span>
            <div className="flex flex-col gap-1">
              <p className="text-text-primary text-base leading-snug">{viaje.origen}</p>
              <p className="font-mono text-sm text-text-secondary">➝ {viaje.destino}</p>
            </div>
          </div>
          <div className="flex gap-8 shrink-0">
            {viaje.km != null && (
              <div className="text-right">
                <div className="font-doto text-text-display text-4xl leading-none">{viaje.km}</div>
                <div className="font-mono text-xs text-text-secondary uppercase tracking-widest mt-1">KM</div>
              </div>
            )}
            {viaje.tiempo_estimado_minutos != null && (
              <div className="text-right">
                <div className="font-doto text-text-display text-4xl leading-none">
                  {formatTiempo(viaje.tiempo_estimado_minutos)}
                </div>
                <div className="font-mono text-xs text-text-secondary uppercase tracking-widest mt-1">TIEMPO</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MAPA */}
      {hasCoords ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 font-mono text-xs text-text-secondary uppercase tracking-widest">
            <Route size={14} />
            RUTA
          </div>
          <div className="w-full h-[400px] md:h-[500px] border border-nd-border-visible overflow-hidden">
            <RouteMap
              origenLat={viaje.origen_lat!}
              origenLon={viaje.origen_lon!}
              destinoLat={viaje.destino_lat!}
              destinoLon={viaje.destino_lon!}
              origenNombre={viaje.origen}
              destinoNombre={viaje.destino}
            />
          </div>
          <div className="flex items-center gap-6 font-mono text-xs text-text-disabled">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-success" />
              ORIGEN
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-accent" />
              DESTINO
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-5 h-[3px] bg-interactive opacity-80" />
              RUTA
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 border border-nd-border-visible border-dashed">
          <MapPin size={16} className="text-text-disabled" />
          <span className="font-mono text-xs text-text-disabled uppercase tracking-widest">
            Sin coordenadas — mapa no disponible para este registro
          </span>
        </div>
      )}

      {/* METADATA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-nd-border-visible pt-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 font-mono text-xs text-text-secondary uppercase tracking-widest mb-1">
            <Truck size={13} /> Ambulancia
          </div>
          <span className="text-text-primary">{viaje.ambulancia}</span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 font-mono text-xs text-text-secondary uppercase tracking-widest mb-1">
            <Users size={13} /> Tripulación
          </div>
          {tripulacion.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tripulacion.map(t => (
                <span key={t} className="font-mono text-sm text-text-primary border border-nd-border-visible rounded-full px-3 py-0.5">
                  {t}
                </span>
              ))}
            </div>
          ) : (
            <span className="font-mono text-sm text-text-disabled">—</span>
          )}
        </div>

        {pacientes.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 font-mono text-xs text-text-secondary uppercase tracking-widest mb-1">
              <User size={13} /> Pacientes
            </div>
            <div className="flex flex-wrap gap-2">
              {pacientes.map(p => (
                <span key={p} className="font-mono text-sm text-text-primary border border-nd-border-visible rounded-full px-3 py-0.5">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {viaje.notas && (
          <div className="flex flex-col gap-1 sm:col-span-2">
            <div className="flex items-center gap-2 font-mono text-xs text-text-secondary uppercase tracking-widest mb-1">
              <FileText size={13} /> Notas
            </div>
            <p className="text-text-primary text-sm leading-relaxed">{viaje.notas}</p>
          </div>
        )}
      </div>

    </div>
  );
}
