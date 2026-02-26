'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface NurseryPin {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
}

const PIN_HTML =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32">' +
  '<path fill="#2d6a4f" d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20S24 21 24 12 18.6 0 12 0z"/>' +
  '<circle fill="white" cx="12" cy="11" r="4"/>' +
  '</svg>';

const greenPin = L.divIcon({
  html: PIN_HTML,
  className: '',
  iconSize: [24, 32],
  iconAnchor: [12, 32],
  popupAnchor: [0, -34],
});

function FitBounds({ nurseries }: { nurseries: NurseryPin[] }) {
  const map = useMap();
  useEffect(() => {
    if (nurseries.length === 0) return;
    if (nurseries.length === 1) {
      map.setView([nurseries[0].latitude, nurseries[0].longitude], 10);
      return;
    }
    const bounds = L.latLngBounds(
      nurseries.map((n): [number, number] => [n.latitude, n.longitude])
    );
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, nurseries]);
  return null;
}

export function NurseryMapClient({
  nurseries,
  height = '300px',
}: {
  nurseries: NurseryPin[];
  height?: string;
}) {
  if (nurseries.length === 0) return null;

  const center: [number, number] = [nurseries[0].latitude, nurseries[0].longitude];

  return (
    <MapContainer
      center={center}
      zoom={6}
      style={{ height, width: '100%', borderRadius: 'var(--radius-lg)' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds nurseries={nurseries} />
      {nurseries.map((n) => (
        <Marker key={n.id} position={[n.latitude, n.longitude]} icon={greenPin}>
          <Popup>
            <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>{n.name}</div>
              <a href={`/nurseries/${n.slug}`} style={{ color: '#2d6a4f' }}>
                View nursery →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
