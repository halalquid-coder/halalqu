'use client';
import Link from 'next/link';
import { useState } from 'react';

const destinations = [];
const featured = [];

export default function TravelPage() {
    const [search, setSearch] = useState('');
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

            {/* Featured Guides */}
            {featured.length > 0 && (
                <>
                    <div className="section-header">
                        <h2 className="section-title">⭐ Kurasi Pilihan</h2>
                    </div>
                    <div className="scroll-row" style={{ marginBottom: 'var(--space-xl)' }}>
                        {featured.map((item, i) => (
                            <div key={i} style={{
                                minWidth: '280px', padding: 'var(--space-lg)',
                                background: 'var(--halalqu-green-gradient)', borderRadius: 'var(--radius-lg)',
                                color: 'var(--white)', position: 'relative', overflow: 'hidden',
                            }}>
                                <div style={{ position: 'absolute', top: '-20px', right: '-10px', fontSize: '80px', opacity: 0.15 }}>
                                    {item.emoji}
                                </div>
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>📍 {item.city}</div>
                                    <h3 style={{ fontSize: '16px', color: 'var(--white)', marginBottom: 'var(--space-sm)' }}>
                                        {item.title}
                                    </h3>
                                    <span style={{ fontSize: '13px', opacity: 0.8 }}>{item.count} tempat halal →</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* All Destinations */}
            <div className="section-header">
                <h2 className="section-title">🌍 Semua Destinasi</h2>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{filtered.length} kota</span>
            </div>
            {filtered.length === 0 ? (
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
                                background: `${dest.color}15`, display: 'flex',
                                alignItems: 'center', justifyContent: 'center', fontSize: '28px',
                            }}>
                                {dest.emoji}
                            </div>
                            <div>
                                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '14px' }}>
                                    {dest.name}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {dest.count} tempat halal
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
