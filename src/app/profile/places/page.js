'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const statusColors = {
    approved: { bg: '#D1FAE5', color: '#065F46', label: '✅ Disetujui' },
    pending: { bg: '#FEF3C7', color: '#B45309', label: '🟡 Pending' },
    rejected: { bg: '#FEE2E2', color: '#991B1B', label: '❌ Ditolak' },
};

export default function MyPlacesPage() {
    const { user } = useUser();
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user.isLoggedIn || !user.uid) { setLoading(false); return; }
        async function loadPlaces() {
            try {
                const q = query(collection(db, 'places'), where('submittedBy', '==', user.uid));
                const snap = await getDocs(q);
                const data = snap.docs.map(d => {
                    const val = d.data();
                    return {
                        id: d.id,
                        name: val.name || 'Tempat',
                        emoji: '🍽️',
                        category: val.category || 'Restoran',
                        status: val.status || 'pending',
                        createdAt: val.createdAt,
                    };
                });
                setPlaces(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
            } catch (e) {
                console.error('Failed to load places:', e);
            } finally {
                setLoading(false);
            }
        }
        loadPlaces();
    }, [user.uid, user.isLoggedIn]);

    const formatDate = (ts) => {
        if (!ts) return '-';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <Link href="/profile" style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--white)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', textDecoration: 'none' }}>←</Link>
                    <div>
                        <h2 style={{ fontSize: '20px' }}>📍 Tempat Saya</h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{places.length} tempat ditambahkan</p>
                    </div>
                </div>
                <Link href="/add-place" className="btn btn-primary" style={{ padding: '10px 16px', fontSize: '13px' }}>➕ Tambah</Link>
            </div>

            {loading ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>⏳ Memuat tempat...</p>
            ) : places.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 'var(--space-xl)' }}>Belum ada tempat yang ditambahkan.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {places.map(place => {
                        const sc = statusColors[place.status] || statusColors.pending;
                        return (
                            <div key={place.id} style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-md)', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>
                                    <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', background: 'var(--halalqu-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>{place.emoji}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{place.name}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                            <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-pill)', fontSize: '11px', fontWeight: 600, background: sc.bg, color: sc.color }}>{sc.label}</span>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{place.category}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-muted)' }}>
                                    📅 Ditambahkan {formatDate(place.createdAt)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
