"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Search, MapPin, Navigation, Plus, X, Save, AlertTriangle } from "lucide-react";

import type { LugarFrecuente } from "@/lib/db";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export default function NuevoViaje() {
  const router = useRouter();
  
  // Form state
  const [fecha, setFecha] = useState(format(new Date(), "yyyy-MM-dd"));
  const [ambulancia, setAmbulancia] = useState("");
  const [tripulacion, setTripulacion] = useState<string[]>([]);
  const [nuevoTripulante, setNuevoTripulante] = useState("");
  
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [notas, setNotas] = useState("");

  // Calculation state
  const [isCalculating, setIsCalculating] = useState(false);
  const [origenResults, setOrigenResults] = useState<NominatimResult[]>([]);
  const [destinoResults, setDestinoResults] = useState<NominatimResult[]>([]);
  const [selectedOrigen, setSelectedOrigen] = useState<NominatimResult | null>(null);
  const [selectedDestino, setSelectedDestino] = useState<NominatimResult | null>(null);
  
  const [km, setKm] = useState<string>("");
  const [tiempo, setTiempo] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Datalist data (mocked for now, could be fetched from API)
  const [recentAmbulancias, setRecentAmbulancias] = useState<string[]>([]);
  const [recentTripulantes, setRecentTripulantes] = useState<string[]>([]);
  const [lugaresFrecuentes, setLugaresFrecuentes] = useState<LugarFrecuente[]>([]);

  useEffect(() => {
    // Fetch unique recent data for datalists
    fetch("/api/viajes?limit=50")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const ambs = new Set<string>();
          const trips = new Set<string>();
          data.forEach(v => {
            if (v.ambulancia) ambs.add(v.ambulancia);
            if (v.tripulacion) {
              try {
                const arr = JSON.parse(v.tripulacion);
                arr.forEach((t: string) => trips.add(t));
              } catch (e) {}
            }
          });
          setRecentAmbulancias(Array.from(ambs).slice(0, 10));
          setRecentTripulantes(Array.from(trips).slice(0, 20));
        }
      })
      .catch(console.error);

    // Fetch lugares frecuentes
    fetch("/api/lugares")
      .then(res => res.json())
      .then(data => setLugaresFrecuentes(data))
      .catch(console.error);
  }, []);

  const addTripulante = () => {
    if (nuevoTripulante.trim() && !tripulacion.includes(nuevoTripulante.trim())) {
      setTripulacion([...tripulacion, nuevoTripulante.trim()]);
      setNuevoTripulante("");
    }
  };

  const removeTripulante = (name: string) => {
    setTripulacion(tripulacion.filter(t => t !== name));
  };

  const geocode = async (query: string): Promise<NominatimResult[]> => {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.append("q", query);
    url.searchParams.append("countrycodes", "ar");
    url.searchParams.append("limit", "5");
    url.searchParams.append("format", "json");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "RegistroAmbulancia/1.0" }
    });
    
    if (!res.ok) throw new Error("Error en geocodificación");
    return res.json();
  };

  // Búsqueda automática con debounce para Origen
  useEffect(() => {
    if (!origen || selectedOrigen || origen.length < 4) {
      setOrigenResults([]);
      return;
    }
    const timer = setTimeout(() => {
      geocode(origen).then(setOrigenResults).catch(console.error);
    }, 600);
    return () => clearTimeout(timer);
  }, [origen, selectedOrigen]);

  // Búsqueda automática con debounce para Destino
  useEffect(() => {
    if (!destino || selectedDestino || destino.length < 4) {
      setDestinoResults([]);
      return;
    }
    const timer = setTimeout(() => {
      geocode(destino).then(setDestinoResults).catch(console.error);
    }, 600);
    return () => clearTimeout(timer);
  }, [destino, selectedDestino]);

  const calculateRoute = async () => {
    try {
      setError(null);
      setIsCalculating(true);
      
      // Step 1: Geocode if not selected yet
      let orig = selectedOrigen;
      let dest = selectedDestino;

      if (!orig) {
        const results = await geocode(origen);
        if (results.length === 0) throw new Error("No se encontró el origen");
        if (results.length === 1) {
          orig = results[0];
          setSelectedOrigen(orig);
        } else {
          setOrigenResults(results);
          setIsCalculating(false);
          return; // Wait for user selection
        }
      }

      if (!dest) {
        const results = await geocode(destino);
        if (results.length === 0) throw new Error("No se encontró el destino");
        if (results.length === 1) {
          dest = results[0];
          setSelectedDestino(dest);
        } else {
          setDestinoResults(results);
          setIsCalculating(false);
          return; // Wait for user selection
        }
      }

      // Step 2: Calculate with OSRM
      if (orig && dest) {
        const url = `http://router.project-osrm.org/route/v1/driving/${orig.lon},${orig.lat};${dest.lon},${dest.lat}?overview=false`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Error al calcular ruta en OSRM");
        
        const data = await res.json();
        if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
          throw new Error("OSRM no pudo encontrar una ruta");
        }

        const route = data.routes[0];
        const kmCalc = (route.distance / 1000).toFixed(1);
        const minsCalc = Math.round(route.duration / 60).toString();

        setKm(kmCalc);
        setTiempo(minsCalc);
      }
    } catch (err: any) {
      setError(err.message || "Error al calcular la ruta");
    } finally {
      setIsCalculating(false);
    }
  };

  const saveViaje = async () => {
    if (!origen || !destino || !ambulancia || tripulacion.length === 0 || !km || !tiempo) {
      setError("Completar todos los campos obligatorios");
      return;
    }

    try {
      const payload = {
        fecha,
        ambulancia,
        tripulacion,
        origen: selectedOrigen ? selectedOrigen.display_name : origen,
        destino: selectedDestino ? selectedDestino.display_name : destino,
        origen_lat: selectedOrigen ? parseFloat(selectedOrigen.lat) : null,
        origen_lon: selectedOrigen ? parseFloat(selectedOrigen.lon) : null,
        destino_lat: selectedDestino ? parseFloat(selectedDestino.lat) : null,
        destino_lon: selectedDestino ? parseFloat(selectedDestino.lon) : null,
        km: parseFloat(km),
        tiempo_estimado_minutos: parseInt(tiempo),
        notas
      };

      const res = await fetch("/api/viajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error al guardar");
      
      router.push("/historial");
    } catch (err: any) {
      setError(err.message || "Error al guardar el viaje");
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="font-doto text-text-display text-4xl mb-2">NUEVO VIAJE</h1>
        <p className="font-mono text-text-secondary text-sm uppercase tracking-widest">
          / REGISTRO DE OPERACIÓN
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

      <div className="flex flex-col gap-8">
        {/* ROW 1: Fecha & Ambulancia */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-label text-text-secondary uppercase">Fecha</label>
            <input 
              type="date" 
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="bg-transparent border-b border-nd-border-visible py-2 text-text-primary focus:border-text-primary outline-none font-mono"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-mono text-label text-text-secondary uppercase">Ambulancia</label>
            <input 
              type="text" 
              list="ambulancias-list"
              value={ambulancia}
              onChange={e => setAmbulancia(e.target.value)}
              placeholder="Ej: Unidad 3"
              className="bg-transparent border-b border-nd-border-visible py-2 text-text-primary focus:border-text-primary outline-none font-mono"
            />
            <datalist id="ambulancias-list">
              {recentAmbulancias.map(a => <option key={a} value={a} />)}
            </datalist>
          </div>
        </div>

        {/* TRIPULACION */}
        <div className="flex flex-col gap-4">
          <label className="font-mono text-label text-text-secondary uppercase">Tripulación</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              list="tripulantes-list"
              value={nuevoTripulante}
              onChange={e => setNuevoTripulante(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTripulante())}
              placeholder="Nombre del tripulante..."
              className="flex-1 bg-transparent border-b border-nd-border-visible py-2 text-text-primary focus:border-text-primary outline-none font-mono"
            />
            <button 
              onClick={addTripulante}
              type="button"
              className="px-4 border border-nd-border-visible hover:border-text-primary transition-colors flex items-center justify-center text-text-secondary hover:text-text-primary"
            >
              <Plus size={20} />
            </button>
          </div>
          <datalist id="tripulantes-list">
            {recentTripulantes.map(t => <option key={t} value={t} />)}
          </datalist>

          <div className="flex flex-wrap gap-2 mt-2">
            {tripulacion.map(t => (
              <div key={t} className="flex items-center gap-2 border border-nd-border-visible rounded-full px-3 py-1 text-sm font-mono text-text-primary">
                {t}
                <button onClick={() => removeTripulante(t)} className="text-text-disabled hover:text-accent transition-colors">
                  <X size={14} />
                </button>
              </div>
            ))}
            {tripulacion.length === 0 && (
              <span className="font-mono text-text-disabled text-sm">-- Ninguno agregado --</span>
            )}
          </div>
        </div>

        <div className="h-px bg-nd-border w-full my-2"></div>

        {/* RUTA */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-2">
            <Navigation className="text-text-secondary" size={20} />
            <h2 className="font-mono text-text-primary tracking-widest uppercase">Hoja de Ruta</h2>
          </div>

          <div className="flex flex-col gap-2 relative">
            <label className="font-mono text-label text-text-secondary uppercase">Origen</label>
            <input 
              type="text" 
              value={origen}
              onChange={e => {
                setOrigen(e.target.value);
                setSelectedOrigen(null);
                setOrigenResults([]);
              }}
              placeholder="Dirección o lugar..."
              className="bg-transparent border-b border-nd-border-visible py-2 text-text-primary focus:border-text-primary outline-none font-mono"
            />
            
            {/* Quick Select Lugares */}
            {lugaresFrecuentes.length > 0 && !origen && (
              <div className="flex flex-wrap gap-2 mt-2">
                {lugaresFrecuentes.map(l => (
                  <button
                    key={l.id}
                    onClick={() => {
                      setOrigen(l.direccion_completa);
                      setSelectedOrigen({
                        place_id: l.id || 0,
                        display_name: l.direccion_completa,
                        lat: l.lat.toString(),
                        lon: l.lon.toString()
                      });
                    }}
                    className="font-mono text-xs uppercase text-text-secondary border border-nd-border-visible px-3 py-1 rounded-full hover:text-text-primary hover:border-text-primary transition-colors"
                  >
                    {l.alias}
                  </button>
                ))}
              </div>
            )}

            {origenResults.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-1 bg-surface border border-nd-border-visible z-10 p-2 flex flex-col gap-1 shadow-lg max-h-60 overflow-y-auto">
                <span className="font-mono text-label text-accent uppercase mb-1">Resultados:</span>
                {origenResults.map(res => (
                  <button 
                    key={res.place_id} 
                    onClick={() => {
                      setSelectedOrigen(res);
                      setOrigen(res.display_name); // Keep full address
                      setOrigenResults([]);
                    }}
                    className="text-left font-mono text-sm text-text-secondary hover:text-text-primary hover:bg-surface-raised p-2 transition-colors truncate"
                  >
                    {res.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 relative">
            <label className="font-mono text-label text-text-secondary uppercase">Destino</label>
            <input 
              type="text" 
              value={destino}
              onChange={e => {
                setDestino(e.target.value);
                setSelectedDestino(null);
                setDestinoResults([]);
              }}
              placeholder="Dirección o lugar..."
              className="bg-transparent border-b border-nd-border-visible py-2 text-text-primary focus:border-text-primary outline-none font-mono"
            />

            {/* Quick Select Lugares */}
            {lugaresFrecuentes.length > 0 && !destino && (
              <div className="flex flex-wrap gap-2 mt-2">
                {lugaresFrecuentes.map(l => (
                  <button
                    key={l.id}
                    onClick={() => {
                      setDestino(l.direccion_completa);
                      setSelectedDestino({
                        place_id: l.id || 0,
                        display_name: l.direccion_completa,
                        lat: l.lat.toString(),
                        lon: l.lon.toString()
                      });
                    }}
                    className="font-mono text-xs uppercase text-text-secondary border border-nd-border-visible px-3 py-1 rounded-full hover:text-text-primary hover:border-text-primary transition-colors"
                  >
                    {l.alias}
                  </button>
                ))}
              </div>
            )}

            {destinoResults.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-1 bg-surface border border-nd-border-visible z-10 p-2 flex flex-col gap-1 shadow-lg max-h-60 overflow-y-auto">
                <span className="font-mono text-label text-accent uppercase mb-1">Resultados:</span>
                {destinoResults.map(res => (
                  <button 
                    key={res.place_id} 
                    onClick={() => {
                      setSelectedDestino(res);
                      setDestino(res.display_name); // Keep full address
                      setDestinoResults([]);
                    }}
                    className="text-left font-mono text-sm text-text-secondary hover:text-text-primary hover:bg-surface-raised p-2 transition-colors truncate"
                  >
                    {res.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={calculateRoute}
            disabled={isCalculating || !origen || !destino}
            className="self-start mt-2 border border-nd-border-visible text-text-primary font-mono text-sm uppercase tracking-widest px-6 py-3 hover:bg-text-display hover:text-background transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-text-primary flex items-center gap-2 rounded-full"
          >
            <Search size={16} />
            {isCalculating ? "[ CALCULANDO... ]" : "[ CALCULAR DISTANCIA ]"}
          </button>
        </div>

        {/* RESULTS */}
        <div className="grid grid-cols-2 gap-6 bg-surface-raised p-6 border border-nd-border-visible mt-2">
          <div className="flex flex-col gap-1">
            <label className="font-mono text-label text-text-secondary uppercase">Kilómetros</label>
            <div className="flex items-baseline gap-2">
              <input 
                type="number" 
                step="0.1"
                value={km}
                onChange={e => setKm(e.target.value)}
                className="bg-transparent font-doto text-text-display text-3xl outline-none w-24 border-b border-transparent focus:border-nd-border-visible"
                placeholder="0.0"
              />
              <span className="font-mono text-label text-text-secondary">KM</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-label text-text-secondary uppercase">Tiempo Est.</label>
            <div className="flex items-baseline gap-2">
              <input 
                type="number" 
                value={tiempo}
                onChange={e => setTiempo(e.target.value)}
                className="bg-transparent font-doto text-text-display text-3xl outline-none w-24 border-b border-transparent focus:border-nd-border-visible"
                placeholder="0"
              />
              <span className="font-mono text-label text-text-secondary">MIN</span>
            </div>
          </div>
        </div>

        {/* NOTAS */}
        <div className="flex flex-col gap-2 mt-4">
          <label className="font-mono text-label text-text-secondary uppercase">Notas (Opcional)</label>
          <input 
            type="text" 
            value={notas}
            onChange={e => setNotas(e.target.value)}
            className="bg-transparent border-b border-nd-border-visible py-2 text-text-primary focus:border-text-primary outline-none font-mono"
            placeholder="Observaciones del viaje..."
          />
        </div>

        {/* SUBMIT */}
        <button 
          onClick={saveViaje}
          className="mt-8 bg-text-display text-background font-mono text-sm uppercase tracking-widest px-8 py-4 hover:opacity-90 transition-opacity flex items-center justify-center gap-3 rounded-full w-full"
        >
          <Save size={18} />
          GUARDAR VIAJE
        </button>

      </div>
    </div>
  );
}
