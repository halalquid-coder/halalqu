'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getAllTravelDestinations } from '../lib/firestore';

export default function TravelPage() {
    const [search, setSearch] = useState('');
    const [destinations, setDestinations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadDestinations() {
            try {
                const data = await getAllTravelDestinations();
                setDestinations(data);
            } catch (e) {
                console.error('Failed to load travel destinations:', e);
            } finally {
                setLoading(false);
            }
        }
        loadDestinations();
    }, []);

    const filtered = destinations.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)' }}>
            <h1 style={{ marginBottom: 'var(--space-sm)' }}>🧳 Travel Guide</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: 'var(--space-lg)' }}>
                Temukan tempat makan halal di destinasi wisata favoritmu
            </p>

            {/* Search */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                background: 'var(--white)', border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '12px var(--space-md)',
                marginBottom: 'var(--space-xl)',
            }}>
                <span>🔍</span>
                <input
                    type="text" placeholder="Cari kota atau destinasi..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: '15px', background: 'none' }}
                />
            </div>

            {/* All Destinations */}
            <div className="section-header">
                <h2 className="section-title">🌍 Semua Destinasi</h2>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{filtered.length} kota</span>
            </div>

            {loading ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 'var(--space-xl)' }}>⏳ Memuat destinasi...</p>
            ) : filtered.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 'var(--space-xl)' }}>Data travel belum tersedia saat ini.</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)' }}>
                    {filtered.map(dest => (
                        <Link key={dest.id} href={`/travel/${dest.id}`} className="card" style={{
                            padding: 'var(--space-md)', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', textAlign: 'center', gap: 'var(--space-sm)',
                            textDecoration: 'none', color: 'inherit',
                        }}>
                            <div style={{
                                width: '56px', height: '56px', borderRadius: '50%',
                                background: `${dest.color || '#2E9B5A'}15`, display: 'flex',
                                alignItems: 'center', justifyContent: 'center', fontSize: '28px',
                            }}>
                                {dest.emoji}
                            </div>
                            <div>
                                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '14px' }}>
                                    {dest.name}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {dest.desc || 'Destinasi wisata halal'}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
