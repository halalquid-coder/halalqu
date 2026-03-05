'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function HalalMap({ restaurants = [] }) {
    const router = useRouter();
    const [mapReady, setMapReady] = useState(false);
    const [MapComponents, setMapComponents] = useState(null);
    const [userPos, setUserPos] = useState(null);
    const [locating, setLocating] = useState(false);
    const mapRef = useRef(null);

    // Default center: Jakarta
    const defaultCenter = [-6.2088, 106.8456];

    // Load Leaflet dynamically (SSR-safe)
    useEffect(() => {
        import('leaflet').then((L) => {
            import('react-leaflet').then((RL) => {
                // Fix default marker icons
                delete L.Icon.Default.prototype._getIconUrl;
                L.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                });
                setMapComponents({ L, ...RL });
                setMapReady(true);
            });
        });

        // Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
    }, []);

    const handleLocateUser = () => {
        if (!navigator.geolocation) {
            alert('Browser tidak mendukung lokasi');
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newPos = [pos.coords.latitude, pos.coords.longitude];
                setUserPos(newPos);
                if (mapRef.current) {
                    mapRef.current.flyTo(newPos, 15);
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

    // Auto-locate user once map is ready
    useEffect(() => {
        if (mapReady && MapComponents && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const newPos = [pos.coords.latitude, pos.coords.longitude];
                    setUserPos(newPos);
                    if (mapRef.current) {
                        mapRef.current.flyTo(newPos, 15);
                    }
                },
                () => {
                    // silently fail on auto-locate if permission denied
                },
                { timeout: 5000 }
            );
        }
    }, [mapReady, MapComponents]);

    if (!mapReady || !MapComponents) {
        return (
            <div style={{
                width: '100%', height: '220px', borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 'var(--space-sm)', overflow: 'hidden',
            }}>
                <span style={{ fontSize: '24px' }}>🗺️</span>
                <span style={{ color: 'var(--halalqu-green)', fontWeight: 600, fontSize: '14px' }}>
                    Memuat peta...
                </span>
            </div>
        );
    }

    const { MapContainer, TileLayer, Marker, Popup, Circle } = MapComponents;
    const center = userPos || defaultCenter;

    // Sample restaurant locations (around Jakarta)
    const sampleLocations = [
        { id: '1', name: 'Warung Barokah', lat: -6.2100, lng: 106.8460, badge: '✅ Certified', emoji: '🍽️' },
        { id: '2', name: 'Nasi Padang Minang', lat: -6.2050, lng: 106.8500, badge: '🕌 Muslim Owned', emoji: '🍛' },
        { id: '3', name: 'Kebab Istanbul', lat: -6.2130, lng: 106.8420, badge: '✅ Certified', emoji: '🥙' },
        { id: '4', name: 'Sate Madura Pak H', lat: -6.2070, lng: 106.8480, badge: '🕌 Muslim Owned', emoji: '🍢' },
        { id: '5', name: 'Bakso Solo Pak Min', lat: -6.2020, lng: 106.8440, badge: '✅ Certified', emoji: '🍜' },
    ];

    const locations = restaurants;

    return (
        <div style={{
            width: '100%', height: '220px', borderRadius: 'var(--radius-xl)',
            overflow: 'hidden', position: 'relative',
            boxShadow: 'var(--shadow-md)',
            zIndex: 1, isolation: 'isolate',
        }}>
            <MapContainer
                ref={mapRef}
                center={center}
                zoom={15}
                scrollWheelZoom={false}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://osm.org">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* User location */}
                {userPos && (
                    <Circle
                        center={userPos}
                        radius={100}
                        pathOptions={{
                            color: '#2E9B5A',
                            fillColor: '#2E9B5A',
                            fillOpacity: 0.2,
                        }}
                    />
                )}

                {/* Restaurant markers */}
                {locations.map((loc) => (
                    <Marker key={loc.id} position={[loc.lat, loc.lng]}>
                        <Popup>
                            <div style={{ minWidth: '140px', padding: '4px 0' }}>
                                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                                    {loc.emoji} {loc.name}
                                </div>
                                <div style={{ fontSize: '11px', marginBottom: '8px', color: '#666' }}>
                                    {loc.badge}
                                </div>
                                <button
                                    onClick={() => router.push(`/restaurant/${loc.id}`)}
                                    style={{
                                        width: '100%', padding: '6px 12px',
                                        background: '#2E9B5A', color: '#fff',
                                        border: 'none', borderRadius: '6px',
                                        fontSize: '12px', fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Lihat Detail →
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Overlay label */}
            <div style={{
                position: 'absolute', bottom: '12px', left: '12px', zIndex: 1000,
                display: 'flex', gap: '8px'
            }}>
                <div style={{
                    background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
                    padding: '8px 14px', borderRadius: 'var(--radius-pill)',
                    fontSize: '12px', fontWeight: 600, color: '#2E9B5A',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                    📍 {locations.length} Restoran Halal
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
