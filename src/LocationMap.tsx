import { useEffect, useMemo, useRef, useState } from "react";
import {
  AttributionControl,
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { divIcon, type LatLngBounds, type Marker as LeafletMarker } from "leaflet";
import { LocateFixed, MapPin, Search, X } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "./LocationMap.css";

export type MapPoint = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  city?: string;
  district?: string;
  meta?: string;
};

type Props = {
  points: MapPoint[];
  selectedId: string;
  onSelect: (point: MapPoint) => void;
  onValidityChange?: (valid: boolean) => void;
  title?: string;
};

const radians = (value: number) => (value * Math.PI) / 180;
const distanceKm = (from: [number, number], point: MapPoint) => {
  const earth = 6371;
  const lat = radians(point.lat - from[0]);
  const lng = radians(point.lng - from[1]);
  const a = Math.sin(lat / 2) ** 2 + Math.cos(radians(from[0])) * Math.cos(radians(point.lat)) * Math.sin(lng / 2) ** 2;
  return earth * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const markerIcon = (active: boolean) => divIcon({
  className: "eh-map-marker-wrap",
  html: `<span class="eh-map-marker ${active ? "active" : ""}"><i></i></span>`,
  iconSize: [34, 42],
  iconAnchor: [17, 40],
});

const clusterIcon = (count: number) => divIcon({
  className: "eh-map-cluster-wrap",
  html: `<span class="eh-map-cluster"><b>${count}</b><i>точек</i></span>`,
  iconSize: [54, 54],
  iconAnchor: [27, 27],
});

function MapState({ onChange }: { onChange: (zoom: number, bounds: LatLngBounds) => void }) {
  const timer = useRef<number | null>(null);
  const report = (map: ReturnType<typeof useMap>) => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (map.getContainer().isConnected) onChange(map.getZoom(), map.getBounds());
    }, 0);
  };
  const map = useMapEvents({
    moveend: () => report(map),
    zoomend: () => report(map),
  });
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);
  return null;
}

function FitPoints({ points, token }: { points: MapPoint[]; token: string }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) map.setView([points[0].lat, points[0].lng], 15, { animate: false });
    else map.fitBounds(points.map((point) => [point.lat, point.lng] as [number, number]), { padding: [28, 28], maxZoom: 14, animate: false });
  }, [map, points, token]);
  return null;
}

function FocusPoint({ point, token }: { point?: MapPoint; token: number }) {
  const map = useMap();
  const initial = useRef(true);
  useEffect(() => {
    if (initial.current) { initial.current = false; return; }
    if (point && token > 0) map.setView([point.lat, point.lng], Math.max(map.getZoom(), 15), { animate: false });
  }, [map, point, token]);
  return null;
}

function MarkerLayer({ points, selectedId, zoom, bounds, onSelect }: {
  points: MapPoint[]; selectedId: string; zoom: number; bounds: LatLngBounds | null; onSelect: (point: MapPoint) => void;
}) {
  const map = useMap();
  const markers = useRef(new Map<string, LeafletMarker>());
  useEffect(() => {
    map.closePopup();
    markers.current.get(selectedId)?.openPopup();
  }, [map, selectedId, zoom, points.length]);
  const displayed = bounds ? points.filter((point) => bounds.pad(0.15).contains([point.lat, point.lng])) : points;
  const cell = zoom <= 5 ? 5 : zoom <= 7 ? 1.5 : zoom <= 9 ? 0.42 : zoom <= 11 ? 0.13 : zoom <= 13 ? 0.045 : 0;
  if (!cell) return <>{displayed.slice(0, 120).map((point) => <Marker key={point.id} ref={(node) => { if (node) markers.current.set(point.id, node); else markers.current.delete(point.id); }} title={`${point.name}, ${point.address}`} position={[point.lat, point.lng]} icon={markerIcon(point.id === selectedId)} eventHandlers={{ click: () => onSelect(point) }}><Popup><b>{point.name}</b><br />{point.address}</Popup></Marker>)}</>;

  const groups = new Map<string, MapPoint[]>();
  displayed.forEach((point) => {
    const key = `${Math.floor(point.lat / cell)}:${Math.floor(point.lng / cell)}`;
    groups.set(key, [...(groups.get(key) ?? []), point]);
  });
  return <>{[...groups.values()].map((group) => {
    if (group.length === 1) {
      const point = group[0];
      return <Marker key={point.id} ref={(node) => { if (node) markers.current.set(point.id, node); else markers.current.delete(point.id); }} title={`${point.name}, ${point.address}`} position={[point.lat, point.lng]} icon={markerIcon(point.id === selectedId)} eventHandlers={{ click: () => onSelect(point) }}><Popup><b>{point.name}</b><br />{point.address}</Popup></Marker>;
    }
    const center: [number, number] = [group.reduce((sum, point) => sum + point.lat, 0) / group.length, group.reduce((sum, point) => sum + point.lng, 0) / group.length];
    return <Marker key={group.map((point) => point.id).join("-")} title={`Группа из ${group.length} точек. Увеличить карту`} position={center} icon={clusterIcon(group.length)} eventHandlers={{ click: () => map.setView(center, Math.min(zoom + 2, 15), { animate: false }) }} />;
  })}</>;
}

