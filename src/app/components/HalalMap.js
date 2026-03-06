'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function HalalMap({ restaurants = [] }) {
    const router = useRouter();
    const [mapReady, setMapReady] = useState(false);
    const [userPos, setUserPos] = useState(null);
    const [locating, setLocating] = useState(false);
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef([]);

    // Default center: Jakarta
    const defaultCenter = { lat: -6.2088, lng: 106.8456 };

    // Initialize Google Maps SDK
    useEffect(() => {
        if (!GOOGLE_MAPS_API_KEY) {
            console.error("Google Maps API Key depends on NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
            return;
        }

        const initMap = () => {
            if (window.google?.maps && mapRef.current) {
                // Initialize the map exactly once
                if (!mapInstance.current) {
                    mapInstance.current = new window.google.maps.Map(mapRef.current, {
                        center: defaultCenter,
                        zoom: 13,
                        disableDefaultUI: true,
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: false,
                        zoomControl: false,
                        styles: [
                            {
                                "featureType": "poi.business",
                                "elementType": "labels",
                                "stylers": [{ "visibility": "off" }]
                            }
                        ]
                    });
                    setMapReady(true);
                }
            }
        };

        if (window.google?.maps) {
            initMap();
        } else {
            const scriptId = 'google-maps-script';
            if (!document.getElementById(scriptId)) {
                const script = document.createElement('script');
                script.id = scriptId;
                script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initGoogleMapsHalalMap`;
                script.async = true;
                script.defer = true;
                window.initGoogleMapsHalalMap = initMap;
                document.head.appendChild(script);
            } else {
                // Fallback polling if script is loading from elsewhere
                const checkInterval = setInterval(() => {
                    if (window.google?.maps) {
                        initMap();
                        clearInterval(checkInterval);
                    }
                }, 500);
            }
        }
    }, []);

    // Add and manage markers when map is ready or restaurants change
    useEffect(() => {
        if (!mapReady || !mapInstance.current || !window.google) return;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        const bounds = new window.google.maps.LatLngBounds();
        let hasValidLocations = false;

        restaurants.forEach(loc => {
            if (loc.lat && loc.lng) {
                hasValidLocations = true;
                const position = { lat: parseFloat(loc.lat), lng: parseFloat(loc.lng) };

                // Content for Custom Marker Pin
                const markerContainer = document.createElement('div');
                markerContainer.innerHTML = `
                    <div style="
                        background: white; 
                        border: 2px solid var(--halalqu-green); 
                        border-radius: 50%; width: 34px; height: 34px; 
                        display: flex; align-items: center; justify-content: center; 
                        font-size: 18px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);
                        position: relative;
                    ">
                        ${loc.emoji || '🍽️'}
                        <div style="position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid var(--halalqu-green);"></div>
                    </div>
                `;

                const marker = new window.google.maps.marker.AdvancedMarkerElement({
                    position: position,
                    map: mapInstance.current,
                    title: loc.name,
                    content: markerContainer
                });

                // InfoWindow for Marker Click
                const infoWindowContent = `
                    <div style="min-width: 140px; padding: 4px; font-family: Inter, sans-serif;">
                        <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #333;">
                            ${loc.emoji || '🍽️'} ${loc.name}
                        </div>
                        <div style="font-size: 11px; margin-bottom: 8px; color: #666;">
                            ${loc.badgeLabel || loc.badge}
                        </div>
                        <button id="infowindow-btn-${loc.id}" style="
                            width: 100%; padding: 6px 12px; background: #2E9B5A; color: #fff;
                            border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;
                        ">
                            Lihat Detail →
                        </button>
                    </div>
                `;

                const infoWindow = new window.google.maps.InfoWindow({
                    content: infoWindowContent
                });

                marker.addListener("click", () => {
                    infoWindow.open({ anchor: marker, map: mapInstance.current });
                    // Must attach the event listener after the InfoWindow mounts to the DOM
                    setTimeout(() => {
                        const btn = document.getElementById(`infowindow-btn-${loc.id}`);
                        if (btn) btn.addEventListener('click', () => router.push(`/restaurant/${loc.id}`));
                    }, 100);
                });

                markersRef.current.push(marker);
                bounds.extend(position);
            }
        });

        // Fit bounds if there are places and user position is not locked yet
        if (hasValidLocations && !userPos) {
            mapInstance.current.fitBounds(bounds);
        }
    }, [mapReady, restaurants, router]); // userPos is specifically omitted so it only centers bounds initially

    // Auto-locate logic
    const handleLocateUser = () => {
        if (!navigator.geolocation) {
            alert('Browser tidak mendukung lokasi');
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserPos(newPos);

                if (mapInstance.current && window.google) {
                    mapInstance.current.panTo(newPos);
                    mapInstance.current.setZoom(15);

                    // Add User Blue Dot
                    new window.google.maps.Marker({
                        position: newPos,
                        map: mapInstance.current,
                        icon: {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: "#4285F4",
                            fillOpacity: 1,
                            strokeColor: "#ffffff",
                            strokeWeight: 2,
                        },
                        title: "You are here"
                    });
                }
                setLocating(false);
            },
            () => {
                alert('Gagal mendapatkan lokasi. Pastikan GPS aktif.');
                setLocating(false);
            },
            { timeout: 10000 }
        );
    };

    // Auto-locate once on map load
    useEffect(() => {
        if (mapReady && navigator.geolocation && !userPos) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setUserPos(newPos);
                    if (mapInstance.current) {
                        mapInstance.current.panTo(newPos);
                    }
                },
                () => { }, // silent fail
                { timeout: 5000 }
            );
        }
    }, [mapReady]);


    if (!GOOGLE_MAPS_API_KEY) {
        return (
            <div style={{
                width: '100%', height: '220px', borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 'var(--space-sm)', overflow: 'hidden',
            }}>
                <span style={{ fontSize: '24px' }}>🗺️</span>
                <span style={{ color: 'var(--halalqu-green)', fontWeight: 600, fontSize: '14px' }}>
                    Google Maps API Key dibutuhkan.
                </span>
            </div>
        );
    }

    return (
        <div style={{
            width: '100%', height: '220px', borderRadius: 'var(--radius-xl)',
            overflow: 'hidden', position: 'relative',
            boxShadow: 'var(--shadow-md)',
            zIndex: 1, isolation: 'isolate',
        }}>
            {!mapReady && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: '#f0f0f0', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 2
                }}>
                    <span style={{ color: 'var(--halalqu-green)', fontWeight: 600, fontSize: '14px' }}>
                        Memuat Google Maps...
                    </span>
                </div>
            )}

            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

            {/* Overlay label */}
            <div style={{
                position: 'absolute', bottom: '12px', left: '12px', zIndex: 10,
                display: 'flex', gap: '8px'
            }}>
                <div style={{
                    background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
                    padding: '8px 14px', borderRadius: 'var(--radius-pill)',
                    fontSize: '12px', fontWeight: 600, color: '#2E9B5A',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                    📍 {restaurants.length} Restoran Halal
                </div>
                <button onClick={handleLocateUser} disabled={locating} style={{
                    background: locating ? '#E9F7EF' : '#2E9B5A',
                    color: locating ? '#2E9B5A' : 'white',
                    border: 'none', padding: '8px 14px', borderRadius: 'var(--radius-pill)',
                    fontSize: '12px', fontWeight: 600, cursor: locating ? 'wait' : 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    transition: 'all 0.2s ease'
                }}>
                    {locating ? '⏳ Mencari...' : '🎯 Temukan Saya'}
                </button>
            </div>
        </div>
    );
}
