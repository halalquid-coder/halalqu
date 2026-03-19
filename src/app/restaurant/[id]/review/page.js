'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { useUser } from '../../../context/UserContext';
import { submitReview } from '../../../lib/firestore';
import { extractRestaurantId } from '../../../lib/utils';

export default function WriteReviewPage() {
    const params = useParams();
    const router = useRouter();
    const { user, refreshUser } = useUser();
    
    // Safety check on getting actual ID
    const placeId = extractRestaurantId(params?.id);

    const [halalRating, setHalalRating] = useState(null);
    const [tasteRating, setTasteRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [photos, setPhotos] = useState([null, null, null]);
    const fileRefs = [useRef(null), useRef(null), useRef(null)];

    const handlePhotoSelect = (index, e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setPhotos(prev => {
                const next = [...prev];
                next[index] = { preview: ev.target.result, name: file.name, file };
                return next;
            });
        };
        reader.readAsDataURL(file);
    };

    const removePhoto = (index) => {
        setPhotos(prev => { const next = [...prev]; next[index] = null; return next; });
        if (fileRefs[index].current) fileRefs[index].current.value = '';
    };

    const halalOptions = [
        { value: 'certified', icon: '📜', label: 'Sertifikat Halal' },
        { value: 'muslim-owned', icon: '🕌', label: 'Pemilik Muslim' },
        { value: 'no-haram', icon: '🚫🐷', label: 'Tidak Mengandung Babi & Haram' },
    ];

    if (submitted) {
        return (
            <div className="page container" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', textAlign: 'center', gap: 'var(--space-lg)',
            }}>
                <div style={{ fontSize: '64px', animation: 'scaleIn 0.5s ease' }}>🎉</div>
                <h2>Terima Kasih!</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Review Anda membantu sesama Muslim menemukan makanan halal yang terpercaya.
                </p>
                <Link href={`/restaurant/${params.id}`} className="btn btn-primary">
                    ← Kembali ke Restoran
                </Link>
            </div>
        );
    }

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
                <button onClick={() => router.back()} style={{
                    width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                    background: 'var(--white)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', cursor: 'pointer',
                }}>←</button>
                <h2>✏️ Tulis Review</h2>
            </div>

            {/* Halal Rating */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h3 style={{ marginBottom: 'var(--space-md)' }}>Rating Kehalalan</h3>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    {halalOptions.map((opt) => (
                        <button key={opt.value}
                            onClick={() => setHalalRating(opt.value)}
                            style={{
                                flex: 1, padding: 'var(--space-md)', borderRadius: 'var(--radius-md)',
                                border: `2px solid ${halalRating === opt.value ? 'var(--halalqu-green)' : 'var(--border)'}`,
                                background: halalRating === opt.value ? 'var(--halalqu-green-light)' : 'var(--white)',
                                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                                alignItems: 'center', gap: '4px', transition: 'all var(--transition-fast)',
                            }}>
                            <span style={{ fontSize: '24px' }}>{opt.icon}</span>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--charcoal)' }}>{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Taste Rating */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h3 style={{ marginBottom: 'var(--space-md)' }}>Rating Rasa</h3>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star}
                            onClick={() => setTasteRating(star)}
                            style={{
                                fontSize: '32px', background: 'none', border: 'none', cursor: 'pointer',
                                transition: 'transform var(--transition-fast)', padding: '4px',
                                transform: tasteRating >= star ? 'scale(1.1)' : 'scale(1)',
                                filter: tasteRating >= star ? 'none' : 'grayscale(1) opacity(0.3)',
                            }}>
                            ⭐
                        </button>
                    ))}
                </div>
            </div>

            {/* Comment */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h3 style={{ marginBottom: 'var(--space-md)' }}>Komentar</h3>
                <textarea
                    value={comment} onChange={(e) => setComment(e.target.value)}
                    placeholder="Ceritakan pengalaman Anda tentang makanan dan kehalalan di sini..."
                    rows={4}
                    style={{
                        width: '100%', padding: 'var(--space-md)',
                        borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)',
                        resize: 'vertical', lineHeight: 1.6, fontSize: '15px',
                        transition: 'border-color var(--transition-fast)',
                    }}
                />
            </div>

            {/* Photo Upload */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h3 style={{ marginBottom: 'var(--space-md)' }}>Upload Foto (Max 3)</h3>
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                    {['Foto 1', 'Foto 2', 'Foto 3'].map((label, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                            <input type="file" accept="image/*" ref={fileRefs[i]}
                                onChange={(e) => handlePhotoSelect(i, e)}
                                style={{ display: 'none' }}
                            />
                            {photos[i] ? (
                                <div style={{
                                    width: '80px', height: '80px', borderRadius: 'var(--radius-md)',
                                    overflow: 'hidden', position: 'relative',
                                    border: '2px solid var(--halalqu-green)',
                                }}>
                                    <img src={photos[i].preview} alt={label}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <button onClick={() => removePhoto(i)} style={{
                                        position: 'absolute', top: '2px', right: '2px',
                                        width: '20px', height: '20px', borderRadius: '50%',
                                        background: 'var(--danger)', color: '#FFFFFF',
                                        border: 'none', cursor: 'pointer', fontSize: '11px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>✕</button>
                                </div>
                            ) : (
                                <div onClick={() => fileRefs[i].current?.click()} style={{
                                    width: '80px', height: '80px', borderRadius: 'var(--radius-md)',
                                    border: '2px dashed var(--border)', display: 'flex',
                                    flexDirection: 'column', alignItems: 'center',
                                    justifyContent: 'center', gap: '4px',
                                    cursor: 'pointer', transition: 'all 0.2s ease',
                                }}>
                                    <span style={{ fontSize: '20px' }}>➕</span>
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>📷</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <button className="btn btn-primary btn-full"
                disabled={submitting}
                onClick={async () => {
                    setSubmitting(true);
                    try {
                        // Upload photos to Firebase Storage
                        const { uploadImage } = await import('../../../lib/firestore');
                        const photoUrls = [];
                        for (const photo of photos.filter(Boolean)) {
                            const url = await uploadImage(photo.file, `reviews/${user.uid || 'anonymous'}/${Date.now()}_${photo.name}`);
                            photoUrls.push(url);
                        }
                        await submitReview({
                            userId: user.uid || 'anonymous',
                            userName: user.name || 'User',
                            placeId: placeId,
                            halalRating,
                            tasteRating,
                            rating: tasteRating,
                            comment,
                            photoUrls,
                            photoCount: photoUrls.length,
                        });
                    } catch (e) {
                        console.log('Review submission error:', e);
                    }
                    // Refresh user stats to update badge counts
                    await refreshUser();
                    setSubmitted(true);
                    setSubmitting(false);
                }}
                style={{ marginBottom: 'var(--space-lg)', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? '⏳ Mengirim...' : '✅ Kirim Review'}
            </button>
        </div>
    );
}
