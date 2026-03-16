'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// Haversine formula to calculate distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export default function MosqueFinderPage() {
    const [status, setStatus] = useState('requesting_location'); // requesting_location, fetching, done, error
    const [errorMsg, setErrorMsg] = useState('');
    const [mosques, setMosques] = useState([]);
    const [userLoc, setUserLoc] = useState(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setStatus('error');
            setErrorMsg('Geolokasi tidak didukung oleh browser Anda.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setUserLoc({ lat: latitude, lng: longitude });
                setStatus('fetching');

                try {
                    // Fetch mosques from OpenStreetMap (Overpass API) within 3000 meters
                    const query = `
                        [out:json];
                        (
                          node["amenity"="place_of_worship"]["religion"="muslim"](around:3000, ${latitude}, ${longitude});
                          way["amenity"="place_of_worship"]["religion"="muslim"](around:3000, ${latitude}, ${longitude});
                        );
                        out center;
                    `;
                    const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
                    const data = await res.json();

                    if (data && data.elements) {
                        const parsed = data.elements.map(el => {
                            const lat = el.lat || el.center?.lat;
                            const lon = el.lon || el.center?.lon;
                            const distance = calculateDistance(latitude, longitude, lat, lon);
                            return {
                                id: el.id,
                                name: el.tags?.name || 'Masjid/Musholla (Tanpa Nama)',
                                lat,
                                lon,
                                distance: distance.toFixed(2), // in km
                            };
                        }).filter(m => m.lat && m.lon)
                          .sort((a, b) => a.distance - b.distance); // Sort by nearest

                        setMosques(parsed);
                        setStatus('done');
                    } else {
                        throw new Error("Invalid format");
                    }
                } catch (e) {
                    console.error('Fetch error:', e);
                    setStatus('error');
                    setErrorMsg('Gagal mengambil data masjid dari server. Coba lagi nanti.');
                }
            },
            (err) => {
                setStatus('error');
                if (err.code === 1) {
                    setErrorMsg('Akses lokasi ditolak. Silakan izinkan akses lokasi (GPS) di pengaturan browser Anda.');
                } else {
                    setErrorMsg('Tidak dapat mendeteksi lokasi Anda saat ini.');
                }
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    }, []);

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-lg)', paddingBottom: '96px', minHeight: '100vh', background: 'var(--background)' }}>
            
            {/* ═══════════ HEADER ═══════════ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-xl)' }}>
                <Link href="/travel" style={{
                    background: 'var(--white)', width: '40px', height: '40px',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', textDecoration: 'none', color: 'inherit', boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--border)'
                }}>←</Link>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--charcoal)' }}>🕌 Cari Mesjid</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Radius Maksimal 3 KM</p>
                </div>
            </div>

            {/* ═══════════ CONTENT ═══════════ */}
            
            {status === 'requesting_location' && (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'pulse 1.5s infinite' }}>📍</div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>Mendeteksi Lokasi...</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Mohon izinkan akses lokasi (GPS) agar kami dapat menemukan mesjid terdekat dari Anda.</p>
                </div>
            )}

            {status === 'fetching' && (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'pulse 1.5s infinite' }}>📡</div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>Mencari Mesjid...</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Mencari mesjid & musholla di sekitar Anda menggunakan satelit...</p>
                </div>
            )}

            {status === 'error' && (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-xl)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px', color: '#B91C1C' }}>Pencarian Gagal</h3>
                    <p style={{ fontSize: '14px', color: '#991B1B', marginBottom: '16px' }}>{errorMsg}</p>
                    <button onClick={() => window.location.reload()} style={{
                        padding: '10px 20px', background: '#DC2626', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer'
                    }}>Coba Lagi</button>
                </div>
            )}

            {status === 'done' && (
                <div>
                    <div style={{ marginBottom: 'var(--space-md)', padding: '16px', background: 'var(--halalqu-green-light)', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid var(--halalqu-green)' }}>
                        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                            Ditemukan <strong>{mosques.length} tempat ibadah</strong> dalam radius 3km dari lokasi Anda saat ini.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {mosques.map((m, idx) => (
                            <div key={m.id} style={{
                                background: 'var(--white)', borderRadius: 'var(--radius-xl)',
                                padding: '16px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
                                display: 'flex', flexDirection: 'column', gap: '12px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '20px' }}>🕌</span>
                                            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--charcoal)' }}>{m.name}</h3>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
                                            <span>📍 Radius:</span>
                                            <span style={{ fontWeight: 600, color: 'var(--halalqu-green)' }}>{m.distance} km</span>
                                        </div>
                                    </div>
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '50%', background: 'var(--halalqu-green-light)',
                                        color: 'var(--halalqu-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px'
                                    }}>
                                        #{idx + 1}
                                    </div>
                                </div>
                                
                                <a 
                                    href={`https://www.google.com/maps/dir/?api=1&origin=${userLoc?.lat},${userLoc?.lng}&destination=${m.lat},${m.lon}&travelmode=driving`}
                                    target="_blank" rel="noreferrer"
                                    style={{
                                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                                        width: '100%', padding: '12px', background: '#EEF2FF', color: '#4F46E5',
                                        border: '1px solid #C7D2FE', borderRadius: 'var(--radius-md)',
                                        textDecoration: 'none', fontSize: '14px', fontWeight: 600,
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    🗺️ Arahkan ke Google Maps
                                </a>
                            </div>
                        ))}
                    </div>

                    {mosques.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--white)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border)' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏜️</div>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>Tidak Ada Hasil</h3>
                            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Maaf, kami tidak menemukan data masjid atau musholla dalam radius 3km dari lokasi Anda.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
