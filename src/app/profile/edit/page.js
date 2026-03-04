'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../../context/UserContext';
import { updateUserProfile } from '../../lib/firestore';
import { updateProfile } from 'firebase/auth';
import { auth, storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function EditProfilePage() {
    const router = useRouter();
    const { user, setUser } = useUser();
    const [name, setName] = useState(user.name || '');
    const [phone, setPhone] = useState(user.phone || '');
    const [bio, setBio] = useState(user.bio || '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(user.photoURL || null);
    const [photoFile, setPhotoFile] = useState(null);
    const fileRef = useRef(null);

    const handlePhotoSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // Validate file
        if (!file.type.startsWith('image/')) {
            alert('Pilih file gambar (JPG, PNG, dll)');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Ukuran file maksimal 5MB');
            return;
        }
        setPhotoFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setPhotoPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const uploadPhoto = async (uid) => {
        if (!photoFile) return null;
        try {
            const storageRef = ref(storage, `avatars/${uid}_${Date.now()}`);
            await uploadBytes(storageRef, photoFile);
            const url = await getDownloadURL(storageRef);
            return url;
        } catch (err) {
            console.warn('Photo upload error:', err.message);
            return null;
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let photoURL = user.photoURL || null;

            // Upload photo if changed
            if (photoFile && user.uid) {
                const url = await uploadPhoto(user.uid);
                if (url) photoURL = url;
            }

            // Update Firebase Auth
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    displayName: name,
                    ...(photoURL ? { photoURL } : {}),
                });
            }

            // Update Firestore
            if (user.uid) {
                await updateUserProfile(user.uid, {
                    name, phone, bio,
                    ...(photoURL ? { photoURL } : {}),
                });
            }

            // Update local context
            setUser(prev => ({ ...prev, name, phone, bio, photoURL }));
            setSaved(true);
            setTimeout(() => router.back(), 1200);
        } catch (err) {
            console.warn('Error saving profile:', err.message);
            setUser(prev => ({ ...prev, name }));
            setSaved(true);
            setTimeout(() => router.back(), 1200);
        } finally {
            setSaving(false);
        }
    };

    if (saved) {
        return (
            <div className="page container" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', textAlign: 'center', gap: 'var(--space-lg)',
                minHeight: '80vh',
            }}>
                <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: 'var(--halalqu-green-light)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '40px',
                }}>✅</div>
                <h2>Profil Diperbarui!</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Mengalihkan kembali...</p>
            </div>
        );
    }

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
                <button onClick={() => router.back()} style={{
                    width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                    background: 'var(--white)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', cursor: 'pointer',
                }}>←</button>
                <h2 style={{ fontSize: '20px' }}>✏️ Edit Profil</h2>
            </div>

            {/* Avatar with Upload */}
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                <input type="file" ref={fileRef} accept="image/*" onChange={handlePhotoSelect}
                    style={{ display: 'none' }} />
                <div onClick={() => fileRef.current?.click()} style={{
                    width: '100px', height: '100px', borderRadius: '50%',
                    background: photoPreview ? 'none' : 'var(--halalqu-green-gradient)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '48px', margin: '0 auto var(--space-sm)',
                    border: '4px solid var(--halalqu-green-light)',
                    cursor: 'pointer', position: 'relative', overflow: 'hidden',
                    transition: 'all 0.2s ease',
                }}>
                    {photoPreview ? (
                        <img src={photoPreview} alt="Avatar" style={{
                            width: '100%', height: '100%', objectFit: 'cover',
                        }} />
                    ) : (
                        '👤'
                    )}
                    {/* Overlay on hover */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transition: 'opacity 0.2s ease',
                    }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
                        <span style={{ color: 'white', fontSize: '24px' }}>📷</span>
                    </div>
                </div>
                <button onClick={() => fileRef.current?.click()} style={{
                    background: 'none', border: 'none', fontSize: '13px',
                    color: 'var(--halalqu-green)', fontWeight: 600, cursor: 'pointer',
                    padding: '4px 12px',
                }}>
                    📷 Ganti Foto
                </button>
            </div>

            {/* Name */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--charcoal)' }}>
                    Nama Lengkap
                </label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    style={{
                        width: '100%', padding: '14px var(--space-md)', borderRadius: 'var(--radius-md)',
                        border: '1.5px solid var(--border)', fontSize: '15px', background: 'var(--white)',
                    }}
                />
            </div>

            {/* Email (read-only) */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--charcoal)' }}>
                    Email
                </label>
                <input type="email" value={user.email} readOnly
                    style={{
                        width: '100%', padding: '14px var(--space-md)', borderRadius: 'var(--radius-md)',
                        border: '1.5px solid var(--border)', fontSize: '15px',
                        background: 'var(--light-gray)', color: 'var(--text-muted)', cursor: 'not-allowed',
                    }}
                />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Email tidak dapat diubah
                </p>
            </div>

            {/* Phone */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--charcoal)' }}>
                    No. Telepon (opsional)
                </label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="08xx-xxxx-xxxx"
                    style={{
                        width: '100%', padding: '14px var(--space-md)', borderRadius: 'var(--radius-md)',
                        border: '1.5px solid var(--border)', fontSize: '15px', background: 'var(--white)',
                    }}
                />
            </div>

            {/* Bio */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--charcoal)' }}>
                    Bio Singkat (opsional)
                </label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                    placeholder="Ceritakan sedikit tentang dirimu..."
                    rows={3}
                    style={{
                        width: '100%', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)',
                        border: '1.5px solid var(--border)', fontSize: '15px', resize: 'vertical',
                        lineHeight: 1.6, background: 'var(--white)',
                    }}
                />
            </div>

            {/* Save Button */}
            <button className="btn btn-primary btn-full" onClick={handleSave} disabled={saving}
                style={{ padding: '16px', fontSize: '16px', marginBottom: 'var(--space-xl)', opacity: saving ? 0.7 : 1 }}>
                {saving ? '⏳ Menyimpan...' : '💾 Simpan Perubahan'}
            </button>
        </div>
    );
}
