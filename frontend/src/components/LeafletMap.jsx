import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import { MapPin, Navigation } from 'lucide-react';

// Fix standard Leaflet default icon paths in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

// Custom styled HTML marker for trip stops
function createNumberedIcon(number, color = '#DC2626') {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, ${color}, #B45309);
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        <span style="transform: rotate(45deg); font-weight: 800; font-size: 13px;">${number}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
}

function MapBoundsUpdater({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [points, map]);
  return null;
}

export default function LeafletMap({ stops = [], className = 'h-72 w-full rounded-2xl overflow-hidden' }) {
  const { t, i18n } = useTranslation();

  // Filter ONLY places with valid non-null coordinates
  const validStops = stops.filter(s => s.lat !== null && s.lng !== null && !isNaN(s.lat) && !isNaN(s.lng));
  const skippedCount = stops.length - validStops.length;

  const positions = validStops.map(s => [s.lat, s.lng]);
  const defaultCenter = positions.length > 0 ? positions[0] : [14.5204, 75.7224]; // Center of Karnataka

  return (
    <div className="relative">
      <div className={className}>
        <MapContainer
          center={defaultCenter}
          zoom={8}
          scrollWheelZoom={false}
          className="h-full w-full z-10"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {validStops.map((stop, idx) => (
            <Marker
              key={`${stop.place_id || idx}-${idx}`}
              position={[stop.lat, stop.lng]}
              icon={createNumberedIcon(idx + 1)}
            >
              <Popup>
                <div className="p-1 max-w-[200px]">
                  <h4 className="font-bold text-sm text-stone-900 leading-tight">
                    {i18n.language === 'kn' ? (stop.name_kn || stop.name) : stop.name}
                  </h4>
                  {i18n.language === 'kn' && (
                    <p className="text-[11px] text-stone-500">{stop.name}</p>
                  )}
                  <p className="text-xs text-amber-700 font-semibold mt-1">
                    {stop.category} • {stop.district}
                  </p>
                  {stop.timings && (
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      {stop.timings}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Route polyline between consecutive valid stops */}
          {positions.length > 1 && (
            <Polyline
              positions={positions}
              color="#DC2626"
              weight={4}
              opacity={0.8}
              dashArray="6, 8"
            />
          )}

          <MapBoundsUpdater points={positions} />
        </MapContainer>
      </div>

      {/* Skips Notice if any place lacks coordinates */}
      {skippedCount > 0 && (
        <div className="mt-2 text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800/80">
          <Navigation className="w-3 h-3 text-amber-600 shrink-0" />
          <span>
            {i18n.language === 'kn'
              ? `${validStops.length} ತಾಣಗಳನ್ನು ನಕ್ಷೆಯಲ್ಲಿ ಗುರುತಿಸಲಾಗಿದೆ (${skippedCount} ತಾಣಗಳ ಅಧಿಕೃತ ಅಕ್ಷಾಂಶ ಲಭ್ಯವಿಲ್ಲದ ಕಾರಣ ಬಿಡಲಾಗಿದೆ)`
              : `${validStops.length} stops mapped (${skippedCount} unmapped due to unconfirmed coordinates)`}
          </span>
        </div>
      )}
    </div>
  );
}
