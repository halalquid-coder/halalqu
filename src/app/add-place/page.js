'use client';
import Link from 'next/link';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/UserContext';
import { submitPlace } from '../lib/firestore';
import AddressAutocomplete from '../components/AddressAutocomplete';

const categories = ['🍽 Restaurant', '☕ Cafe', '🍛 Street Food', '🥘 Fine Dining', '🍰 Bakery', '🍕 Western', '🍜 Asian'];
const halalTypes = [
    { value: 'certified', label: '✅ Certified Halal', desc: 'Memiliki sertifikat halal resmi' },
    { value: 'muslim-owned', label: '🕌 Muslim Owned', desc: 'Dimiliki oleh Muslim, tanpa sertifikat resmi' },
    { value: 'halal-ingredients', label: '🥗 Halal Ingredients', desc: 'Bahan halal tapi belum tersertifikasi' },
];

export default function AddPlacePage() {
    const router = useRouter();
    const { user, refreshUser } = useUser();
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [category, setCategory] = useState(null);
    const [halalTypesList, setHalalTypesList] = useState([]);
    const [certBody, setCertBody] = useState('');
    const [certNumber, setCertNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [phone, setPhone] = useState('');
    const [lat, setLat] = useState(null);
    const [lng, setLng] = useState(null);
    const [openTime, setOpenTime] = useState('');
    const [closeTime, setCloseTime] = useState('');
    const [operatingDays, setOperatingDays] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [photos, setPhotos] = useState([null, null, null, null, null]);
    const fileRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

    const allDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const toggleDay = (day) => setOperatingDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);

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

    if (submitted) {
        return (
            <div className="page container" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', textAlign: 'center', gap: 'var(--space-lg)',
                minHeight: '80vh',
            }}>
                <div style={{
                    width: '100px', height: '100px', borderRadius: '50%',
                    background: 'var(--halalqu-green-light)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '48px', animation: 'scaleIn 0.5s ease',
                }}>
                    ✅
                </div>
                <h2>Terkirim!</h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '300px', lineHeight: 1.6 }}>
                    Terima kasih atas kontribusimu! Tim Halalqu akan memverifikasi dalam <strong>1-3 hari kerja</strong>.
                </p>
                <div className="trust-banner" style={{ margin: '0 auto' }}>
                    📬 Kamu akan mendapat notifikasi setelah review selesai
                </div>
                <Link href="/profile/places" className="btn btn-primary">← Kembali ke Tempat Saya</Link>
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
                <div>
                    <h2 style={{ fontSize: '20px' }}>📍 Tambah Tempat Baru</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Bantu sesama Muslim menemukan makanan halal</p>
                </div>
            </div>

            {/* Progress */}
            <div style={{
                display: 'flex', gap: '4px', marginBottom: 'var(--space-xl)',
            }}>
                {[name, address, category !== null, halalTypesList.length > 0].map((done, i) => (
                    <div key={i} style={{
                        flex: 1, height: '4px', borderRadius: '2px',
                        background: done ? 'var(--halalqu-green)' : 'var(--border)',
                        transition: 'background 0.3s ease',
                    }} />
                ))}
            </div>

            {/* Name */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--charcoal)' }}>
                    Nama Tempat <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input type="text" placeholder="Contoh: Warung Halal Barokah" value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                        width: '100%', padding: '14px var(--space-md)', borderRadius: 'var(--radius-md)',
                        border: '1.5px solid var(--border)', fontSize: '15px', background: 'var(--white)',
                        transition: 'border-color 0.2s ease',
                    }}
                />
            </div>

            {/* Address */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--charcoal)' }}>
                    Alamat <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <AddressAutocomplete
                        value={address}
                        onChange={setAddress}
                        onLocationSelect={(loc) => {
                            setLat(loc.lat);
                            setLng(loc.lng);
                        }}
                    />
                    <button type="button"
                        onClick={() => {
                            if (!navigator.geolocation) {
                                alert('Browser tidak mendukung lokasi');
                                return;
                            }
                            navigator.geolocation.getCurrentPosition(
                                (pos) => {
                                    setLat(pos.coords.latitude);
                                    setLng(pos.coords.longitude);
                                    alert('Titik koordinat berhasil diambil ✅');
                                },
                                () => alert('Gagal mendapatkan lokasi. Pastikan GPS aktif.'),
                                { timeout: 10000, enableHighAccuracy: true }
                            );
                        }}
                        style={{
                            padding: '14px', borderRadius: 'var(--radius-md)',
                            background: lat && lng ? 'var(--halalqu-green)' : 'var(--halalqu-green-light)',
                            color: lat && lng ? 'white' : 'var(--charcoal)',
                            border: 'none', fontSize: '18px', cursor: 'pointer',
                        }}
                    >
                        📍
                    </button>
                </div>
                {lat && lng ? (
                    <p style={{ fontSize: '12px', color: 'var(--halalqu-green)', marginTop: '4px', fontWeight: 600 }}>
                        ✓ Koordinat tersimpan: {lat.toFixed(5)}, {lng.toFixed(5)}
                    </p>
                ) : (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Tap 📍 untuk ambil koordinat saat ini
                    </p>
                )}
            </div>

            {/* Phone */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--charcoal)' }}>
                    No. Telepon (opsional)
                </label>
                <input type="tel" placeholder="08xx-xxxx-xxxx" value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                        width: '100%', padding: '14px var(--space-md)', borderRadius: 'var(--radius-md)',
                        border: '1.5px solid var(--border)', fontSize: '15px', background: 'var(--white)',
                    }}
                />
            </div>

            {/* Category */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--charcoal)' }}>
                    Kategori <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                    {categories.map((cat, i) => (
                        <button key={i}
                            className={`chip ${category === i ? 'active' : ''}`}
                            onClick={() => setCategory(i)}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Halal Type */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--charcoal)' }}>
                    Jenis Halal <span style={{ color: 'var(--danger)' }}>*</span> <span style={{fontSize:'12px', fontWeight:'normal', color:'var(--text-muted)'}}>(Bisa pilih lebih dari satu)</span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {halalTypes.map((type) => (
                        <button key={type.value}
                            onClick={() => setHalalTypesList(prev => prev.includes(type.value) ? prev.filter(v => v !== type.value) : [...prev, type.value])}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                                padding: 'var(--space-md)', borderRadius: 'var(--radius-md)',
                                border: `2px solid ${halalTypesList.includes(type.value) ? 'var(--halalqu-green)' : 'var(--border)'}`,
                                background: halalTypesList.includes(type.value) ? 'var(--halalqu-green-light)' : 'var(--white)',
                                cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease',
                            }}>
                            <div style={{
                                width: '20px', height: '20px', borderRadius: '4px',
                                border: `2px solid ${halalTypesList.includes(type.value) ? 'var(--halalqu-green)' : 'var(--light-gray)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                                {halalTypesList.includes(type.value) && (
                                    <div style={{ width: '12px', height: '12px', background: 'var(--halalqu-green)', borderRadius: '2px' }} />
                                )}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '14px' }}>{type.label}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{type.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>

                {halalTypesList.includes('certified') && (
                    <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: '#F9FAFB', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: 'var(--charcoal)' }}>Lembaga Sertifikasi Halal <span style={{ color: 'var(--danger)' }}>*</span></label>
                        <select value={certBody} onChange={e => setCertBody(e.target.value)} style={{ width: '100%', padding: '12px', fontSize: '14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', marginBottom: 'var(--space-sm)' }}>
                            <option value="">Pilih Lembaga...</option>
                            <option value="MUI / BPJPH (Indonesia)">MUI / BPJPH (Indonesia)</option>
                            <option value="JAKIM (Malaysia)">JAKIM (Malaysia)</option>
                            <option value="MUIS (Singapura)">MUIS (Singapura)</option>
                            <option value="CICOT (Thailand)">CICOT (Thailand)</option>
                            <option value="HCE (Eropa)">Halal Certification Europe</option>
                            <option value="AFIC (Australia)">AFIC (Australia)</option>
                            <option value="HFCE (Lainnya)">Lainnya / Global</option>
                        </select>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: 'var(--charcoal)' }}>Nomor Sertifikat (Opsional)</label>
                        <input type="text" value={certNumber} onChange={e => setCertNumber(e.target.value)} placeholder="Contoh: ID12345678" style={{ width: '100%', padding: '12px', fontSize: '14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)' }} />
                    </div>
                )}
            </div>

            {/* Photo Upload — FUNCTIONAL */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--charcoal)' }}>
                    Foto Bukti Rekomendasi (max 5)
                </label>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Upload **Logo** di kotak pertama. (Logo hanya untuk thumbnail dan tidak masuk carousel foto halaman lengkap). Ikuti sisanya sesuai urutan.
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                    {['Logo', 'Restoran', 'Menu', 'Sertifikat', 'Lainnya'].map((label, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                            <input type="file" accept="image/*" ref={fileRefs[i]}
                                onChange={(e) => handlePhotoSelect(i, e)}
                                style={{ display: 'none' }}
                            />
                            {photos[i] ? (
                                <div style={{
                                    width: '72px', height: '72px', borderRadius: 'var(--radius-md)',
                                    overflow: 'hidden', position: 'relative',
                                    border: '2px solid var(--halalqu-green)',
                                }}>
                                    <img src={photos[i].preview} alt={label}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <button onClick={() => removePhoto(i)} style={{
                                        position: 'absolute', top: '2px', right: '2px',
                                        width: '18px', height: '18px', borderRadius: '50%',
                                        background: 'var(--danger)', color: '#FFFFFF',
                                        border: 'none', cursor: 'pointer', fontSize: '10px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>✕</button>
                                </div>
                            ) : (
                                <div onClick={() => fileRefs[i].current?.click()} style={{
                                    width: '72px', height: '72px', borderRadius: 'var(--radius-md)',
                                    border: '2px dashed var(--border)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                                    color: 'var(--text-muted)', cursor: 'pointer',
                                    background: i === 0 ? 'var(--halalqu-green-light)' : 'var(--white)',
                                    transition: 'all 0.2s ease', flexDirection: 'column', gap: '2px',
                                }}>
                                    <span>➕</span>
                                    <span style={{ fontSize: '9px' }}>{label}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Operational Hours & Days */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--charcoal)' }}>
                    🕐 Jam & Hari Operasional (opsional)
                </label>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Jam Buka</label>
                        <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)}
                            style={{ width: '100%', padding: '12px var(--space-md)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)', fontSize: '15px', background: 'var(--white)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Jam Tutup</label>
                        <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)}
                            style={{ width: '100%', padding: '12px var(--space-md)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)', fontSize: '15px', background: 'var(--white)' }} />
                    </div>
                </div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Hari Buka</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {allDays.map(day => (
                        <button key={day} type="button" onClick={() => toggleDay(day)}
                            style={{
                                padding: '8px 14px', borderRadius: 'var(--radius-pill)', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                border: `1.5px solid ${operatingDays.includes(day) ? 'var(--halalqu-green)' : 'var(--border)'}`,
                                background: operatingDays.includes(day) ? 'var(--halalqu-green-light)' : 'var(--white)',
                                color: operatingDays.includes(day) ? 'var(--halalqu-green)' : 'var(--text-secondary)',
                                transition: 'all 0.2s ease',
                            }}>
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--charcoal)' }}>
                    Catatan Tambahan (opsional)
                </label>
                <textarea placeholder="Contoh: Owner Muslim asal Pakistan, sertifikat dari MUI, dll..."
                    value={notes} onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    style={{
                        width: '100%', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)',
                        border: '1.5px solid var(--border)', fontSize: '15px', resize: 'vertical',
                        lineHeight: 1.6, background: 'var(--white)',
                    }}
                />
            </div>

            {/* Info Banner */}
            <div className="trust-banner" style={{ marginBottom: 'var(--space-lg)' }}>
                🕐 Akan diverifikasi oleh tim Halalqu dalam 1-3 hari kerja
            </div>

            {/* Submit */}
            <button className="btn btn-primary btn-full"
                disabled={submitting}
                onClick={async () => {
                    setSubmitting(true);
                    try {
                        // Upload photos to Firebase Storage
                        const { uploadImage } = await import('../lib/firestore');
                        const photoUrls = [];
                        let logoUrl = null;
                        
                        for (let i = 0; i < photos.length; i++) {
                            const photo = photos[i];
                            if (photo) {
                                const url = await uploadImage(photo.file, `places/${user.uid || 'anonymous'}/${Date.now()}_${photo.name}`);
                                if (i === 0) {
                                    logoUrl = url;
                                } else {
                                    photoUrls.push(url);
                                }
                            }
                        }
                        
                        await submitPlace({
                            userId: user.uid || 'anonymous',
                            name, address, phone,
                            category: categories[category] || '',
                            halalType: halalTypesList.join(', ') || '',
                            halalTypes: halalTypesList,
                            certBody: halalTypesList.includes('certified') ? certBody : '',
                            certNumber: halalTypesList.includes('certified') ? certNumber : '',
                            notes,
                            imageUrl: logoUrl || photoUrls[0] || '',
                            images: photoUrls,
                            lat, lng,
                            openTime: openTime || null,
                            closeTime: closeTime || null,
                            operatingDays: operatingDays.length > 0 ? operatingDays : null,
                        });
                    } catch (e) {
                        console.log('Place submission error:', e);
                    }
                    await refreshUser();
                    setSubmitted(true);
                    setSubmitting(false);
                }}
                style={{ padding: '16px', fontSize: '16px', marginBottom: 'var(--space-xl)', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? '⏳ Mengirim...' : '📤 Kirim untuk Verifikasi'}
            </button>
        </div>
    );
}
