'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function TravelDetailPage() {
    const params = useParams();
    const [dest, setDest] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadDest() {
            try {
                const snap = await getDoc(doc(db, 'travel_destinations', params.id));
                if (snap.exists()) {
                    setDest({ id: snap.id, ...snap.data() });
                }
            } catch (e) {
                console.error('Failed to load destination:', e);
            } finally {
                setLoading(false);
            }
        }
        loadDest();
    }, [params.id]);

    if (loading) {
        return (
            <div className="page container" style={{ paddingTop: '80px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>⏳ Memuat...</p>
            </div>
        );
    }

    if (!dest) {
        return (
            <div className="page container" style={{ paddingTop: '80px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>🌍</div>
                <h2>Destinasi tidak ditemukan</h2>
                <Link href="/travel" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>← Kembali</Link>
            </div>
        );
    }

    const color = dest.color || '#2E9B5A';
    const emoji = dest.emoji || '🌍';

    return (
        <div className="page container" style={{ paddingTop: 0 }}>
            {/* Hero */}
            <div style={{
                background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                margin: '0 calc(-1 * var(--space-md))', padding: 'var(--space-xl) var(--space-md)',
                borderRadius: '0 0 var(--radius-xl) var(--radius-xl)',
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: '-30px', right: '-20px', fontSize: '120px', opacity: 0.1 }}>{emoji}</div>

                <Link href="/travel" style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', textDecoration: 'none', color: 'var(--white)',
                    marginBottom: 'var(--space-lg)',
                }}>←</Link>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <span style={{ fontSize: '48px' }}>{emoji}</span>
                    <h1 style={{ color: 'var(--white)', fontSize: '24px', margin: 'var(--space-sm) 0' }}>{dest.name}</h1>
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', lineHeight: 1.6 }}>{dest.description || 'Temukan tempat makan halal terbaik di sekitar destinasi wisata ini.'}</p>
                </div>
            </div>

            {/* Info Cards */}
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
                {dest.country && (
                    <div style={{ flex: 1, background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ fontSize: '22px' }}>🌍</div>
                        <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>{dest.country}</div>
                    </div>
                )}
                {dest.halalScore && (
                    <div style={{ flex: 1, background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ fontSize: '22px' }}>📊</div>
                        <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>Halal Score: {dest.halalScore}</div>
                    </div>
                )}
            </div>

            {/* Tips */}
            {dest.tips && (
                <div style={{ background: 'var(--halalqu-green-light)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                    <h3 style={{ fontSize: '14px', marginBottom: 'var(--space-sm)' }}>💡 Tips Halal</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{dest.tips}</p>
                </div>
            )}

            {/* Restaurants section placeholder */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h2 style={{ fontSize: '18px', marginBottom: 'var(--space-md)' }}>🍽 Restoran Halal di {dest.name}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Restoran halal di destinasi ini akan segera tersedia.</p>
            </div>
        </div>
    );
}
