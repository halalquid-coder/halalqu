'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/UserContext';
import { submitPayment, getPaymentConfig, getUserPayments, uploadImage } from '../lib/firestore';

export default function CheckoutPage() {
    const { user } = useUser();
    const router = useRouter();
    const [method, setMethod] = useState(null); // 'qris' | 'bank_transfer'
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [proofFile, setProofFile] = useState(null);
    const [proofPreview, setProofPreview] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [existingPayment, setExistingPayment] = useState(null);

    useEffect(() => {
        async function load() {
            try {
                const cfg = await getPaymentConfig();
                setConfig(cfg);

                if (user?.uid) {
                    const payments = await getUserPayments(user.uid);
                    const pending = payments.find(p => p.status === 'pending');
                    if (pending) setExistingPayment(pending);
                }
            } catch (e) { console.warn('Config load error:', e); }
            setLoading(false);
        }
        load();
    }, [user?.uid]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert('Ukuran file maks 5MB'); return; }
        setProofFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setProofPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!user?.isLoggedIn) { router.push('/login'); return; }
        if (!proofFile) { alert('Silakan upload bukti pembayaran'); return; }

        setUploading(true);
        try {
            const proofUrl = await uploadImage(proofFile, `payments/${user.uid}_${Date.now()}`);
            await submitPayment({
                userId: user.uid,
                userName: user.name,
                userEmail: user.email,
                plan: 'premium',
                method,
                amount: config?.price || 0,
                proofUrl,
            });
            setSubmitted(true);
        } catch (e) {
            alert('Gagal mengirim pembayaran: ' + e.message);
        }
        setUploading(false);
    };

    if (!user?.isLoggedIn) {
        return (
            <div className="page container" style={{ paddingTop: 'var(--space-xl)', textAlign: 'center', paddingBottom: '100px' }}>
                <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>🔒</div>
                <h2 style={{ marginBottom: '8px' }}>Login Diperlukan</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>Silakan login terlebih dahulu untuk melakukan pembayaran</p>
                <Link href="/login" className="btn btn-primary" style={{ padding: '12px 32px' }}>Login / Daftar</Link>
            </div>
        );
    }

    if (loading) return <div className="page container" style={{ paddingTop: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat...</div>;

    // Already submitted or has pending payment
    if (submitted || existingPayment) {
        return (
            <div className="page container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: '100px', textAlign: 'center' }}>
                <div style={{
                    background: 'var(--white)', borderRadius: 'var(--radius-xl)',
                    padding: 'var(--space-xl)', boxShadow: 'var(--shadow-md)',
                }}>
                    <div style={{ fontSize: '56px', marginBottom: 'var(--space-md)' }}>⏳</div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', color: 'var(--charcoal)' }}>
                        Menunggu Verifikasi
                    </h2>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-lg)' }}>
                        Bukti pembayaran Anda telah dikirim dan sedang menunggu verifikasi admin.
                        Anda akan mendapat notifikasi setelah pembayaran dikonfirmasi.
                    </p>
                    <div style={{
                        padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)',
                        background: '#FEF3C7', border: '1px solid #F59E0B', marginBottom: 'var(--space-lg)',
                    }}>
                        <p style={{ fontSize: '13px', color: '#92400E', margin: 0 }}>
                            💡 Proses verifikasi biasanya memakan waktu 1x24 jam di hari kerja
                        </p>
                    </div>
                    <Link href="/scan" style={{
                        display: 'inline-block', padding: '12px 32px', borderRadius: 'var(--radius-md)',
                        background: 'var(--halalqu-green)', color: 'white',
                        fontWeight: 700, textDecoration: 'none',
                    }}>← Kembali ke Scan</Link>
                </div>
            </div>
        );
    }

    // No config = admin hasn't set up payment yet
    if (!config) {
        return (
            <div className="page container" style={{ paddingTop: 'var(--space-xl)', textAlign: 'center', paddingBottom: '100px' }}>
                <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>🚧</div>
                <h2>Pembayaran Belum Tersedia</h2>
                <p style={{ color: 'var(--text-muted)' }}>Sistem pembayaran sedang dalam persiapan. Silakan coba lagi nanti.</p>
                <Link href="/pricing" style={{ color: 'var(--halalqu-green)', marginTop: '16px', display: 'inline-block' }}>← Kembali</Link>
            </div>
        );
    }

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: '100px' }}>
            {/* Header */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <Link href="/pricing" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none' }}>← Kembali ke Pricing</Link>
                <h1 style={{ fontSize: '22px', fontWeight: 800, marginTop: '8px', color: 'var(--charcoal)' }}>Checkout Premium</h1>
                {config.price && (
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        Total: <strong style={{ color: 'var(--halalqu-green)', fontSize: '18px' }}>Rp {Number(config.price).toLocaleString('id-ID')}</strong>
                        {config.period && <span> / {config.period}</span>}
                    </p>
                )}
            </div>

            {/* Step 1: Choose Method */}
            {!method && (
                <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Pilih Metode Pembayaran</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {config.qrisUrl && (
                            <button onClick={() => setMethod('qris')} style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)',
                                background: 'var(--white)', border: '2px solid var(--border)',
                                cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.2s',
                            }}>
                                <span style={{ fontSize: '28px' }}>📱</span>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--charcoal)' }}>QRIS</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Scan QR pakai e-wallet (GoPay, OVO, DANA, dll)</div>
                                </div>
                            </button>
                        )}
                        {config.banks && config.banks.length > 0 && (
                            <button onClick={() => setMethod('bank_transfer')} style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)',
                                background: 'var(--white)', border: '2px solid var(--border)',
                                cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.2s',
                            }}>
                                <span style={{ fontSize: '28px' }}>🏦</span>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--charcoal)' }}>Transfer Bank</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Transfer manual ke rekening bank</div>
                                </div>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Step 2: Payment Details + Upload */}
            {method && (
                <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                    <button onClick={() => { setMethod(null); setProofFile(null); setProofPreview(null); }} style={{
                        background: 'none', border: 'none', color: 'var(--text-muted)',
                        fontSize: '13px', cursor: 'pointer', marginBottom: 'var(--space-md)', padding: 0,
                    }}>← Ganti metode</button>

                    {/* QRIS */}
                    {method === 'qris' && config.qrisUrl && (
                        <div style={{
                            background: 'var(--white)', borderRadius: 'var(--radius-xl)',
                            padding: 'var(--space-lg)', textAlign: 'center',
                            boxShadow: 'var(--shadow-sm)', marginBottom: 'var(--space-lg)',
                        }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-md)' }}>Scan QRIS</h3>
                            <div style={{
                                width: '240px', height: '240px', margin: '0 auto var(--space-md)',
                                borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                                border: '2px solid var(--border)',
                            }}>
                                <img src={config.qrisUrl} alt="QRIS" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                Scan QR di atas menggunakan aplikasi e-wallet Anda
                            </p>
                        </div>
                    )}

                    {/* Bank Transfer */}
                    {method === 'bank_transfer' && config.banks && (
                        <div style={{ marginBottom: 'var(--space-lg)' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-md)' }}>Detail Rekening</h3>
                            {config.banks.map((bank, i) => (
                                <div key={i} style={{
                                    background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                                    padding: 'var(--space-md)', marginBottom: '8px',
                                    boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
                                }}>
                                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--charcoal)', marginBottom: '6px' }}>
                                        🏦 {bank.bankName}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>No. Rekening</span>
                                        <span style={{ fontWeight: 700, color: 'var(--charcoal)', fontFamily: 'monospace' }}>{bank.accountNumber}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Atas Nama</span>
                                        <span style={{ fontWeight: 600, color: 'var(--charcoal)' }}>{bank.accountName}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Upload Proof */}
                    <div style={{
                        background: 'var(--white)', borderRadius: 'var(--radius-xl)',
                        padding: 'var(--space-lg)', boxShadow: 'var(--shadow-sm)',
                    }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-md)' }}>📤 Upload Bukti Pembayaran</h3>

                        {!proofPreview ? (
                            <label style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                padding: 'var(--space-xl)', borderRadius: 'var(--radius-lg)',
                                border: '2px dashed var(--border)', cursor: 'pointer',
                                background: 'var(--bg)', transition: 'border-color 0.2s',
                            }}>
                                <span style={{ fontSize: '36px' }}>📸</span>
                                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--charcoal)' }}>
                                    Klik untuk upload screenshot
                                </span>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>JPG, PNG, maks 5MB</span>
                                <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                            </label>
                        ) : (
                            <div>
                                <div style={{
                                    position: 'relative', borderRadius: 'var(--radius-lg)',
                                    overflow: 'hidden', marginBottom: 'var(--space-md)',
                                    border: '2px solid var(--halalqu-green)',
                                }}>
                                    <img src={proofPreview} alt="Bukti" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', background: '#f9f9f9' }} />
                                    <button onClick={() => { setProofFile(null); setProofPreview(null); }} style={{
                                        position: 'absolute', top: '8px', right: '8px',
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none',
                                        fontSize: '14px', cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                    }}>✕</button>
                                </div>
                                <p style={{ fontSize: '12px', color: 'var(--halalqu-green)', fontWeight: 600 }}>✅ Bukti siap dikirim</p>
                            </div>
                        )}

                        <button onClick={handleSubmit} disabled={!proofFile || uploading} style={{
                            width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
                            background: proofFile && !uploading
                                ? 'linear-gradient(135deg, var(--halalqu-green), #34D399)'
                                : 'var(--border)',
                            color: proofFile && !uploading ? 'white' : 'var(--text-muted)',
                            border: 'none', fontWeight: 700, fontSize: '15px', cursor: proofFile ? 'pointer' : 'default',
                            marginTop: 'var(--space-md)', transition: 'all 0.2s',
                        }}>
                            {uploading ? '⏳ Mengirim...' : '🚀 Kirim Bukti Pembayaran'}
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
