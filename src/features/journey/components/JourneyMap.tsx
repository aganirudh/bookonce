/**
 * Journey Map Component
 * 
 * Interactive map using Leaflet and OpenStreetMap (completely free!)
 * Shows origin, destination, and route between them
 */

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export interface Location {
  lat: number;
  lng: number;
  name: string;
}

export interface RouteStep {
  lat: number;
  lng: number;
  instruction?: string;
  distance?: number;
  duration?: number;
}

interface JourneyMapProps {
  origin: Location;
  destination: Location;
  route?: RouteStep[];
  className?: string;
  height?: string;
}

export function JourneyMap({
  origin,
  destination,
  route,
  className = '',
  height = '500px',
}: JourneyMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(
        [origin.lat, origin.lng],
        10
      );

      // Add OpenStreetMap tiles (free!)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Clear existing markers and routes
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    // Create custom icons
    const originIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background: #10b981;
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="
            transform: rotate(45deg);
            color: white;
            font-weight: bold;
            font-size: 16px;
          ">A</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    const destinationIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background: #ef4444;
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="
            transform: rotate(45deg);
            color: white;
            font-weight: bold;
            font-size: 16px;
          ">B</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    // Add origin marker
    const originMarker = L.marker([origin.lat, origin.lng], {
      icon: originIcon,
    }).addTo(map);

    originMarker.bindPopup(`
      <div style="padding: 8px;">
        <strong style="color: #10b981;">Origin</strong><br/>
        ${origin.name}
      </div>
    `);

    // Add destination marker
    const destinationMarker = L.marker([destination.lat, destination.lng], {
      icon: destinationIcon,
    }).addTo(map);

    destinationMarker.bindPopup(`
      <div style="padding: 8px;">
        <strong style="color: #ef4444;">Destination</strong><br/>
        ${destination.name}
      </div>
    `);

    // Draw route if available
    if (route && route.length > 0) {
      const routeCoordinates: [number, number][] = route.map((step) => [
        step.lat,
        step.lng,
      ]);

      // Draw route line
      const routeLine = L.polyline(routeCoordinates, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.7,
        smoothFactor: 1,
      }).addTo(map);

      // Add route steps as small markers
      route.forEach((step, index) => {
        if (step.instruction) {
          const stepMarker = L.circleMarker([step.lat, step.lng], {
            radius: 6,
            fillColor: '#3b82f6',
            color: 'white',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
          }).addTo(map);

          stepMarker.bindPopup(`
            <div style="padding: 8px; max-width: 200px;">
              <strong>Step ${index + 1}</strong><br/>
              ${step.instruction}<br/>
              ${step.distance ? `<small>${(step.distance / 1000).toFixed(1)} km</small>` : ''}
              ${step.duration ? `<small> • ${Math.round(step.duration / 60)} min</small>` : ''}
            </div>
          `);
        }
      });

      // Fit map to show entire route
      map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
    } else {
      // No route - just fit to show both markers
      const bounds = L.latLngBounds([
        [origin.lat, origin.lng],
        [destination.lat, destination.lng],
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [origin, destination, route]);

  return (
    <div
      ref={mapContainerRef}
      className={`rounded-lg overflow-hidden border border-gray-200 shadow-sm ${className}`}
      style={{ height, width: '100%' }}
    />
  );
}

export default JourneyMap;
