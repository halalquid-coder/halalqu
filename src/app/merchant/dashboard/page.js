'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getRestaurantReviews, getMerchantApplication } from '../../lib/firestore';

export default function MerchantDashboard() {
    const { user, authLoading } = useUser();
    const [activeTab, setActiveTab] = useState('overview');
    const [place, setPlace] = useState(null);
    const [application, setApplication] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        if (!user.isLoggedIn || authLoading) return;
        loadMerchantData();
    }, [user.isLoggedIn, authLoading]);

    const loadMerchantData = async () => {
        setLoading(true);
        try {
            // Load merchant application status
            const app = await getMerchantApplication(user.uid);
            setApplication(app);

            // Load place data from merchantInfo
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.exists() ? userDoc.data() : {};
            const placeId = userData.merchantInfo?.placeId;

            if (placeId) {
                const placeDoc = await getDoc(doc(db, 'places', placeId));
                if (placeDoc.exists()) {
                    const pdata = { id: placeDoc.id, ...placeDoc.data() };
                    setPlace(pdata);
                    setEditForm({
                        name: pdata.name || '',
                        address: pdata.address || '',
                        phone: pdata.phone || '',
                        operatingHours: pdata.operatingHours || '',
                        category: pdata.category || '',
                        description: pdata.description || '',
                    });
                    // Load reviews for this place
                    try {
                        const revs = await getRestaurantReviews(placeId);
                        setReviews(revs);
                    } catch (e) { console.error(e); }
                }
            }
        } catch (e) {
            console.error('Error loading merchant data:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!place?.id) return;
        try {
            await updateDoc(doc(db, 'places', place.id), {
                ...editForm,
                updatedAt: serverTimestamp(),
            });
            setPlace({ ...place, ...editForm });
            setEditing(false);
            alert('Informasi berhasil diperbarui! ✅');
        } catch (e) {
            alert('Error: ' + e.message);
        }
    };

    if (authLoading || loading) {
        return <div className="page container" style={{ paddingTop: '80px', textAlign: 'center' }}>⏳ Memuat dashboard...</div>;
    }

    if (!user.isLoggedIn) {
        return (
            <div className="page container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center', gap: 'var(--space-md)' }}>
                <span style={{ fontSize: '64px' }}>🔒</span>
                <h2>Login Diperlukan</h2>
                <Link href="/login" className="btn btn-primary">Login →</Link>
            </div>
        );
    }

    const status = application?.status || 'pending';
    const statusInfo = {
        pending: { bg: '#FEF3C7', color: '#B45309', icon: '🟡', label: 'Menunggu Review' },
        approved: { bg: '#D1FAE5', color: '#065F46', icon: '✅', label: 'Disetujui' },
        rejected: { bg: '#FEE2E2', color: '#991B1B', icon: '❌', label: 'Ditolak' },
    };
    const si = statusInfo[status] || statusInfo.pending;

    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + (r.tasteRating || 0), 0) / reviews.length).toFixed(1)
        : '0.0';

    const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '14px', fontFamily: 'inherit' };

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: '120px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <Link href="/profile" style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--white)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', textDecoration: 'none' }}>←</Link>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '20px' }}>🏪 Merchant Dashboard</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{place?.name || application?.restaurantName || 'Merchant'}</p>
                </div>
                <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: si.bg, color: si.color, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {si.icon} {si.label}
                </span>
            </div>

            {/* Pending notice */}
            {status === 'pending' && (
                <div style={{ padding: 'var(--space-md)', background: '#FEF3C7', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-lg)', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
                    <h3 style={{ fontSize: '15px', color: '#B45309', marginBottom: '4px' }}>Aplikasi Sedang Ditinjau</h3>
                    <p style={{ fontSize: '13px', color: '#B45309', opacity: 0.8 }}>Tim kami akan meninjau aplikasi Anda. Anda akan mendapat notifikasi setelah disetujui.</p>
                </div>
            )}

            {status === 'rejected' && (
                <div style={{ padding: 'var(--space-md)', background: '#FEE2E2', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-lg)', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>❌</div>
                    <h3 style={{ fontSize: '15px', color: '#991B1B', marginBottom: '4px' }}>Aplikasi Ditolak</h3>
                    <p style={{ fontSize: '13px', color: '#991B1B', opacity: 0.8 }}>Silakan hubungi admin atau daftar ulang.</p>
                </div>
            )}

            {/* Tabs - only show if approved */}
            {status === 'approved' && (
                <>
                    <div style={{ display: 'flex', background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: '4px', marginBottom: 'var(--space-xl)', boxShadow: 'var(--shadow-sm)' }}>
                        {[
                            { key: 'overview', label: '📊 Overview' },
                            { key: 'listing', label: '📝 Listing' },
                            { key: 'reviews', label: '💬 Review' },
                        ].map(t => (
                            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                                flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)',
                                fontWeight: 600, fontSize: '13px', cursor: 'pointer', border: 'none',
                                transition: 'all 0.2s ease',
                                background: activeTab === t.key ? 'var(--halalqu-green)' : 'transparent',
                                color: activeTab === t.key ? 'var(--white)' : 'var(--text-secondary)',
                            }}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div style={{ animation: 'fadeIn 0.3s ease' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                                {[
                                    { label: 'Rating', value: avgRating, icon: '⭐' },
                                    { label: 'Review', value: reviews.length, icon: '💬' },
                                    { label: 'Bookmark', value: '-', icon: '❤️' },
                                    { label: 'Status', value: 'Aktif', icon: '✅' },
                                ].map((stat, i) => (
                                    <div key={i} style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-md)', boxShadow: 'var(--shadow-sm)' }}>
                                        <div style={{ fontSize: '24px', marginBottom: '4px' }}>{stat.icon}</div>
                                        <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--charcoal)' }}>{stat.value}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{stat.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Certification Status */}
                            <div style={{ background: 'var(--halalqu-green-light)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                <span style={{ fontSize: '32px' }}>🏅</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--halalqu-green)' }}>
                                        {place?.certBody || 'Sertifikat Halal'}
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        {place?.certNumber || 'Nomor sertifikat'} · {place?.certBody || 'Aktif'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Listing Tab */}
                    {activeTab === 'listing' && (
                        <div style={{ animation: 'fadeIn 0.3s ease' }}>
                            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                                    <div style={{ width: '100px', height: '100px', borderRadius: 'var(--radius-lg)', background: 'var(--halalqu-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', margin: '0 auto var(--space-md)' }}>
                                        🍽️
                                    </div>
                                    <h3>{place?.name || 'Merchant'}</h3>
                                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{place?.category || ''}</p>
                                </div>

                                {editing ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Nama</label>
                                        <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} />
                                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Alamat</label>
                                        <input value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} style={inputStyle} />
                                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Telepon</label>
                                        <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} style={inputStyle} />
                                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Jam Buka</label>
                                        <input value={editForm.operatingHours} onChange={e => setEditForm({ ...editForm, operatingHours: e.target.value })} style={inputStyle} />
                                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Kategori</label>
                                        <input value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} style={inputStyle} />
                                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Deskripsi</label>
                                        <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                                        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                                            <button onClick={handleSaveEdit} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', background: '#065F46', color: 'white', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                                                💾 Simpan
                                            </button>
                                            <button onClick={() => setEditing(false)} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', background: '#991B1B', color: 'white', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                                                ✕ Batal
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {[
                                            { label: 'Nama', value: place?.name || '-' },
                                            { label: 'Alamat', value: place?.address || '-' },
                                            { label: 'Telepon', value: place?.phone || '-' },
                                            { label: 'Jam Buka', value: place?.operatingHours || '-' },
                                            { label: 'Kategori', value: place?.category || '-' },
                                            { label: 'Deskripsi', value: place?.description || '-' },
                                        ].map((field, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                                                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{field.label}</span>
                                                <span style={{ fontSize: '14px', fontWeight: 500, maxWidth: '60%', textAlign: 'right' }}>{field.value}</span>
                                            </div>
                                        ))}
                                        <button className="btn btn-outline btn-full" style={{ marginTop: 'var(--space-lg)' }} onClick={() => setEditing(true)}>
                                            ✏️ Edit Informasi
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Reviews Tab */}
                    {activeTab === 'reviews' && (
                        <div style={{ animation: 'fadeIn 0.3s ease' }}>
                            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', boxShadow: 'var(--shadow-sm)', marginBottom: 'var(--space-lg)', textAlign: 'center' }}>
                                <div style={{ fontSize: '40px', fontWeight: 700, color: 'var(--halalqu-green)', fontFamily: 'var(--font-heading)' }}>{avgRating}</div>
                                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>dari {reviews.length} review</div>
                                <div style={{ fontSize: '16px' }}>{'⭐'.repeat(Math.round(Number(avgRating)))}</div>
                            </div>

                            {reviews.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-xl)' }}>Belum ada review</p>
                            ) : (
                                reviews.map(review => (
                                    <div key={review.id} style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-md)', boxShadow: 'var(--shadow-sm)', marginBottom: 'var(--space-md)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                                            <div>
                                                <span style={{ fontWeight: 600, fontSize: '14px' }}>{review.userName || 'Anonymous'}</span>
                                            </div>
                                            <span style={{ fontSize: '12px' }}>{'⭐'.repeat(review.tasteRating || 0)}</span>
                                        </div>
                                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 'var(--space-sm)' }}>
                                            {review.comment || '(no comment)'}
                                        </p>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            Status: {review.status === 'approved' ? '✅ Disetujui' : review.status === 'rejected' ? '❌ Ditolak' : '🟡 Pending'}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
