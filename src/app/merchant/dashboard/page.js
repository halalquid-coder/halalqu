'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { addDoc, doc, getDoc, updateDoc, serverTimestamp, query, collection, where, getDocs } from 'firebase/firestore';
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
    const [images, setImages] = useState([]);
    const [places, setPlaces] = useState([]);
    const [isAddingNew, setIsAddingNew] = useState(false);

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

            // 2. Try finding all places owned by this user
            let userPlaces = [];
            const q = query(collection(db, 'places'), where('ownerId', '==', user.uid));
            const snap = await getDocs(q);
            if (!snap.empty) {
                userPlaces = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            }
            // Sort to ensure consistent order (e.g. oldest first)
            userPlaces.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
            setPlaces(userPlaces);

            let activePlace = null;
            if (userPlaces.length > 0) {
                activePlace = userPlaces.find(p => p.id === placeId) || userPlaces[0];
            } else if (placeId) {
                const placeDoc = await getDoc(doc(db, 'places', placeId));
                if (placeDoc.exists()) {
                    activePlace = { id: placeDoc.id, ...placeDoc.data() };
                    setPlaces([activePlace]);
                }
            }

            if (activePlace) {
                setPlace(activePlace);
                setEditForm({
                    name: activePlace.name || '',
                    address: activePlace.address || '',
                    phone: activePlace.phone || '',
                    operatingHours: activePlace.operatingHours || '', // Legacy
                    openTime: activePlace.openTime || '',
                    closeTime: activePlace.closeTime || '',
                    operatingDays: activePlace.operatingDays || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
                    isTemporarilyClosed: activePlace.isTemporarilyClosed || false,
                    category: activePlace.category || '',
                    description: activePlace.description || '',
                    imageUrl: activePlace.imageUrl || '',
                });
                setImages(activePlace.images || (activePlace.imageUrl ? [activePlace.imageUrl] : []));
                // Load reviews for this place
                try {
                    const revs = await getRestaurantReviews(activePlace.id);
                    setReviews(revs.filter(r => r.status === 'approved'));
                } catch (e) { console.error(e); }
            }
        } catch (e) {
            console.error('Error loading merchant data:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEdit = async () => {
        try {
            if (isAddingNew) {
                const newPlaceData = {
                    ...editForm,
                    images: images,
                    imageUrl: images.length > 0 ? images[0] : '',
                    ownerId: user.uid,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    certBody: application?.certBody || 'Klaim Mandiri',
                    rating: 0,
                    reviewCount: 0,
                };
                const docRef = await addDoc(collection(db, 'places'), newPlaceData);
                const newPlace = { id: docRef.id, ...newPlaceData };
                setPlaces(prev => [...prev, newPlace]);
                setPlace(newPlace);
                setIsAddingNew(false);
                setEditing(false);
                alert('Listing baru berhasil ditambahkan! ✅');
            } else {
                if (!place?.id) return;
                await updateDoc(doc(db, 'places', place.id), {
                    ...editForm,
                    images: images,
                    imageUrl: images.length > 0 ? images[0] : '',
                    updatedAt: serverTimestamp(),
                });

                // Sync with user's merchantInfo for Profile display if it's the primary (legacy)
                await updateDoc(doc(db, 'users', user.uid), {
                    'merchantInfo.restaurantName': editForm.name,
                    'merchantInfo.description': editForm.description,
                });

                const updatedPlace = { ...place, ...editForm, images, imageUrl: images.length > 0 ? images[0] : '' };
                setPlace(updatedPlace);
                setPlaces(prev => prev.map(p => p.id === updatedPlace.id ? updatedPlace : p));
                setEditing(false);
                if (refreshUser) await refreshUser();
                alert('Informasi berhasil diperbarui! ✅');
            }
        } catch (e) {
            alert('Error: ' + e.message);
        }
    };

    const handleDeleteListing = async () => {
        if (!place?.id) return;
        if (confirm('Apakah Anda yakin ingin menghapus listing ini? Tindakan ini tidak dapat dibatalkan.')) {
            try {
                const { deleteDoc, updateDoc, doc } = await import('firebase/firestore');
                await deleteDoc(doc(db, 'places', place.id));
                const remaining = places.filter(p => p.id !== place.id);
                setPlaces(remaining);
                if (remaining.length > 0) {
                    setPlace(remaining[0]);
                    await updateDoc(doc(db, 'users', user.uid), {
                        'merchantInfo.restaurantName': remaining[0].name,
                        'merchantInfo.description': remaining[0].description || '',
                    });
                } else {
                    setPlace(null);
                    await updateDoc(doc(db, 'users', user.uid), {
                        'merchantInfo.restaurantName': '',
                        'merchantInfo.description': '',
                    });
                }

                if (refreshUser) await refreshUser();
                alert('Listing berhasil dihapus.');
            } catch (e) {
                alert('Gagal menghapus listing: ' + e.message);
            }
        }
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        if (images.length + files.length > 5) {
            alert('Maksimal 5 foto per listing.');
            return;
        }

        const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
        if (validFiles.length < files.length) {
            alert('Beberapa foto ditolak karena ukuran melebihi 5MB.');
        }
        if (!validFiles.length) return;

        setUploading(true);
        try {
            const { uploadImage } = await import('../../lib/firestore');
            const newUrls = await Promise.all(
                validFiles.map(file => uploadImage(file, `merchants/${user.uid}/${Date.now()}_${file.name}`))
            );
            setImages(prev => [...prev, ...newUrls]);
            if (!editForm.imageUrl && newUrls.length > 0) {
                setEditForm(prev => ({ ...prev, imageUrl: newUrls[0] }));
            }
        } catch (err) {
            alert('Gagal mengupload foto: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
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
                    <h2 style={{ fontSize: '20px' }}>Merchant Dashboard</h2>
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
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: 'var(--space-xl)' }}>
                                {[
                                    { label: 'Rating', value: avgRating },
                                    { label: 'Review', value: reviews.length },
                                    { label: 'Bookmark', value: place?.bookmarks || 0 },
                                    { label: 'Views', value: place?.views || 0 }
                                ].map((stat, i) => (
                                    <div key={i} style={{ background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: '12px 4px', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--charcoal)' }}>{stat.value}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{stat.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Certification Status */}
                            <div style={{ background: 'var(--halalqu-green-light)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                <span style={{ fontSize: '32px' }}>🏅</span>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Status Halal</div>
                                    <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--halalqu-green)' }}>
                                        {place?.certBody || application?.certBody || 'Klaim Mandiri'}
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
                                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', justifyContent: 'center' }}>
                                        {images.length > 0 ? images.map((img, i) => (
                                            <div key={i} style={{ width: '100px', height: '100px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' }}>
                                                <img src={img} alt={`Foto ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        )) : (
                                            <div style={{ width: '100px', height: '100px', borderRadius: 'var(--radius-lg)', background: 'var(--halalqu-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', margin: '0 auto', overflow: 'hidden' }}>
                                                🍽️
                                            </div>
                                        )}
                                    </div>
                                    <h3 style={{ marginTop: 'var(--space-md)' }}>{place?.name || 'Merchant'}</h3>
                                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{place?.category || ''}</p>

                                    {!editing && !isAddingNew && (
                                        <>
                                            <div style={{ display: 'inline-block', marginTop: 'var(--space-sm)', padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: '12px', fontWeight: 600, background: checkIsOpen(place) ? '#D1FAE5' : '#FEE2E2', color: checkIsOpen(place) ? '#065F46' : '#991B1B' }}>
                                                {checkIsOpen(place) ? 'Buka Sekarang' : 'Tutup Sekarang'}
                                            </div>

                                            {places.length > 1 && (
                                                <div style={{ marginTop: 'var(--space-md)' }}>
                                                    <select
                                                        value={place?.id || ''}
                                                        onChange={(e) => {
                                                            const selected = places.find(p => p.id === e.target.value);
                                                            if (selected) {
                                                                setPlace(selected);
                                                                setImages(selected.images || (selected.imageUrl ? [selected.imageUrl] : []));
                                                                getRestaurantReviews(selected.id).then(setReviews).catch(console.error);
                                                            }
                                                        }}
                                                        style={{ ...inputStyle, background: 'var(--white)', fontWeight: 600 }}
                                                    >
                                                        {places.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name || 'Cabang Tanpa Nama'}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)' }}>
                                                {place && (
                                                    <button onClick={() => {
                                                        setEditForm({
                                                            name: place.name || '', address: place.address || '', phone: place.phone || '', openTime: place.openTime || '', closeTime: place.closeTime || '', operatingDays: place.operatingDays || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'], isTemporarilyClosed: place.isTemporarilyClosed || false, category: place.category || '', description: place.description || '', imageUrl: place.imageUrl || ''
                                                        });
                                                        setImages(place.images || (place.imageUrl ? [place.imageUrl] : []));
                                                        setEditing(true);
                                                    }} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', background: 'var(--white)', color: 'var(--charcoal)', border: '1px solid var(--border)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                                                        ✏️ Edit Listing
                                                    </button>
                                                )}
                                                <button onClick={() => {
                                                    if (places.length >= 3) {
                                                        alert('Anda telah mencapai batas maksimal 3 listing gratis. Untuk menambah lebih banyak, silakan berlangganan akun premium.');
                                                        return;
                                                    }
                                                    setIsAddingNew(true);
                                                    setEditForm({
                                                        name: '', address: '', phone: '', openTime: '', closeTime: '', operatingDays: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'], isTemporarilyClosed: false, category: '', description: '', imageUrl: ''
                                                    });
                                                    setImages([]);
                                                }} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', background: 'var(--halalqu-green)', color: 'white', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                                                    + Tambah Listing
                                                </button>
                                                {place && places.length > 0 && (
                                                    <button onClick={handleDeleteListing} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', background: '#FEE2E2', color: '#991B1B', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer', marginTop: 'var(--space-md)' }}>
                                                        🗑️ Hapus Listing
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {(editing || isAddingNew) ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Foto Restoran (Maksimal 5 Foto, Max 5MB/Foto)</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                            {images.length < 5 && (
                                                <label style={{ display: 'inline-block', width: 'fit-content', padding: '8px 16px', background: 'var(--halalqu-green-light)', color: 'var(--halalqu-green)', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                                                    {uploading ? '⏳ Mengupload...' : 'Pilih Foto'}
                                                    <input type="file" multiple accept="image/jpeg, image/png, image/webp" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
                                                </label>
                                            )}

                                            {images.length > 0 && (
                                                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                                                    {images.map((img, i) => (
                                                        <div key={i} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0 }}>
                                                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            <button onClick={(e) => { e.preventDefault(); removeImage(i); }} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Nama</label>
                                        <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} />
                                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                            <input value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (!navigator.geolocation) {
                                                        alert('Browser tidak mendukung lokasi');
                                                        return;
                                                    }
                                                    navigator.geolocation.getCurrentPosition(
                                                        (pos) => {
                                                            setEditForm({
                                                                ...editForm,
                                                                lat: pos.coords.latitude,
                                                                lng: pos.coords.longitude
                                                            });
                                                            alert('Titik kordinat berhasil diperbarui sesuai lokasi Anda saat ini ✅');
                                                        },
                                                        (err) => alert('Gagal mendapatkan lokasi. Pastikan GPS aktif.'),
                                                        { timeout: 10000, enableHighAccuracy: true }
                                                    );
                                                }}
                                                style={{
                                                    padding: '10px 14px', borderRadius: 'var(--radius-md)',
                                                    background: editForm.lat && editForm.lng ? 'var(--halalqu-green)' : 'var(--halalqu-green-light)',
                                                    color: editForm.lat && editForm.lng ? 'white' : 'var(--charcoal)',
                                                    border: 'none', fontSize: '18px', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                                title={editForm.lat && editForm.lng ? "Kordinat tersimpan" : "Ambil kordinat saat ini"}
                                            >
                                                📍
                                            </button>
                                        </div>
                                        {editForm.lat && editForm.lng && (
                                            <div style={{ fontSize: '11px', color: 'var(--halalqu-green)', marginTop: '-4px', marginBottom: '8px' }}>
                                                ✓ Titik koordinat tersimpan: {editForm.lat.toFixed(5)}, {editForm.lng.toFixed(5)}
                                            </div>
                                        )}
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
                                            <button onClick={() => { setEditing(false); setIsAddingNew(false); }} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', background: '#991B1B', color: 'white', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
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
