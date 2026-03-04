'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { doc, getDoc, updateDoc, serverTimestamp, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getRestaurantReviews, getMerchantApplication } from '../../lib/firestore';

export default function MerchantDashboard() {
    const { user, authLoading, refreshUser } = useUser();
    const [activeTab, setActiveTab] = useState('overview');
    const [place, setPlace] = useState(null);
    const [application, setApplication] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [uploading, setUploading] = useState(false);

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

            // 1. Try to get placeId from user document directly
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            let placeId = userDoc.exists() ? userDoc.data().merchantInfo?.placeId : null;

            // 2. If not in user document, try finding a place owned by this user
            if (!placeId) {
                const q = query(collection(db, 'places'), where('ownerId', '==', user.uid));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    placeId = snap.docs[0].id;
                }
            }

            if (placeId) {
                const placeDoc = await getDoc(doc(db, 'places', placeId));
                if (placeDoc.exists()) {
                    const pdata = { id: placeDoc.id, ...placeDoc.data() };
                    setPlace(pdata);
                    setEditForm({
                        name: pdata.name || '',
                        address: pdata.address || '',
                        phone: pdata.phone || '',
                        operatingHours: pdata.operatingHours || '', // Legacy
                        openTime: pdata.openTime || '',
                        closeTime: pdata.closeTime || '',
                        operatingDays: pdata.operatingDays || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
                        isTemporarilyClosed: pdata.isTemporarilyClosed || false,
                        category: pdata.category || '',
                        description: pdata.description || '',
                        imageUrl: pdata.imageUrl || '',
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

            // Sync with user's merchantInfo for Profile display
            await updateDoc(doc(db, 'users', user.uid), {
                'merchantInfo.restaurantName': editForm.name,
                'merchantInfo.description': editForm.description,
            });

            setPlace({ ...place, ...editForm });
            setEditing(false);
            if (refreshUser) await refreshUser();
            alert('Informasi berhasil diperbarui! ✅');
        } catch (e) {
            alert('Error: ' + e.message);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('Ukuran foto maksimal 2MB');
            return;
        }

        setUploading(true);
        try {
            const { uploadImage } = await import('../../lib/firestore');
            const url = await uploadImage(file, `merchants/${user.uid}/${Date.now()}_${file.name}`);
            setEditForm(prev => ({ ...prev, imageUrl: url }));
        } catch (err) {
            alert('Gagal mengupload foto: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const checkIsOpen = (placeData) => {
        if (!placeData) return false;
        if (placeData.isTemporarilyClosed) return false;
        if (!placeData.openTime || !placeData.closeTime || !placeData.operatingDays) return true; // Default true if data isn't complete yet

        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const now = new Date();
        const currentDay = days[now.getDay()];

        if (!placeData.operatingDays.includes(currentDay)) return false;

        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeParts = [currentHour, currentMinute];

        const openParts = placeData.openTime.split(':').map(Number);
        const closeParts = placeData.closeTime.split(':').map(Number);

        const currentMins = currentHour * 60 + currentMinute;
        const openMins = openParts[0] * 60 + openParts[1];
        const closeMins = closeParts[0] * 60 + closeParts[1];

        // Handles standard cases and across-midnight cases
        if (openMins <= closeMins) {
            return currentMins >= openMins && currentMins < closeMins;
        } else {
            return currentMins >= openMins || currentMins < closeMins;
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
                            { key: 'overview', label: 'Overview' },
                            { key: 'listing', label: 'Listing' },
                            { key: 'reviews', label: 'Review' },
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
                                    { label: 'Rating', value: avgRating, icon: '' },
                                    { label: 'Review', value: reviews.length, icon: '' },
                                    { label: 'Bookmark', value: '-', icon: '' },
                                    { label: 'Status', value: checkIsOpen(place) ? 'Buka' : 'Tutup', icon: '' },
                                ].map((stat, i) => (
                                    <div key={i} style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-md)', boxShadow: 'var(--shadow-sm)' }}>
                                        {stat.icon && <div style={{ fontSize: '24px', marginBottom: '4px' }}>{stat.icon}</div>}
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
                                    <div style={{ width: '100px', height: '100px', borderRadius: 'var(--radius-lg)', background: 'var(--halalqu-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', margin: '0 auto var(--space-md)', overflow: 'hidden' }}>
                                        {editForm.imageUrl || place?.imageUrl ? (
                                            <img src={editing ? editForm.imageUrl || place?.imageUrl : place?.imageUrl} alt="Restoran" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            '🍽️'
                                        )}
                                    </div>
                                    <h3>{place?.name || 'Merchant'}</h3>
                                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{place?.category || ''}</p>

                                    {!editing && (
                                        <div style={{ display: 'inline-block', marginTop: 'var(--space-sm)', padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: '12px', fontWeight: 600, background: checkIsOpen(place) ? '#D1FAE5' : '#FEE2E2', color: checkIsOpen(place) ? '#065F46' : '#991B1B' }}>
                                            {checkIsOpen(place) ? 'Buka Sekarang' : 'Tutup Sekarang'}
                                        </div>
                                    )}
                                </div>

                                {editing ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Foto Restoran</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                            <label style={{ padding: '8px 16px', background: 'var(--halalqu-green-light)', color: 'var(--halalqu-green)', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                                                {uploading ? '⏳ Mengupload...' : 'Pilih Foto'}
                                                <input type="file" accept="image/jpeg, image/png, image/webp" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
                                            </label>
                                            {editForm.imageUrl && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Foto tersimpan ✅</span>}
                                        </div>

                                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Nama</label>
                                        <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} />
                                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Alamat</label>
                                        <input value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} style={inputStyle} />
                                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Telepon</label>
                                        <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} style={inputStyle} />
                                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Kategori</label>
                                        <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} style={inputStyle}>
                                            <option value="">Pilih Kategori</option>
                                            <option value="Restoran">Restoran</option>
                                            <option value="Street Food">Street Food</option>
                                            <option value="Cafe">Cafe</option>
                                            <option value="Fine Dining">Fine Dining</option>
                                            <option value="Bakery">Bakery</option>
                                            <option value="Seafood">Seafood</option>
                                            <option value="Western">Western</option>
                                            <option value="Asian">Asian</option>
                                            <option value="Dessert">Dessert</option>
                                        </select>

                                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 'var(--space-sm)' }}>Hari Operasional</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                                            {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(day => (
                                                <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={editForm.operatingDays?.includes(day) || false}
                                                        onChange={(e) => {
                                                            const currentDays = editForm.operatingDays || [];
                                                            if (e.target.checked) {
                                                                setEditForm({ ...editForm, operatingDays: [...currentDays, day] });
                                                            } else {
                                                                setEditForm({ ...editForm, operatingDays: currentDays.filter(d => d !== day) });
                                                            }
                                                        }}
                                                    /> {day}
                                                </label>
                                            ))}
                                        </div>

                                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Jam Operasional</label>
                                        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Buka</div>
                                                <input type="time" value={editForm.openTime} onChange={e => setEditForm({ ...editForm, openTime: e.target.value })} style={inputStyle} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tutup</div>
                                                <input type="time" value={editForm.closeTime} onChange={e => setEditForm({ ...editForm, closeTime: e.target.value })} style={inputStyle} />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 'var(--space-sm) 0' }}>
                                            <input
                                                type="checkbox"
                                                id="temp-closed"
                                                checked={editForm.isTemporarilyClosed}
                                                onChange={e => setEditForm({ ...editForm, isTemporarilyClosed: e.target.checked })}
                                            />
                                            <label htmlFor="temp-closed" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--danger)', cursor: 'pointer' }}>Buka / Tutup Sementara</label>
                                        </div>

                                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Deskripsi</label>
                                        <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                                        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                                            <button onClick={handleSaveEdit} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', background: '#065F46', color: 'white', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                                                Simpan
                                            </button>
                                            <button onClick={() => setEditing(false)} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', background: '#991B1B', color: 'white', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                                                Batal
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {[
                                            { label: 'Nama', value: place?.name || '-' },
                                            { label: 'Alamat', value: place?.address || '-' },
                                            { label: 'Telepon', value: place?.phone || '-' },
                                            { label: 'Kategori', value: place?.category || '-' },
                                            { label: 'Hari Operasional', value: place?.operatingDays?.length ? place.operatingDays.join(', ') : 'Setiap Hari' },
                                            { label: 'Jam Operasional', value: (place?.openTime && place?.closeTime) ? `${place.openTime} - ${place.closeTime}` : (place?.operatingHours || '-') },
                                            { label: 'Status Toko', value: place?.isTemporarilyClosed ? '🔴 Tutup Sementara' : '🟢 Buka' },
                                            { label: 'Deskripsi', value: place?.description || '-' },
                                        ].map((field, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                                                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{field.label}</span>
                                                <span style={{ fontSize: '14px', fontWeight: 500, maxWidth: '60%', textAlign: 'right', color: field.label === 'Status Toko' && place?.isTemporarilyClosed ? 'var(--danger)' : 'inherit' }}>{field.value}</span>
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