export function LocationMap({ points, selectedId, onSelect, onValidityChange, title = "Выберите точку" }: Props) {
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [geoStatus, setGeoStatus] = useState("");
  const [viewport, setViewport] = useState<{ zoom: number; bounds: LatLngBounds | null }>({ zoom: 6, bounds: null });
  const [focusToken, setFocusToken] = useState(0);
  const [listLimit, setListLimit] = useState(60);
  const normalized = query.trim().toLocaleLowerCase("ru");

  const visible = useMemo(() => {
    const filtered = normalized ? points.filter((point) => [point.name, point.address, point.city, point.district, point.meta].filter(Boolean).some((value) => value!.toLocaleLowerCase("ru").includes(normalized))) : points;
    return position ? [...filtered].sort((a, b) => distanceKm(position, a) - distanceKm(position, b)) : filtered;
  }, [normalized, points, position]);
  const selected = points.find((point) => point.id === selectedId);
  const valid = Boolean(selected && visible.some((point) => point.id === selected.id));
  const listed = visible.slice(0, listLimit);
  const selectedOutsidePage = selected && valid && !listed.some((point) => point.id === selected.id) ? selected : null;

  useEffect(() => onValidityChange?.(valid), [onValidityChange, valid]);
  useEffect(() => { if (selectedId) document.querySelector<HTMLElement>(`[data-store-id="${selectedId}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [selectedId]);

  const select = (point: MapPoint) => { onSelect(point); setFocusToken((value) => value + 1); };
  const locate = () => {
    if (!navigator.geolocation) { setGeoStatus("Геолокация недоступна в этом браузере"); return; }
    setGeoStatus("Определяем положение…");
    navigator.geolocation.getCurrentPosition(({ coords }) => { setPosition([coords.latitude, coords.longitude]); setGeoStatus("Список отсортирован по расстоянию"); }, () => setGeoStatus("Не удалось получить геолокацию"), { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
  };

  if (!points.length) return null;
  return <section className="eh-location-picker" aria-label={title}>
    <div className="eh-location-heading"><div><span>Точки на карте</span><h2>{title}</h2></div><button type="button" className="eh-locate" onClick={locate}><LocateFixed size={17} /> Рядом со мной</button></div>
    <label className="eh-location-search"><Search size={18} /><input value={query} onChange={(event) => { setQuery(event.target.value); setListLimit(60); }} placeholder="Адрес, район или название" aria-label="Поиск точки" />{query && <button type="button" aria-label="Очистить поиск" onClick={() => { setQuery(""); setListLimit(60); }}><X /></button>}</label>
    <div className="eh-search-result" role="status">Найдено: <b>{visible.length}</b>{visible.length > listed.length && <span> · показано {listed.length}</span>}</div>
    {geoStatus && <p className="eh-geo-status" role="status">{geoStatus}</p>}
    <div className="eh-map-shell"><MapContainer center={[selected?.lat ?? points[0].lat, selected?.lng ?? points[0].lng]} zoom={6} scrollWheelZoom={false} zoomAnimation={false} fadeAnimation={false} markerZoomAnimation={false} attributionControl={false} className="eh-map">
      <TileLayer attribution="© OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><AttributionControl prefix={false} />
      <MapState onChange={(zoom, bounds) => setViewport({ zoom, bounds })} /><FitPoints points={visible} token={`${normalized}:${points.length}`} /><FocusPoint point={selected} token={focusToken} />
      {position && <CircleMarker center={position} radius={8} pathOptions={{ color: "#ffffff", fillColor: "#2563eb", fillOpacity: 1, weight: 3 }}><Popup>Ваше положение</Popup></CircleMarker>}
      <MarkerLayer points={visible} selectedId={selectedId} zoom={viewport.zoom} bounds={viewport.bounds} onSelect={select} />
    </MapContainer></div>
    <div className="eh-location-list">{listed.length ? [...(selectedOutsidePage ? [selectedOutsidePage] : []), ...listed].map((point) => {
      const distance = position ? distanceKm(position, point) : null;
      return <button type="button" key={point.id} data-store-id={point.id} className={point.id === selectedId ? "active" : ""} onClick={() => select(point)}><span className="eh-location-index"><MapPin size={16} /></span><span><b>{point.name}</b><small>{point.address}</small>{point.meta && <em>{point.meta}</em>}</span>{distance !== null && <strong>{distance < 1 ? `${Math.round(distance * 1000)} м` : `${distance.toFixed(1)} км`}</strong>}</button>;
    }) : <div className="eh-location-empty"><Search /><b>Ничего не найдено</b><span>Измените запрос или очистите поиск.</span></div>}{visible.length > listed.length && <button type="button" className="eh-show-more" onClick={() => setListLimit((limit) => limit + 60)}>Показать ещё {Math.min(60, visible.length - listed.length)} точек</button>}</div>
    <p className="eh-location-note">Метки объединяются в кластеры. Расстояния рассчитываются только после разрешения геолокации.</p>
  </section>;
}
