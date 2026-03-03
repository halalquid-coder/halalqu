'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/UserContext';
import {
    getAllMerchantApplications, updateApplicationStatus,
    getAllPlaces, updatePlaceStatus,
    getAllReviews, updateReviewStatus,
    getAllUsers, updateUserProfile,
    getAllTravelDestinations, addTravelDestination, updateTravelDestination, deleteTravelDestination,
    sendNotification, getAllNotifications,
} from '../lib/firestore';

export default function AdminPage() {
    const { user, authLoading } = useUser();
    const router = useRouter();
    const [tab, setTab] = useState('merchants');
    const [merchants, setMerchants] = useState([]);
    const [places, setPlaces] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [users, setUsers] = useState([]);
    const [travelDests, setTravelDests] = useState([]);
    const [notifs, setNotifs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Expanded detail states
    const [expandedMerchant, setExpandedMerchant] = useState(null);
    const [expandedReview, setExpandedReview] = useState(null);

    // Travel form
    const [travelForm, setTravelForm] = useState({ name: '', emoji: '🕌', color: '#2E9B5A', desc: '' });
    const [editingTravel, setEditingTravel] = useState(null);

    // Notification form
    const [notifForm, setNotifForm] = useState({ title: '', message: '', target: 'all' });

    const isAdmin = user.isLoggedIn;

    useEffect(() => {
        if (!isAdmin || authLoading) return;
        loadData();
    }, [isAdmin, authLoading]);

    const loadData = async () => {
        setLoading(true);
        setError('');
        const errors = [];

        try { setMerchants(await getAllMerchantApplications()); } catch (e) { errors.push('Merchant: ' + e.message); }
        try { setPlaces(await getAllPlaces()); } catch (e) { errors.push('Places: ' + e.message); }
        try { setReviews(await getAllReviews()); } catch (e) { errors.push('Reviews: ' + e.message); }
        try { setUsers(await getAllUsers()); } catch (e) { errors.push('Users: ' + e.message); }
        try { setTravelDests(await getAllTravelDestinations()); } catch (e) { errors.push('Travel: ' + e.message); }
        try { setNotifs(await getAllNotifications()); } catch (e) { errors.push('Notif: ' + e.message); }

        if (errors.length > 0) setError(errors.join(' | '));
        setLoading(false);
    };

    // Handlers
    const handleMerchantAction = async (m, status) => {
        try {
            await updateApplicationStatus(m.id, status, m);
            setMerchants(prev => prev.map(item => item.id === m.id ? { ...item, status } : item));
            if (status === 'approved') loadData();
        } catch (e) { alert('Error: ' + e.message); }
    };

    const handlePlaceAction = async (docId, status) => {
        try {
            await updatePlaceStatus(docId, status);
            setPlaces(prev => prev.map(p => p.id === docId ? { ...p, status } : p));
        } catch (e) { alert('Error: ' + e.message); }
    };

    const handleReviewAction = async (reviewId, status) => {
        try {
            await updateReviewStatus(reviewId, status);
            setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status } : r));
        } catch (e) { alert('Error: ' + e.message); }
    };

    const handleAddTravel = async () => {
        if (!travelForm.name.trim()) return alert('Nama destinasi wajib diisi');
        try {
            if (editingTravel) {
                await updateTravelDestination(editingTravel, travelForm);
                setTravelDests(prev => prev.map(t => t.id === editingTravel ? { ...t, ...travelForm } : t));
                setEditingTravel(null);
            } else {
                await addTravelDestination(travelForm);
                setTravelDests(await getAllTravelDestinations());
            }
            setTravelForm({ name: '', emoji: '🕌', color: '#2E9B5A', desc: '' });
        } catch (e) { alert('Error: ' + e.message); }
    };

    const handleDeleteTravel = async (id) => {
        if (!confirm('Hapus destinasi ini?')) return;
        try {
            await deleteTravelDestination(id);
            setTravelDests(prev => prev.filter(t => t.id !== id));
        } catch (e) { alert('Error: ' + e.message); }
    };

    const handleSendNotif = async () => {
        if (!notifForm.title.trim() || !notifForm.message.trim()) return alert('Title dan message wajib diisi');
        try {
            await sendNotification(notifForm);
            setNotifs(await getAllNotifications());
            setNotifForm({ title: '', message: '', target: 'all' });
            alert('Notifikasi berhasil dikirim! 🎉');
        } catch (e) { alert('Error: ' + e.message); }
    };

    if (authLoading) return <div className="page container" style={{ paddingTop: '80px', textAlign: 'center' }}>⏳ Loading...</div>;
    if (!isAdmin) {
        return (
            <div className="page container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center', gap: 'var(--space-md)' }}>
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
            <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: s.bg, color: s.color, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {s.icon} {status}
            </span>
        );
    };

    const cardStyle = { background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-md)', boxShadow: 'var(--shadow-sm)' };
    const btnApprove = { flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', background: '#065F46', color: 'white', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' };
    const btnReject = { ...btnApprove, background: '#991B1B' };
    const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '14px', fontFamily: 'inherit' };

    const tabs = [
        { key: 'merchants', label: '🏪 Merchant', count: merchants.length },
        { key: 'places', label: '📍 Tempat', count: places.length },
        { key: 'reviews', label: '✏️ Review', count: reviews.length },
        { key: 'travel', label: '🧳 Travel', count: travelDests.length },
        { key: 'notifs', label: '📢 Notif', count: notifs.length },
        { key: 'users', label: '👤 Users', count: users.length },
    ];

    const pendingMerchants = merchants.filter(m => m.status === 'pending').length;
    const pendingPlaces = places.filter(p => p.status === 'pending').length;
    const pendingReviews = reviews.filter(r => !r.status || r.status === 'pending').length;

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: '120px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <button onClick={() => router.push('/profile')} style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--white)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', cursor: 'pointer' }}>←</button>
                <div>
                    <h2 style={{ fontSize: '20px' }}>🛡️ Admin Panel</h2>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Kelola aplikasi Halalqu</p>
                </div>
            </div>

            {error && (
                <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', background: '#FDE8E8', color: '#991B1B', fontSize: '12px', marginBottom: 'var(--space-lg)', lineHeight: 1.6, wordBreak: 'break-all' }}>
                    ⚠️ <strong>Error:</strong> {error}
                </div>
            )}

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                {[
                    { num: pendingMerchants, label: 'Merchant Pending', icon: '🏪', color: '#F59E0B' },
                    { num: pendingReviews, label: 'Review Pending', icon: '✏️', color: '#8B5CF6' },
                    { num: pendingPlaces, label: 'Tempat Pending', icon: '📍', color: '#EF4444' },
                ].map((stat, i) => (
                    <div key={i} style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-sm)', boxShadow: 'var(--shadow-sm)', borderLeft: `3px solid ${stat.color}`, textAlign: 'center' }}>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: stat.color }}>{loading ? '...' : stat.num}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{stat.icon} {stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Tab Bar */}
            <div style={{ display: 'flex', gap: '3px', background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: '3px', marginBottom: 'var(--space-lg)', boxShadow: 'var(--shadow-sm)', overflowX: 'auto' }}>
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} style={{
                        flex: 1, padding: '8px 4px', borderRadius: 'var(--radius-sm)',
                        fontWeight: 600, fontSize: '11px', cursor: 'pointer', border: 'none',
                        whiteSpace: 'nowrap', transition: 'all 0.2s ease',
                        background: tab === t.key ? 'var(--halalqu-green)' : 'transparent',
                        color: tab === t.key ? 'var(--white)' : 'var(--text-secondary)',
                    }}>
                        {t.label} ({t.count})
                    </button>
                ))}
            </div>

            {/* Refresh */}
            <button onClick={loadData} disabled={loading} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', background: 'var(--white)', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 500, fontSize: '13px', marginBottom: 'var(--space-lg)', color: 'var(--halalqu-green)' }}>
                {loading ? '⏳ Memuat...' : '🔄 Refresh Data'}
            </button>

            {/* ═══════════════════════════════════════ */}
            {/* 🏪 Merchant Applications Tab            */}
            {/* ═══════════════════════════════════════ */}
            {tab === 'merchants' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {merchants.length === 0 && !loading && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-xl)' }}>Belum ada aplikasi merchant</p>}
                    {merchants.map(m => (
                        <div key={m.id} style={cardStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                                <h4 style={{ fontSize: '15px', cursor: 'pointer' }} onClick={() => setExpandedMerchant(expandedMerchant === m.id ? null : m.id)}>
                                    🏪 {m.restaurantName || m.restoName || 'Unnamed'} {expandedMerchant === m.id ? '▲' : '▼'}
                                </h4>
                                {statusBadge(m.status)}
                            </div>

                            {/* Summary always visible */}
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)', lineHeight: 1.6 }}>
                                <div>📍 {m.address || '-'}</div>
                                <div>🏷️ {m.category || '-'}</div>
                            </div>

                            {/* Expandable detail */}
                            {expandedMerchant === m.id && (
                                <div style={{ padding: 'var(--space-md)', background: '#F9FAFB', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-sm)', fontSize: '13px', lineHeight: 1.8 }}>
                                    <div><strong>📞 Telepon:</strong> {m.phone || '-'}</div>
                                    <div><strong>📋 Sertifikasi:</strong> {m.certBody || '-'} ({m.certNumber || '-'})</div>
                                    <div><strong>🏷️ Kategori:</strong> {m.category || '-'}</div>
                                    <div><strong>📝 Deskripsi:</strong> {m.description || '-'}</div>
                                    <div><strong>🕐 Jam Operasi:</strong> {m.operatingHours || '-'}</div>
                                    <div><strong>👤 User ID:</strong> <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{m.userId || '-'}</span></div>
                                    <div><strong>📅 Tanggal Daftar:</strong> {formatDate(m.createdAt)}</div>
                                    {m.halalQualifications && m.halalQualifications.length > 0 && (
                                        <div><strong>✅ Kualifikasi Halal:</strong> {m.halalQualifications.join(', ')}</div>
                                    )}
                                </div>
                            )}

                            {m.status === 'pending' && (
                                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                    <button onClick={() => handleMerchantAction(m, 'approved')} style={btnApprove}>✅ Approve</button>
                                    <button onClick={() => handleMerchantAction(m, 'rejected')} style={btnReject}>❌ Reject</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ═══════════════════════════════════════ */}
            {/* 📍 Places Tab                          */}
            {/* ═══════════════════════════════════════ */}
            {tab === 'places' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {places.length === 0 && !loading && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-xl)' }}>Belum ada tempat</p>}
                    {places.map(p => (
                        <div key={p.id} style={cardStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                                <h4 style={{ fontSize: '15px' }}>📍 {p.name || 'Unnamed'}</h4>
                                {statusBadge(p.status)}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                <div>📍 {p.address || '-'}</div>
                                <div>🏷️ {p.category || '-'} • {p.halalType || p.certBody || '-'}</div>
                                <div>⭐ {p.rating || 0} • {p.reviewCount || 0} reviews</div>
                                <div>📅 {formatDate(p.createdAt)}</div>
                            </div>
                            {p.status === 'pending' && (
                                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                                    <button onClick={() => handlePlaceAction(p.id, 'approved')} style={btnApprove}>✅ Approve</button>
                                    <button onClick={() => handlePlaceAction(p.id, 'rejected')} style={btnReject}>❌ Reject</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ═══════════════════════════════════════ */}
            {/* ✏️ Reviews Tab                         */}
            {/* ═══════════════════════════════════════ */}
            {tab === 'reviews' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {reviews.length === 0 && !loading && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-xl)' }}>Belum ada review</p>}
                    {reviews.map(r => (
                        <div key={r.id} style={{ ...cardStyle, borderLeft: `3px solid ${r.status === 'approved' ? '#065F46' : r.status === 'rejected' ? '#991B1B' : '#F59E0B'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <h4 style={{ fontSize: '14px', cursor: 'pointer' }} onClick={() => setExpandedReview(expandedReview === r.id ? null : r.id)}>
                                    ✏️ {r.userName || 'Anonymous'} {expandedReview === r.id ? '▲' : '▼'}
                                </h4>
                                {statusBadge(r.status || 'pending')}
                            </div>

                            {/* Rating summary */}
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                ⭐ Rasa: {'★'.repeat(r.tasteRating || 0)} • Halal: {r.halalRating || '-'}
                            </div>

                            {/* Expandable detail */}
                            {expandedReview === r.id && (
                                <div style={{ padding: 'var(--space-md)', background: '#F9FAFB', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-sm)', fontSize: '13px', lineHeight: 1.8 }}>
                                    <div><strong>🏪 Restaurant ID:</strong> <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{r.restaurantId || '-'}</span></div>
                                    <div><strong>💬 Komentar:</strong> {r.comment || '(no comment)'}</div>
                                    <div><strong>⭐ Taste Rating:</strong> {'★'.repeat(r.tasteRating || 0)}{'☆'.repeat(5 - (r.tasteRating || 0))}</div>
                                    <div><strong>✅ Halal Rating:</strong> {r.halalRating || '-'}</div>
                                    <div><strong>👤 User ID:</strong> <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{r.userId || '-'}</span></div>
                                    <div><strong>📅 Tanggal:</strong> {formatDate(r.createdAt)}</div>
                                </div>
                            )}

                            {/* Approve/Reject buttons */}
                            {(!r.status || r.status === 'pending') && (
                                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                                    <button onClick={() => handleReviewAction(r.id, 'approved')} style={btnApprove}>✅ Approve</button>
                                    <button onClick={() => handleReviewAction(r.id, 'rejected')} style={btnReject}>❌ Reject</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ═══════════════════════════════════════ */}
            {/* 🧳 Travel Destinations Tab             */}
            {/* ═══════════════════════════════════════ */}
            {tab === 'travel' && (
                <div>
                    {/* Add/Edit Form */}
                    <div style={{ ...cardStyle, marginBottom: 'var(--space-lg)', borderLeft: '3px solid var(--halalqu-green)' }}>
                        <h4 style={{ fontSize: '14px', marginBottom: 'var(--space-md)' }}>
                            {editingTravel ? '✏️ Edit Destinasi' : '➕ Tambah Destinasi Baru'}
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            <input placeholder="Nama destinasi (contoh: Jakarta, Indonesia)" value={travelForm.name} onChange={e => setTravelForm({ ...travelForm, name: e.target.value })} style={inputStyle} />
                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                <input placeholder="Emoji" value={travelForm.emoji} onChange={e => setTravelForm({ ...travelForm, emoji: e.target.value })} style={{ ...inputStyle, width: '80px', textAlign: 'center', fontSize: '24px' }} />
                                <input type="color" value={travelForm.color} onChange={e => setTravelForm({ ...travelForm, color: e.target.value })} style={{ ...inputStyle, width: '60px', padding: '4px', cursor: 'pointer' }} />
                                <input placeholder="Deskripsi singkat" value={travelForm.desc} onChange={e => setTravelForm({ ...travelForm, desc: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                <button onClick={handleAddTravel} style={{ ...btnApprove, flex: 1 }}>
                                    {editingTravel ? '💾 Simpan Perubahan' : '➕ Tambah'}
                                </button>
                                {editingTravel && (
                                    <button onClick={() => { setEditingTravel(null); setTravelForm({ name: '', emoji: '🕌', color: '#2E9B5A', desc: '' }); }} style={{ ...btnReject, flex: 0, padding: '10px 16px' }}>
                                        ✕ Batal
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {travelDests.length === 0 && !loading && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-xl)' }}>Belum ada destinasi travel</p>}
                        {travelDests.map(t => (
                            <div key={t.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: t.color || '#2E9B5A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0, color: 'white' }}>
                                    {t.emoji}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{t.name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc || '-'}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                    <button onClick={() => { setEditingTravel(t.id); setTravelForm({ name: t.name, emoji: t.emoji, color: t.color, desc: t.desc }); }} style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--white)', cursor: 'pointer', fontSize: '12px' }}>✏️</button>
                                    <button onClick={() => handleDeleteTravel(t.id)} style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid #FEE2E2', background: '#FEF2F2', cursor: 'pointer', fontSize: '12px' }}>🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════ */}
            {/* 📢 Notifications Tab                   */}
            {/* ═══════════════════════════════════════ */}
            {tab === 'notifs' && (
                <div>
                    {/* Send Form */}
                    <div style={{ ...cardStyle, marginBottom: 'var(--space-lg)', borderLeft: '3px solid #8B5CF6' }}>
                        <h4 style={{ fontSize: '14px', marginBottom: 'var(--space-md)' }}>📢 Kirim Notifikasi</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            <input placeholder="Judul notifikasi" value={notifForm.title} onChange={e => setNotifForm({ ...notifForm, title: e.target.value })} style={inputStyle} />
                            <textarea placeholder="Isi pesan..." value={notifForm.message} onChange={e => setNotifForm({ ...notifForm, message: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                            <select value={notifForm.target} onChange={e => setNotifForm({ ...notifForm, target: e.target.value })} style={inputStyle}>
                                <option value="all">🌍 Semua User</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>👤 {u.name || u.email || u.id}</option>
                                ))}
                            </select>
                            <button onClick={handleSendNotif} style={{ ...btnApprove, background: '#8B5CF6' }}>📢 Kirim Notifikasi</button>
                        </div>
                    </div>

                    {/* History */}
                    <h4 style={{ fontSize: '14px', marginBottom: 'var(--space-md)', color: 'var(--text-secondary)' }}>📜 Riwayat Notifikasi</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {notifs.length === 0 && !loading && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-xl)' }}>Belum ada notifikasi</p>}
                        {notifs.map(n => (
                            <div key={n.id} style={{ ...cardStyle, borderLeft: '3px solid #8B5CF6' }}>
                                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{n.title}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{n.message}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: 'var(--space-sm)' }}>
                                    <span>🎯 {n.target === 'all' ? 'Semua User' : n.target}</span>
                                    <span>📅 {formatDate(n.createdAt)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════ */}
            {/* 👤 Users Tab                           */}
            {/* ═══════════════════════════════════════ */}
            {tab === 'users' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {users.length === 0 && !loading && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-xl)' }}>Belum ada user</p>}
                    {users.map(u => (
                        <div key={u.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--halalqu-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>👤</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: '14px' }}>{u.name || 'Unnamed'}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email || '-'}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    Role: <strong>{u.role || 'user'}</strong> • 📝 {u.stats?.reviews || 0} reviews • 📅 {formatDate(u.createdAt)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
