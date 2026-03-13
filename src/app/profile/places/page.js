'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useUser } from '../../context/UserContext';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';

const statusColors = {
    approved: { bg: '#D1FAE5', color: '#065F46', label: '✅ Disetujui' },
    pending: { bg: '#FEF3C7', color: '#B45309', label: '🟡 Pending (Menunggu Review)' },
    rejected: { bg: '#FEE2E2', color: '#991B1B', label: '❌ Ditolak' },
};

const CATEGORIES = ['🍽️ Restoran', '☕ Cafe', '🍕 Pizza & Fast Food', '🌱 Vegetarian', '🦞 Seafood', '🥐 Bakery', '🍜 Asian', '🥩 BBQ & Grill', '🍨 Dessert', '🛒 Minimarket'];
const MAX_PHOTOS = 5;

export default function MyPlacesPage() {
    const { user } = useUser();
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [existingImages, setExistingImages] = useState([]);
    const [newFiles, setNewFiles] = useState([]);
    const [newPreviews, setNewPreviews] = useState([]);
    const [saving, setSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!user.isLoggedIn || !user.uid) { setLoading(false); return; }
        loadPlaces();
    }, [user.uid, user.isLoggedIn]);

    const loadPlaces = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'places'), where('submittedBy', '==', user.uid));
            const snap = await getDocs(q);
            const data = snap.docs.map(d => {
                const val = d.data();
                return {
                    id: d.id, ...val,
                    photo: val.imageUrl || (val.images?.[0]) || (val.photos?.[0]) || null,
                };
            });
            setPlaces(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
        } catch (e) {
            console.error('Failed to load places:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (place) => {
        const imgs = place.images || (place.photos) || (place.imageUrl ? [place.imageUrl] : []);
        setEditingId(place.id);
        setEditForm({
            name: place.name || '',
            category: place.category || '',
            address: place.address || '',
            phone: place.phone || '',
            description: place.description || '',
            certBody: place.certBody || '',
        });
        setExistingImages(imgs);
        setNewFiles([]);
        setNewPreviews([]);
    };

    const handleAddPhotos = (e) => {
        const files = Array.from(e.target.files);
        const totalAfter = existingImages.length + newFiles.length + files.length;
        if (totalAfter > MAX_PHOTOS) {
            alert(`Maksimal ${MAX_PHOTOS} foto. Kamu bisa menambah ${MAX_PHOTOS - existingImages.length - newFiles.length} foto lagi.`);
            return;
        }
        const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
        if (validFiles.length < files.length) alert('Beberapa foto melebihi 5MB dan diabaikan.');
        setNewFiles(prev => [...prev, ...validFiles]);
        validFiles.forEach(f => {
            const reader = new FileReader();
            reader.onload = ev => setNewPreviews(prev => [...prev, ev.target.result]);
            reader.readAsDataURL(f);
        });
        e.target.value = '';
    };

    const removeExistingImage = (idx) => setExistingImages(prev => prev.filter((_, i) => i !== idx));
    const removeNewImage = (idx) => {
        setNewFiles(prev => prev.filter((_, i) => i !== idx));
        setNewPreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSave = async () => {
        if (!editingId || !editForm.name) return;
        setSaving(true);
        try {
            let uploadedUrls = [];
            if (newFiles.length > 0) {
                setUploadProgress(`Mengupload foto 0/${newFiles.length}...`);
                for (let i = 0; i < newFiles.length; i++) {
                    setUploadProgress(`Mengupload foto ${i + 1}/${newFiles.length}...`);
                    const storageRef = ref(storage, `places/${editingId}/${Date.now()}_${newFiles[i].name}`);
                    const snap = await uploadBytes(storageRef, newFiles[i]);
                    const url = await getDownloadURL(snap.ref);
                    uploadedUrls.push(url);
                }
            }
            setUploadProgress('Menyimpan data...');
            const allImages = [...existingImages, ...uploadedUrls];
            await updateDoc(doc(db, 'places', editingId), {
                ...editForm,
                images: allImages,
                imageUrl: allImages[0] || '',
                updatedAt: serverTimestamp(),
            });
            setEditingId(null);
            setEditForm({});
            setExistingImages([]);
            setNewFiles([]);
            setNewPreviews([]);
            setUploadProgress('');
            await loadPlaces();
            alert('✅ Rekomendasi berhasil diperbarui!');
        } catch (e) {
            alert('Gagal menyimpan: ' + e.message);
        } finally {
            setSaving(false);
            setUploadProgress('');
        }
    };

    const formatDate = (ts) => {
        if (!ts) return '-';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const inputStyle = {
        width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
        border: '1.5px solid var(--border)', fontSize: '14px',
        fontFamily: 'inherit', background: 'var(--white)',
        boxSizing: 'border-box',
    };

    const totalPhotos = existingImages.length + newFiles.length;

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <Link href="/profile" style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--white)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', textDecoration: 'none' }}>←</Link>
                    <div>
                        <h2 style={{ fontSize: '20px' }}>Rekomendasi Saya</h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{places.length} tempat ditambahkan</p>
                    </div>
                </div>
                <Link href="/add-place" className="btn btn-primary" style={{ padding: '10px 16px', fontSize: '13px' }}>+ Tambah</Link>
            </div>

            {loading ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>⏳ Memuat tempat...</p>
            ) : places.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: 'var(--space-2xl)', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>📍</div>
                    <p>Belum ada tempat yang kamu rekomendasikan.</p>
                    <Link href="/add-place" className="btn btn-primary" style={{ display: 'inline-block', marginTop: 'var(--space-lg)', padding: '12px 24px' }}>Tambah Sekarang</Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {places.map(place => {
                        const sc = statusColors[place.status] || statusColors.pending;
                        const isEditing = editingId === place.id;

                        return (
                            <div key={place.id} style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                                {/* View Mode */}
                                {!isEditing && (
                                    <div style={{ padding: 'var(--space-md)' }}>
                                        <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>
                                            {place.photo ? (
                                                <div style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0 }}>
                                                    <img src={place.photo} alt={place.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                            ) : (
                                                <div style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-md)', background: 'var(--halalqu-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>🍽️</div>
                                            )}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{place.name}</div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                    <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-pill)', fontSize: '11px', fontWeight: 600, background: sc.bg, color: sc.color }}>{sc.label}</span>
                                                    {place.category && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{place.category}</span>}
                                                </div>
                                                {place.address && <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {place.address}</div>}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--border)' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📅 {formatDate(place.createdAt)}</span>
                                            {place.status !== 'rejected' && (
                                                <button onClick={() => handleEdit(place)} style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--halalqu-green-light)', color: 'var(--halalqu-green)', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                                                    ✏️ Edit
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Edit Mode */}
                                {isEditing && (
                                    <div style={{ padding: 'var(--space-md)', background: '#F8FFF8', borderTop: '3px solid var(--halalqu-green)' }}>
                                        <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: 'var(--space-md)', color: 'var(--halalqu-green)' }}>✏️ Edit Rekomendasi</div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                            {/* Foto Section */}
                                            <div>
                                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                                                    Foto ({totalPhotos}/{MAX_PHOTOS})
                                                </label>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                                                    {/* Existing images */}
                                                    {existingImages.map((url, i) => (
                                                        <div key={`ex-${i}`} style={{ position: 'relative', width: '72px', height: '72px' }}>
                                                            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)' }} />
                                                            <button onClick={() => removeExistingImage(i)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', background: '#ef4444', color: 'white', border: 'none', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>×</button>
                                                        </div>
                                                    ))}
                                                    {/* New image previews */}
                                                    {newPreviews.map((src, i) => (
                                                        <div key={`new-${i}`} style={{ position: 'relative', width: '72px', height: '72px' }}>
                                                            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--halalqu-green)', opacity: 0.85 }} />
                                                            <button onClick={() => removeNewImage(i)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', background: '#ef4444', color: 'white', border: 'none', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>×</button>
                                                            <div style={{ position: 'absolute', bottom: 2, left: 2, background: 'rgba(46,155,90,0.85)', borderRadius: '4px', fontSize: '9px', color: 'white', padding: '1px 4px', fontWeight: 600 }}>Baru</div>
                                                        </div>
                                                    ))}
                                                    {/* Add photo button */}
                                                    {totalPhotos < MAX_PHOTOS && (
                                                        <button onClick={() => fileInputRef.current?.click()} style={{ width: '72px', height: '72px', borderRadius: 'var(--radius-md)', border: '2px dashed var(--border)', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '2px' }}>
                                                            <span style={{ fontSize: '22px' }}>📷</span>
                                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Tambah</span>
                                                        </button>
                                                    )}
                                                </div>
                                                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleAddPhotos} style={{ display: 'none' }} />
                                                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Maks {MAX_PHOTOS} foto, tiap foto maks 5MB</p>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Nama Tempat *</label>
                                                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} placeholder="Nama tempat" />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Kategori</label>
                                                <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} style={inputStyle}>
                                                    <option value="">Pilih kategori</option>
                                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Alamat</label>
                                                <input value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} style={inputStyle} placeholder="Alamat lengkap" />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Nomor Telepon</label>
                                                <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} style={inputStyle} placeholder="08xx-xxxx-xxxx" />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Sertifikasi Halal</label>
                                                <input value={editForm.certBody} onChange={e => setEditForm({ ...editForm, certBody: e.target.value })} style={inputStyle} placeholder="cth: MUI, BPJPH, Klaim Mandiri" />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Deskripsi</label>
                                                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Ceritakan tentang tempat ini..." />
                                            </div>
                                        </div>

                                        {uploadProgress && (
                                            <div style={{ marginTop: 'var(--space-sm)', padding: '8px 12px', background: 'var(--halalqu-green-light)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--halalqu-green)', fontWeight: 600 }}>
                                                ⏳ {uploadProgress}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                                            <button onClick={handleSave} disabled={saving || !editForm.name} style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-md)', background: saving ? 'var(--halalqu-green-light)' : 'var(--halalqu-green)', color: saving ? 'var(--halalqu-green)' : 'white', border: 'none', fontWeight: 600, fontSize: '14px', cursor: saving ? 'wait' : 'pointer' }}>
                                                {saving ? '⏳ Menyimpan...' : '💾 Simpan Perubahan'}
                                            </button>
                                            <button onClick={() => { setEditingId(null); setEditForm({}); setExistingImages([]); setNewFiles([]); setNewPreviews([]); }} disabled={saving} style={{ padding: '12px 20px', borderRadius: 'var(--radius-md)', background: 'var(--white)', border: '1.5px solid var(--border)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                                Batal
                                            </button>
                                        </div>
                                        {place.status === 'pending' && (
                                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
                                                ℹ️ Perubahan akan direview ulang oleh admin setelah disimpan.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
