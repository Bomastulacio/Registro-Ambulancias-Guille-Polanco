"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Trash2, Plus, AlertTriangle } from "lucide-react";
import type { LugarFrecuente } from "@/lib/db";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export default function Lugares() {
  const [lugares, setLugares] = useState<LugarFrecuente[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Lugar State
  const [alias, setAlias] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<NominatimResult | null>(null);
  
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLugares = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/lugares");
      const data = await res.json();
      setLugares(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLugares();
  }, []);

  const searchLocation = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    setError(null);
    setSelectedLocation(null);

    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.append("q", searchQuery);
      url.searchParams.append("countrycodes", "ar");
      url.searchParams.append("limit", "5");
      url.searchParams.append("format", "json");

      const res = await fetch(url.toString(), {
        headers: { "User-Agent": "RegistroAmbulancia/1.0" }
      });
      
      if (!res.ok) throw new Error("Error en geocodificación");
      const data = await res.json();
      
      if (data.length === 0) {
        setError("No se encontraron resultados");
      } else {
        setSearchResults(data);
      }
    } catch (err: any) {
      setError(err.message || "Error al buscar");
    } finally {
      setIsSearching(false);
    }
  };

  const saveLugar = async () => {
    if (!alias || !selectedLocation) {
      setError("Completar alias y seleccionar una ubicación");
      return;
    }

    try {
      const res = await fetch("/api/lugares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alias,
          direccion_completa: selectedLocation.display_name,
          lat: parseFloat(selectedLocation.lat),
          lon: parseFloat(selectedLocation.lon)
        }),
      });

      if (!res.ok) throw new Error("Error al guardar");
      
      setAlias("");
      setSearchQuery("");
      setSelectedLocation(null);
      setSearchResults([]);
      fetchLugares();
    } catch (err: any) {
      setError(err.message || "Error al guardar el lugar");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este lugar frecuente?")) return;
    try {
      const res = await fetch(`/api/lugares/${id}`, { method: "DELETE" });
      if (res.ok) {
        setLugares(lugares.filter(l => l.id !== id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col gap-12">
      <div>
        <h1 className="font-doto text-text-display text-4xl mb-2">LUGARES FRECUENTES</h1>
        <p className="font-mono text-text-secondary text-sm uppercase tracking-widest">
          / GESTIÓN DE DESTINOS RÁPIDOS
        </p>
      </div>

      {error && (
        <div className="border border-accent p-4 flex items-start gap-3">
          <AlertTriangle className="text-accent shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-mono text-accent text-sm uppercase">[ ERROR ]</p>
            <p className="text-text-primary text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* NUEVO LUGAR FORM */}
      <div className="bg-surface-raised border border-nd-border-visible p-6 flex flex-col gap-6">
        <h2 className="font-mono text-text-primary uppercase tracking-widest border-b border-nd-border-visible pb-2 flex items-center gap-2">
          <Plus size={18} />
          Nuevo Lugar
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-label text-text-secondary uppercase">Alias (Nombre Corto)</label>
            <input 
              type="text" 
              value={alias}
              onChange={e => setAlias(e.target.value)}
              placeholder="Ej: Base Principal, Hospital Norte..."
              className="bg-transparent border-b border-nd-border-visible py-2 text-text-primary focus:border-text-primary outline-none font-mono"
            />
          </div>

          <div className="flex flex-col gap-2 relative">
            <label className="font-mono text-label text-text-secondary uppercase">Dirección a buscar</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setSelectedLocation(null);
                  setSearchResults([]);
                }}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), searchLocation())}
                placeholder="Calle y número, Ciudad..."
                className="flex-1 bg-transparent border-b border-nd-border-visible py-2 text-text-primary focus:border-text-primary outline-none font-mono"
              />
              <button 
                onClick={searchLocation}
                disabled={isSearching || !searchQuery}
                className="px-4 border border-nd-border-visible text-text-primary hover:bg-surface transition-colors disabled:opacity-50"
              >
                <Search size={18} />
              </button>
            </div>

            {searchResults.length > 0 && !selectedLocation && (
              <div className="absolute top-full left-0 w-full mt-1 bg-surface border border-nd-border-visible z-10 p-2 flex flex-col gap-1 max-h-60 overflow-y-auto">
                {searchResults.map(res => (
                  <button 
                    key={res.place_id} 
                    onClick={() => {
                      setSelectedLocation(res);
                      setSearchQuery(res.display_name.split(',')[0]); 
                      setSearchResults([]);
                    }}
                    className="text-left font-mono text-sm text-text-secondary hover:text-text-primary hover:bg-surface-raised p-2 transition-colors border-b border-nd-border-visible/50 last:border-0"
                  >
                    {res.display_name}
                  </button>
                ))}
              </div>
            )}

            {selectedLocation && (
              <div className="mt-2 text-xs font-mono text-success flex items-start gap-1">
                <MapPin size={14} className="shrink-0 mt-0.5" />
                <span>Coordenadas fijadas: {parseFloat(selectedLocation.lat).toFixed(4)}, {parseFloat(selectedLocation.lon).toFixed(4)}</span>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={saveLugar}
          disabled={!alias || !selectedLocation}
          className="self-start mt-2 bg-text-display text-background font-mono text-sm uppercase tracking-widest px-8 py-3 hover:opacity-90 transition-opacity disabled:opacity-50 rounded-full"
        >
          Guardar Lugar
        </button>
      </div>

      {/* LISTA DE LUGARES */}
      <div className="flex flex-col gap-4">
        <h2 className="font-mono text-text-primary tracking-widest uppercase border-b border-nd-border-visible pb-2 flex items-center gap-2">
          <MapPin size={18} />
          Tus Destinos Frecuentes
        </h2>

        {isLoading ? (
          <div className="py-12 flex justify-center text-text-secondary font-mono tracking-widest uppercase">
            [ CARGANDO... ]
          </div>
        ) : lugares.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center border border-nd-border-visible border-dashed">
            <span className="font-mono text-text-secondary uppercase tracking-widest">[ SIN LUGARES GUARDADOS ]</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lugares.map((lugar) => (
              <div key={lugar.id} className="border border-nd-border-visible p-4 flex justify-between items-start hover:bg-surface-raised transition-colors group">
                <div className="flex flex-col gap-1 pr-4">
                  <span className="font-mono text-text-display text-lg">{lugar.alias}</span>
                  <span className="font-mono text-caption text-text-secondary line-clamp-2" title={lugar.direccion_completa}>
                    {lugar.direccion_completa}
                  </span>
                </div>
                <button 
                  onClick={() => lugar.id && handleDelete(lugar.id)}
                  className="text-text-disabled hover:text-accent transition-colors opacity-0 group-hover:opacity-100 p-2"
                  title="Eliminar lugar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
