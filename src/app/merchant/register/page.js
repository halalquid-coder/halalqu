'use client';
import Link from 'next/link';
import { useState, useRef } from 'react';
import { useUser } from '../../context/UserContext';
import { submitMerchantApplication } from '../../lib/firestore';

export default function MerchantRegisterPage() {
    const { user, setMerchantStatus } = useUser();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        restoName: '', address: '', phone: '', category: '',
        certBody: '', certNumber: '',
    });
    const [photos, setPhotos] = useState([null, null, null]);
    const [agreed, setAgreed] = useState(false);
    const [halalQualifications, setHalalQualifications] = useState([false, false, false, false, false]);
    const [detectingAddress, setDetectingAddress] = useState(false);
    const fileRefs = [useRef(null), useRef(null), useRef(null)];

    const handlePhotoSelect = (index, e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setPhotos(prev => {
                const next = [...prev];
                next[index] = { file, preview: ev.target.result, name: file.name };
                return next;
            });
        };
        reader.readAsDataURL(file);
    };

    const removePhoto = (index) => {
        setPhotos(prev => {
            const next = [...prev];
            next[index] = null;
            return next;
        });
        if (fileRefs[index].current) fileRefs[index].current.value = '';
    };

    const categories = ['🍽 Restaurant', '☕ Cafe', '🍛 Street Food', '🥘 Fine Dining', '🍰 Bakery', '🥤 Minuman', '🧁 Dessert'];

    const halalStatements = [
        'Semua bahan baku yang digunakan bersumber halal',
        'Tidak menggunakan alkohol dalam proses memasak',
        'Peralatan masak tidak digunakan bersama makanan non-halal',
        'Proses penyembelihan sesuai syariat Islam',
        'Karyawan memahami prinsip kehalalan produk',
    ];

    const toggleQualification = (index) => {
        setHalalQualifications(prev => {
            const next = [...prev];
            next[index] = !next[index];
            return next;
        });
    };

    const detectAddress = async () => {
        setDetectingAddress(true);
        try {
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
            });
            const { latitude, longitude } = pos.coords;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=id`);
            const data = await res.json();
            if (data.display_name) {
                setFormData(prev => ({ ...prev, address: data.display_name }));
            }
        } catch (e) {
            alert('Gagal mendeteksi lokasi. Pastikan GPS aktif.');
        }
        setDetectingAddress(false);
    };

    const handleSubmit = async () => {
        try {
            await submitMerchantApplication({
                userId: user.uid || 'anonymous',
                restaurantName: formData.restoName,
                address: formData.address,
                phone: formData.phone,
                category: formData.category || '',
                certBody: formData.certBody,
                certNumber: formData.certNumber,
                photoCount: photos.filter(Boolean).length,
                halalQualifications: halalStatements.filter((_, i) => halalQualifications[i]),
            });
        } catch (e) {
            console.log('Firestore not configured yet, using local state');
        }
        setMerchantStatus('pending');
        setStep(4); // success
    };

    // Success
    if (step === 4) {
        return (
            <div className="page container" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', textAlign: 'center', gap: 'var(--space-lg)',
                minHeight: '80vh',
            }}>
                <div style={{
                    width: '100px', height: '100px', borderRadius: '50%',
                    background: '#FFF8E7', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '48px', animation: 'scaleIn 0.5s ease',
                }}>
                    ⏳
                </div>
                <h2>Pendaftaran Terkirim!</h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '300px', lineHeight: 1.6 }}>
                    Tim Halalqu akan memverifikasi informasi restoran kamu dalam <strong>1-3 hari kerja</strong>.
                </p>
                <div className="trust-banner" style={{ margin: '0 auto', maxWidth: '300px' }}>
                    📬 Kamu akan mendapat notifikasi setelah verifikasi selesai
                </div>
                <Link href="/profile" className="btn btn-primary">← Kembali ke Profil</Link>
            </div>
        );
    }

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <Link href="/profile" style={{
                    width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                    background: 'var(--white)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', textDecoration: 'none',
                }}>←</Link>
                <div>
                    <h2 style={{ fontSize: '20px' }}>🏪 Daftar Merchant</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Kelola restoran kamu di Halalqu</p>
                </div>
            </div>

            {/* Step Progress */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: 'var(--space-xl)' }}>
                {[1, 2, 3].map(i => (
                    <div key={i} style={{
                        flex: 1, height: '4px', borderRadius: '2px',
                        background: i <= step ? 'var(--halalqu-green)' : 'var(--border)',
                        transition: 'background 0.3s ease',
                    }} />
                ))}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
                {['Info Restoran', 'Sertifikasi', 'Konfirmasi'].map((label, i) => (
                    <div key={i} style={{
                        flex: 1, textAlign: 'center', fontSize: '12px', fontWeight: 600,
                        color: i + 1 <= step ? 'var(--halalqu-green)' : 'var(--text-muted)',
                    }}>
                        {label}
                    </div>
                ))}
            </div>

            {/* Step 1: Restaurant Info */}
            {step === 1 && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ marginBottom: 'var(--space-lg)' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                            Nama Restoran <span style={{ color: 'var(--danger)' }}>*</span>
                        </label>
                        <input type="text" placeholder="Contoh: Warung Halal Barokah" value={formData.restoName}
                            onChange={e => setFormData({ ...formData, restoName: e.target.value })}
                            style={{
                                width: '100%', padding: '14px var(--space-md)', borderRadius: 'var(--radius-md)',
                                border: '1.5px solid var(--border)', fontSize: '15px', background: 'var(--white)',
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: 'var(--space-lg)' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                            Alamat <span style={{ color: 'var(--danger)' }}>*</span>
                        </label>
                        <input type="text" placeholder="Jl. Contoh No. 123" value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            style={{
                                width: '100%', padding: '14px var(--space-md)', borderRadius: 'var(--radius-md)',
                                border: '1.5px solid var(--border)', fontSize: '15px', background: 'var(--white)',
                            }}
                        />
                        <button type="button" onClick={detectAddress} disabled={detectingAddress} style={{
                            marginTop: '8px', padding: '8px 16px', borderRadius: 'var(--radius-md)',
                            background: 'var(--halalqu-green-light)', border: '1px solid var(--halalqu-green)',
                            color: 'var(--halalqu-green)', fontSize: '12px', fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                        }}>
                            {detectingAddress ? '⏳ Mendeteksi...' : '📍 Deteksi Lokasi Otomatis'}
                        </button>
                    </div>

                    <div style={{ marginBottom: 'var(--space-lg)' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                            No. Telepon Restoran <span style={{ color: 'var(--danger)' }}>*</span>
                        </label>
                        <input type="tel" placeholder="08xx-xxxx-xxxx" value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            style={{
                                width: '100%', padding: '14px var(--space-md)', borderRadius: 'var(--radius-md)',
                                border: '1.5px solid var(--border)', fontSize: '15px', background: 'var(--white)',
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: 'var(--space-lg)' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                            Kategori <span style={{ color: 'var(--danger)' }}>*</span>
                        </label>
                        <select value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            style={{
                                width: '100%', padding: '14px var(--space-md)', borderRadius: 'var(--radius-md)',
                                border: '1.5px solid var(--border)', fontSize: '15px', background: 'var(--white)',
                                cursor: 'pointer',
                            }}>
                            <option value="">Pilih kategori...</option>
                            {categories.map((cat, i) => (
                                <option key={i} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Halal Qualifications */}
                    <div style={{ marginBottom: 'var(--space-xl)' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                            Kualifikasi Kehalalan <span style={{ color: 'var(--danger)' }}>*</span>
                        </label>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                            Centang pernyataan yang sesuai dengan restoran Anda
                        </p>
                        {halalStatements.map((stmt, i) => (
                            <label key={i} onClick={() => toggleQualification(i)} style={{
                                display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)',
                                padding: '12px var(--space-md)', marginBottom: '8px',
                                background: halalQualifications[i] ? 'var(--halalqu-green-light)' : 'var(--white)',
                                borderRadius: 'var(--radius-md)',
                                border: `1.5px solid ${halalQualifications[i] ? 'var(--halalqu-green)' : 'var(--border)'}`,
                                cursor: 'pointer', transition: 'all 0.2s ease',
                            }}>
                                <div style={{
                                    width: '20px', height: '20px', borderRadius: '4px',
                                    border: `2px solid ${halalQualifications[i] ? 'var(--halalqu-green)' : 'var(--light-gray)'}`,
                                    background: halalQualifications[i] ? 'var(--halalqu-green)' : 'var(--white)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0, transition: 'all 0.2s ease', marginTop: '1px',
                                }}>
                                    {halalQualifications[i] && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
                                </div>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    {stmt}
                                </span>
                            </label>
                        ))}
                    </div>

                    <button className="btn btn-primary btn-full" onClick={() => setStep(2)}
                        style={{ padding: '16px', fontSize: '16px' }}>
                        Lanjut → Sertifikasi
                    </button>
                </div>
            )}

            {/* Step 2: Certification */}
            {step === 2 && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    <div style={{
                        background: 'var(--halalqu-green-light)', borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                            <span style={{ fontSize: '24px' }}>📋</span>
                            <h3 style={{ fontSize: '16px', color: 'var(--halalqu-green)' }}>Sertifikat Halal</h3>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            Upload sertifikat halal dari MUI/BPJPH untuk mendapat badge "Certified". Jika belum punya, kamu tetap bisa mendaftar sebagai Muslim-Owned.
                        </p>
                    </div>

                    <div style={{ marginBottom: 'var(--space-lg)' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                            Lembaga Sertifikasi
                        </label>
                        <select value={formData.certBody} onChange={e => setFormData({ ...formData, certBody: e.target.value })}
                            style={{
                                width: '100%', padding: '14px var(--space-md)', borderRadius: 'var(--radius-md)',
                                border: '1.5px solid var(--border)', fontSize: '15px', background: 'var(--white)',
                                cursor: 'pointer',
                            }}>
                            <option value="">Pilih lembaga...</option>
                            <option value="mui">MUI</option>
                            <option value="bpjph">BPJPH</option>
                            <option value="other">Lainnya</option>
                            <option value="none">Belum punya sertifikat</option>
                        </select>
                    </div>

                    {formData.certBody && formData.certBody !== 'none' && (
                        <div style={{ marginBottom: 'var(--space-lg)' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                                Nomor Sertifikat
                            </label>
                            <input type="text" placeholder="Contoh: LPPOM-001234" value={formData.certNumber}
                                onChange={e => setFormData({ ...formData, certNumber: e.target.value })}
                                style={{
                                    width: '100%', padding: '14px var(--space-md)', borderRadius: 'var(--radius-md)',
                                    border: '1.5px solid var(--border)', fontSize: '15px', background: 'var(--white)',
                                }}
                            />
                        </div>
                    )}

                    {/* Photo upload */}
                    <div style={{ marginBottom: 'var(--space-xl)' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                            Upload Foto Sertifikat & Foto Restoran
                        </label>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                            {['📋 Sertifikat', '🏪 Resto', '🍽 Menu'].map((label, i) => (
                                <div key={i} style={{ flex: 1, position: 'relative' }}>
                                    <input
                                        type="file" accept="image/*"
                                        ref={fileRefs[i]}
                                        onChange={(e) => handlePhotoSelect(i, e)}
                                        style={{ display: 'none' }}
                                    />
                                    {photos[i] ? (
                                        <div style={{
                                            height: '80px', borderRadius: 'var(--radius-md)',
                                            overflow: 'hidden', position: 'relative',
                                            border: '2px solid var(--halalqu-green)',
                                        }}>
                                            <img src={photos[i].preview} alt={label}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                            <button onClick={() => removePhoto(i)} style={{
                                                position: 'absolute', top: '4px', right: '4px',
                                                width: '22px', height: '22px', borderRadius: '50%',
                                                background: 'var(--danger)', color: 'var(--white)',
                                                border: 'none', cursor: 'pointer',
                                                fontSize: '12px', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                            }}>✕</button>
                                            <div style={{
                                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                                background: 'rgba(0,0,0,0.5)', color: 'var(--white)',
                                                fontSize: '10px', padding: '2px 6px', textAlign: 'center',
                                            }}>{label}</div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => fileRefs[i].current?.click()}
                                            style={{
                                                height: '80px', borderRadius: 'var(--radius-md)',
                                                border: '2px dashed var(--border)', display: 'flex',
                                                flexDirection: 'column', alignItems: 'center',
                                                justifyContent: 'center', gap: '4px',
                                                cursor: 'pointer', background: 'var(--white)',
                                                transition: 'all 0.2s ease',
                                            }}>
                                            <span style={{ fontSize: '20px' }}>➕</span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                        <button className="btn btn-outline" onClick={() => setStep(1)}
                            style={{ padding: '14px 24px' }}>
                            ← Kembali
                        </button>
                        <button className="btn btn-primary btn-full" onClick={() => setStep(3)}
                            style={{ padding: '14px', fontSize: '16px' }}>
                            Lanjut → Konfirmasi
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    <div style={{
                        background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-lg)', boxShadow: 'var(--shadow-sm)',
                        marginBottom: 'var(--space-xl)',
                    }}>
                        <h3 style={{ fontSize: '16px', marginBottom: 'var(--space-lg)' }}>📋 Ringkasan Pendaftaran</h3>

                        {[
                            { label: 'Nama Restoran', value: formData.restoName || '-' },
                            { label: 'Alamat', value: formData.address || '-' },
                            { label: 'Telepon', value: formData.phone || '-' },
                            { label: 'Kategori', value: formData.category || '-' },
                            { label: 'Sertifikasi', value: formData.certBody === 'none' ? 'Muslim Owned' : formData.certBody?.toUpperCase() || '-' },
                            { label: 'Kualifikasi Halal', value: `${halalQualifications.filter(Boolean).length}/5 terpenuhi` },
                        ].map((item, i) => (
                            <div key={i} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '10px 0', borderBottom: '1px solid var(--border)',
                            }}>
                                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{item.label}</span>
                                <span style={{ fontSize: '14px', fontWeight: 500 }}>{item.value}</span>
                            </div>
                        ))}

                        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                            <span style={{
                                padding: '4px 12px', borderRadius: 'var(--radius-pill)',
                                fontSize: '12px', fontWeight: 600,
                                background: 'var(--halalqu-green-light)', color: 'var(--halalqu-green)',
                            }}>
                                Pemilik: {user.name}
                            </span>
                            <span style={{
                                padding: '4px 12px', borderRadius: 'var(--radius-pill)',
                                fontSize: '12px', fontWeight: 600,
                                background: '#FFF8E7', color: '#D4920A',
                            }}>
                                ⏳ Perlu Verifikasi
                            </span>
                        </div>
                    </div>

                    <label onClick={() => setAgreed(!agreed)} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)',
                        padding: 'var(--space-md)', marginBottom: 'var(--space-lg)',
                        background: agreed ? 'var(--halalqu-green-light)' : 'var(--white)',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${agreed ? 'var(--halalqu-green)' : 'var(--border)'}`,
                        cursor: 'pointer', transition: 'all 0.2s ease',
                    }}>
                        <div style={{
                            width: '22px', height: '22px', borderRadius: '6px',
                            border: `2px solid ${agreed ? 'var(--halalqu-green)' : 'var(--light-gray)'}`,
                            background: agreed ? 'var(--halalqu-green)' : 'var(--white)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, transition: 'all 0.2s ease', marginTop: '1px',
                        }}>
                            {agreed && <span style={{ color: 'var(--white)', fontSize: '14px', lineHeight: 1 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Dengan mendaftar, saya menyetujui <strong style={{ color: 'var(--halalqu-green)' }}>Syarat & Ketentuan</strong> dan <strong style={{ color: 'var(--halalqu-green)' }}>Kebijakan Privasi</strong> Merchant Halalqu.
                        </span>
                    </label>

                    <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                        <button className="btn btn-outline" onClick={() => setStep(2)}
                            style={{ padding: '14px 24px' }}>
                            ← Kembali
                        </button>
                        <button className="btn btn-primary btn-full" onClick={handleSubmit}
                            disabled={!agreed}
                            style={{
                                padding: '16px', fontSize: '16px',
                                opacity: agreed ? 1 : 0.5,
                                cursor: agreed ? 'pointer' : 'not-allowed',
                            }}>
                            📤 Kirim Pendaftaran
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
