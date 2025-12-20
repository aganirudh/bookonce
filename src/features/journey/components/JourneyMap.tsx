/**
 * Journey Map Component
 *
 * Interactive map using Leaflet and OpenStreetMap (completely free!)
 * Shows origin, destination, and route between them
 */

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-expect-error - Leaflet type definitions don't include this property
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
  const movingMarkerRef = useRef<L.Marker | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false, // Cleaner look
        scrollWheelZoom: false,
        dragging: true
      }); // Initial view set later

      // Add OpenStreetMap tiles (free!)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);

      L.control.zoom({ position: 'topright' }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Clear existing layers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    // Stop any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // 1. Create stylish markers
    const createMarkerIcon = (color: string, label: string) => L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background: ${color};
          width: 36px;
          height: 36px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="transform: rotate(45deg); color: white; font-weight: bold; font-size: 14px;">${label}</span>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -40]
    });

    // Add Origin & Destination
    L.marker([origin.lat, origin.lng], { icon: createMarkerIcon('#10b981', 'A') })
      .bindPopup(`<b>From:</b> ${origin.name}`)
      .addTo(map);

    L.marker([destination.lat, destination.lng], { icon: createMarkerIcon('#ef4444', 'B') })
      .bindPopup(`<b>To:</b> ${destination.name}`)
      .addTo(map);

    // 2. Draw Route & Animation
    if (route && route.length > 0) {
      const coords = route.map(s => [s.lat, s.lng] as [number, number]);

      // Glow/Shadow effect
      L.polyline(coords, {
        color: 'rgba(59, 130, 246, 0.4)',
        weight: 8,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Main line
      const polyline = L.polyline(coords, {
        color: '#2563eb',
        weight: 4,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // --- Moving Arrow Animation ---
      const arrowIcon = L.divIcon({
        className: 'moving-arrow',
        html: `
          <div style="
            width: 0; 
            height: 0; 
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-bottom: 20px solid #f59e0b; /* Amber-500 */
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
          "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      movingMarkerRef.current = L.marker(coords[0], {
        icon: arrowIcon,
        zIndexOffset: 1000
      }).addTo(map);

      // Animation Logic
      let startTime: number | null = null;
      const duration = 10000; // 10 seconds for full loop

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = ((timestamp - startTime) % duration) / duration;

        // Find position on polyline
        // Total distance calculation is approximate for animation smoothness
        const totalIdx = coords.length - 1;
        const currentPosIdx = progress * totalIdx;
        const baseIdx = Math.floor(currentPosIdx);
        const nextIdx = Math.min(baseIdx + 1, totalIdx);
        const ratio = currentPosIdx - baseIdx;

        if (baseIdx < totalIdx) {
          const lat = coords[baseIdx][0] + (coords[nextIdx][0] - coords[baseIdx][0]) * ratio;
          const lng = coords[baseIdx][1] + (coords[nextIdx][1] - coords[baseIdx][1]) * ratio;

          if (movingMarkerRef.current) {
            movingMarkerRef.current.setLatLng([lat, lng]);

            // Rotate arrow (basic bearing)
            const dLon = (coords[nextIdx][1] - coords[baseIdx][1]);
            const y = Math.sin(dLon) * Math.cos(coords[nextIdx][0]);
            const x = Math.cos(coords[baseIdx][0]) * Math.sin(coords[nextIdx][0]) - Math.sin(coords[baseIdx][0]) * Math.cos(coords[nextIdx][0]) * Math.cos(dLon);
            let brng = Math.atan2(y, x) * 180 / Math.PI;
            brng = (brng + 360) % 360;

            // Update rotation logic matching the icon direction (arrow points up by default structure, so we rotate)
            // Actually simple atan2 between points is enough for screen space, but lat/lng is fine
            const angle = Math.atan2(coords[nextIdx][0] - coords[baseIdx][0], coords[nextIdx][1] - coords[baseIdx][1]) * 180 / Math.PI;

            // Leaflet rotation plugin is best, but we can rotate the div directly via CSS transform
            const iconDiv = movingMarkerRef.current.getElement()?.querySelector('div');
            if (iconDiv) {
              // Calculate bearing simply for visual
              const dy = coords[nextIdx][0] - coords[baseIdx][0];
              const dx = coords[nextIdx][1] - coords[baseIdx][1];
              let theta = Math.atan2(dy, dx) * 180 / Math.PI;
              // Standard angle is from X axis (East). North is +90deg.
              // CSS rotate is clockwise.
              // Let's just assume rough direction.
              // A simpler way: just rotate the parent div
              const bearing = (Math.atan2(dx, dy) * 180 / Math.PI); // 0 is North
              iconDiv.style.transform = `rotate(${bearing}deg)`;
            }
          }
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);

      // --- Zoom Animation ---
      // "Zoom out from somewhere to show both points"
      // Start at Origin, Zoom high
      map.setView([origin.lat, origin.lng], 14, { animate: false });

      // Smoothly fly to bounds
      const bounds = polyline.getBounds();
      setTimeout(() => {
        map.flyToBounds(bounds, {
          padding: [50, 50],
          duration: 2.5, // Slow and smooth
          easeLinearity: 0.2
        });
      }, 500);

    } else {
      // Fallback if no route
      // Start at Origin
      map.setView([origin.lat, origin.lng], 14, { animate: false });

      const bounds = L.latLngBounds([
        [origin.lat, origin.lng],
        [destination.lat, destination.lng]
      ]);

      setTimeout(() => {
        map.flyToBounds(bounds, {
          padding: [50, 50],
          duration: 2.5,
          easeLinearity: 0.2
        });
      }, 500);
    }

    // Cleanup
    return () => {
      // Don't nuke the map instance on re-render to separate concerns, 
      // but we do want to cleanup layers. 
      // Actually with React StrictMode double invoke, keeping mapRef might duplicate if we don't clean.
      // We will clear layers at start of useEffect instead.
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [origin, destination, route]); // Re-run when these change

  const [is3D, setIs3D] = useState(false);

  // Update styles when 3D mode changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Counter-rotate markers in 3D mode so they stand up
    const markers = document.querySelectorAll('.custom-marker, .moving-arrow');
    markers.forEach((el) => {
      (el as HTMLElement).style.transform = is3D
        ? `${(el as HTMLElement).style.transform} rotateX(-45deg)`
        : (el as HTMLElement).style.transform.replace(' rotateX(-45deg)', '');
      (el as HTMLElement).style.transition = 'transform 0.5s';
    });
  }, [is3D]);

  return (
    <div className="relative group perspective-1000" style={{ perspective: '1200px' }}>
      <div
        ref={mapContainerRef}
        className={`rounded-lg overflow-hidden border border-gray-200 shadow-sm ${className} transition-all duration-1000 ease-in-out`}
        style={{
          height,
          width: '100%',
          transform: is3D ? 'rotateX(45deg) scale(0.9) translateY(-10px)' : 'rotateX(0deg) scale(1)',
          boxShadow: is3D ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '',
          transformStyle: 'preserve-3d',
        }}
      />

      {/* 3D Toggle Control */}
      <button
        onClick={() => setIs3D(!is3D)}
        className="absolute bottom-6 right-6 z-[400] bg-white/90 backdrop-blur-sm text-gray-800 p-2.5 rounded-xl shadow-lg font-bold text-xs hover:bg-white hover:scale-105 transition-all flex items-center gap-2 border border-gray-100"
      >
        {is3D ? (
          <>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            2D Flat View
          </>
        ) : (
          <>
            <span className="text-lg">🧊</span>
            3D Immersive
          </>
        )}
      </button>

      {/* Overlay Gradient for Depth in 3D */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000 bg-gradient-to-t from-black/10 to-transparent rounded-lg"
        style={{ opacity: is3D ? 1 : 0 }}
      />
    </div>
  );
}

export default JourneyMap;
