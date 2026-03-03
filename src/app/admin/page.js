'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/UserContext';
import {
    getAllMerchantApplications, updateApplicationStatus,
    getAllPlaces, updatePlaceStatus,
    getAllReviews, getAllUsers, updateUserProfile,
} from '../lib/firestore';

// Admin emails — tambahkan email kamu di sini
const ADMIN_EMAILS = ['admin@halalqu.com'];

export default function AdminPage() {
    const { user, authLoading } = useUser();
    const router = useRouter();
    const [tab, setTab] = useState('merchants');
    const [merchants, setMerchants] = useState([]);
    const [places, setPlaces] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Simple admin check — for MVP, allow any logged-in user
    // In production, use ADMIN_EMAILS list or Firestore role
    const isAdmin = user.isLoggedIn;

    useEffect(() => {
        if (!isAdmin || authLoading) return;
        loadData();
    }, [isAdmin, authLoading]);

    const loadData = async () => {
        setLoading(true);
        setError('');
        const errors = [];

        try {
            const m = await getAllMerchantApplications();
            setMerchants(m);
        } catch (e) { errors.push('Merchant: ' + e.message); }

        try {
            const p = await getAllPlaces();
            setPlaces(p);
        } catch (e) { errors.push('Places: ' + e.message); }

        try {
            const r = await getAllReviews();
            setReviews(r);
        } catch (e) { errors.push('Reviews: ' + e.message); }

        try {
            const u = await getAllUsers();
            setUsers(u);
        } catch (e) { errors.push('Users: ' + e.message); }

        if (errors.length > 0) {
            setError(errors.join(' | '));
        }
        setLoading(false);
    };

    const handleMerchantAction = async (m, status) => {
        try {
            await updateApplicationStatus(m.id, status, m);
            setMerchants(prev => prev.map(item => item.id === m.id ? { ...item, status } : item));
            if (status === 'approved') loadData(); // Reload places list & merchants
        } catch (e) { alert('Error: ' + e.message); }
    };

    const handlePlaceAction = async (docId, status) => {
        try {
            await updatePlaceStatus(docId, status);
            setPlaces(prev => prev.map(p => p.id === docId ? { ...p, status } : p));
        } catch (e) { alert('Error: ' + e.message); }
    };

    if (authLoading) return <div className="page container" style={{ paddingTop: '80px', textAlign: 'center' }}>⏳ Loading...</div>;

    if (!isAdmin) {
        return (
            <div className="page container" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', minHeight: '80vh', textAlign: 'center',
                gap: 'var(--space-md)',
            }}>
                <span style={{ fontSize: '64px' }}>🔒</span>
                <h2>Akses Ditolak</h2>
                <p style={{ color: 'var(--text-muted)' }}>Halaman ini hanya untuk admin.</p>
                <button className="btn btn-primary" onClick={() => router.push('/')}>← Kembali</button>
            </div>
        );
    }

    const formatDate = (ts) => {
        if (!ts) return '-';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const statusBadge = (status) => {
        const styles = {
            pending: { bg: '#FEF3C7', color: '#B45309', icon: '🟡' },
            approved: { bg: '#D1FAE5', color: '#065F46', icon: '✅' },
            rejected: { bg: '#FEE2E2', color: '#991B1B', icon: '❌' },
        };
        const s = styles[status] || styles.pending;
        return (
            <span style={{
                padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                background: s.bg, color: s.color, display: 'inline-flex', alignItems: 'center', gap: '4px',
            }}>
                {s.icon} {status}
            </span>
        );
    };

    const tabs = [
        { key: 'merchants', label: '🏪 Merchant', count: merchants.length },
        { key: 'places', label: '📍 Tempat', count: places.length },
        { key: 'reviews', label: '✏️ Review', count: reviews.length },
        { key: 'users', label: '👤 Users', count: users.length },
    ];

    const pendingMerchants = merchants.filter(m => m.status === 'pending').length;
    const pendingPlaces = places.filter(p => p.status === 'pending').length;

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: '120px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <button onClick={() => router.push('/profile')} style={{
                    width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                    background: 'var(--white)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', cursor: 'pointer',
                }}>←</button>
                <div>
                    <h2 style={{ fontSize: '20px' }}>🛡️ Admin Panel</h2>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Kelola aplikasi Halalqu</p>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div style={{
                    padding: 'var(--space-md)', borderRadius: 'var(--radius-md)',
                    background: '#FDE8E8', color: '#991B1B', fontSize: '12px',
                    marginBottom: 'var(--space-lg)', lineHeight: 1.6, wordBreak: 'break-all',
                }}>
                    ⚠️ <strong>Error:</strong> {error}
                </div>
            )}

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                {[
                    { num: users.length, label: 'Total Users', icon: '👤', color: '#3B82F6' },
                    { num: reviews.length, label: 'Total Review', icon: '✏️', color: '#8B5CF6' },
                    { num: pendingMerchants, label: 'Merchant Pending', icon: '🏪', color: '#F59E0B' },
                    { num: pendingPlaces, label: 'Tempat Pending', icon: '📍', color: '#EF4444' },
                ].map((stat, i) => (
                    <div key={i} style={{
                        background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-md)', boxShadow: 'var(--shadow-sm)',
                        borderLeft: `4px solid ${stat.color}`,
                    }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{stat.icon} {stat.label}</div>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: stat.color }}>{loading ? '...' : stat.num}</div>
                    </div>
                ))}
            </div>

            {/* Tab Bar */}
            <div style={{
                display: 'flex', gap: '4px', background: 'var(--white)', borderRadius: 'var(--radius-md)',
                padding: '4px', marginBottom: 'var(--space-lg)', boxShadow: 'var(--shadow-sm)',
                overflowX: 'auto',
            }}>
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} style={{
                        flex: 1, padding: '10px 8px', borderRadius: 'var(--radius-sm)',
                        fontWeight: 600, fontSize: '12px', cursor: 'pointer', border: 'none',
                        whiteSpace: 'nowrap', transition: 'all 0.2s ease',
                        background: tab === t.key ? 'var(--halalqu-green)' : 'transparent',
                        color: tab === t.key ? 'var(--white)' : 'var(--text-secondary)',
                    }}>
                        {t.label} ({t.count})
                    </button>
                ))}
            </div>

            {/* Refresh */}
            <button onClick={loadData} disabled={loading} style={{
                width: '100%', padding: '10px', borderRadius: 'var(--radius-md)',
                background: 'var(--white)', border: '1px solid var(--border)',
                cursor: 'pointer', fontWeight: 500, fontSize: '13px',
                marginBottom: 'var(--space-lg)', color: 'var(--halalqu-green)',
            }}>
                {loading ? '⏳ Memuat...' : '🔄 Refresh Data'}
            </button>

            {/* Merchant Applications Tab */}
            {tab === 'merchants' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {merchants.length === 0 && !loading && (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-xl)' }}>Belum ada aplikasi merchant</p>
                    )}
                    {merchants.map(m => (
                        <div key={m.id} style={{
                            background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                            padding: 'var(--space-md)', boxShadow: 'var(--shadow-sm)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                                <h4 style={{ fontSize: '15px' }}>🏪 {m.restaurantName || m.restoName || 'Unnamed'}</h4>
                                {statusBadge(m.status)}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)', lineHeight: 1.6 }}>
                                <div>📍 {m.address || '-'}</div>
                                <div>📞 {m.phone || '-'}</div>
                                <div>🏷️ {m.category || '-'}</div>
                                <div>📋 Sertifikasi: {m.certBody || '-'} ({m.certNumber || '-'})</div>
                                <div>📅 {formatDate(m.createdAt)}</div>
                            </div>
                            {m.status === 'pending' && (
                                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                                    <button onClick={() => handleMerchantAction(m, 'approved')} style={{
                                        flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
                                        background: '#065F46', color: 'white', border: 'none',
                                        fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                                    }}>✅ Approve</button>
                                    <button onClick={() => handleMerchantAction(m, 'rejected')} style={{
                                        flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
                                        background: '#991B1B', color: 'white', border: 'none',
                                        fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                                    }}>❌ Reject</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Places Tab */}
            {tab === 'places' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {places.length === 0 && !loading && (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-xl)' }}>Belum ada tempat yang disubmit</p>
                    )}
                    {places.map(p => (
                        <div key={p.id} style={{
                            background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                            padding: 'var(--space-md)', boxShadow: 'var(--shadow-sm)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                                <h4 style={{ fontSize: '15px' }}>📍 {p.name || 'Unnamed'}</h4>
                                {statusBadge(p.status)}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                <div>📍 {p.address || '-'}</div>
                                <div>🏷️ {p.category || '-'} • {p.halalType || '-'}</div>
                                <div>📅 {formatDate(p.createdAt)}</div>
                            </div>
                            {p.status === 'pending' && (
                                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                                    <button onClick={() => handlePlaceAction(p.id, 'approved')} style={{
                                        flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
                                        background: '#065F46', color: 'white', border: 'none',
                                        fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                                    }}>✅ Approve</button>
                                    <button onClick={() => handlePlaceAction(p.id, 'rejected')} style={{
                                        flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
                                        background: '#991B1B', color: 'white', border: 'none',
                                        fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                                    }}>❌ Reject</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Reviews Tab */}
            {tab === 'reviews' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {reviews.length === 0 && !loading && (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-xl)' }}>Belum ada review</p>
                    )}
                    {reviews.map(r => (
                        <div key={r.id} style={{
                            background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                            padding: 'var(--space-md)', boxShadow: 'var(--shadow-sm)',
                        }}>
                            <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>
                                ✏️ {r.userName || 'Anonymous'}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                <div>🏪 Restaurant ID: {r.restaurantId}</div>
                                <div>⭐ Taste: {'★'.repeat(r.tasteRating || 0)} • Halal: {r.halalRating || '-'}</div>
                                <div>💬 {r.comment || '(no comment)'}</div>
                                <div>📅 {formatDate(r.createdAt)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Users Tab */}
            {tab === 'users' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {users.length === 0 && !loading && (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-xl)' }}>Belum ada user</p>
                    )}
                    {users.map(u => (
                        <div key={u.id} style={{
                            background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                            padding: 'var(--space-md)', boxShadow: 'var(--shadow-sm)',
                            display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                        }}>
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '50%',
                                background: 'var(--halalqu-green-light)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                                flexShrink: 0,
                            }}>👤</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: '14px' }}>{u.name || 'Unnamed'}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email || '-'}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    Role: {u.role || 'user'} • 📝 {u.stats?.reviews || 0} reviews
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
