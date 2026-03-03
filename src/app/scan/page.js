'use client';
import { useState, useRef, useEffect } from 'react';

const sampleResults = [
    { name: 'Gelatin', status: 'warning', note: 'Bisa dari babi atau sapi — perlu konfirmasi sumber' },
    { name: 'Tepung Terigu', status: 'safe', note: 'Bahan aman' },
    { name: 'Mirin', status: 'danger', note: 'Mengandung alkohol — termasuk bahan non-halal' },
    { name: 'Gula', status: 'safe', note: 'Bahan aman' },
    { name: 'Lesitin (E322)', status: 'warning', note: 'Bisa dari kedelai (halal) atau telur (halal), tapi perlu dicek sumber' },
    { name: 'Pewarna Karmin (E120)', status: 'danger', note: 'Berasal dari serangga — mayoritas ulama menganggap haram' },
];

const statusConfig = {
    safe: { icon: '✅', label: 'Aman', color: 'var(--halalqu-green)', bg: 'var(--halalqu-green-light)' },
    warning: { icon: '⚠️', label: 'Meragukan', color: '#D4920A', bg: '#FFF8E7' },
    danger: { icon: '❌', label: 'Non-Halal', color: 'var(--danger)', bg: '#FDE8E8' },
};

export default function ScanPage() {
    const [isScanning, setIsScanning] = useState(false);
    const [results, setResults] = useState(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const startCamera = async () => {
        try {
            setCameraError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraActive(true);
        } catch (err) {
            setCameraError('Tidak bisa mengakses kamera. Pastikan izin kamera sudah diberikan.');
            setCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    };

    useEffect(() => {
        return () => stopCamera();
    }, []);

    const handleScan = (type) => {
        setIsScanning(true);
        setTimeout(() => {
            setIsScanning(false);
            stopCamera();
            setResults(sampleResults);
        }, 2500);
    };

    const resetScan = () => {
        setResults(null);
        setCameraActive(false);
        setCameraError(null);
    };

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)' }}>
            <h1 style={{ marginBottom: 'var(--space-sm)' }}>📷 Scan & Check</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: 'var(--space-xl)' }}>
                Pindai menu atau kemasan produk untuk mendeteksi bahan kritis non-halal
            </p>

            {/* Scanner Area */}
            <div style={{
                width: '100%', aspectRatio: '4/3', borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #3D444B 100%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 'var(--space-md)', position: 'relative',
                overflow: 'hidden', marginBottom: 'var(--space-xl)',
            }}>
                {/* Camera Video */}
                {cameraActive && (
                    <video ref={videoRef} autoPlay playsInline muted style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        objectFit: 'cover',
                    }} />
                )}

                {/* Corner frame */}
                <div style={{
                    position: 'absolute', width: '70%', height: '60%',
                    border: '2px dashed rgba(255,255,255,0.3)', borderRadius: 'var(--radius-lg)',
                    zIndex: 2,
                }} />

                {/* Scan line animation */}
                {isScanning && (
                    <div style={{
                        position: 'absolute', width: '70%', height: '2px',
                        background: 'var(--halalqu-green)', boxShadow: '0 0 20px var(--halalqu-green)',
                        animation: 'scanLine 2s ease-in-out infinite', zIndex: 3,
                    }} />
                )}

                {!cameraActive && !results && (
                    <>
                        <span style={{ fontSize: '48px', position: 'relative', zIndex: 1 }}>📷</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', position: 'relative', zIndex: 1 }}>
                            Arahkan kamera ke menu atau kemasan
                        </span>
                        <button onClick={startCamera} style={{
                            padding: '10px 24px', borderRadius: 'var(--radius-pill)',
                            background: 'var(--halalqu-green)', color: '#FFFFFF', border: 'none',
                            fontWeight: 600, fontSize: '14px', cursor: 'pointer', position: 'relative', zIndex: 2,
                            marginTop: 'var(--space-sm)',
                        }}>
                            🎥 Buka Kamera
                        </button>
                    </>
                )}

                {cameraActive && !isScanning && (
                    <span style={{
                        position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
                        color: '#FFFFFF', fontSize: '13px', background: 'rgba(0,0,0,0.5)',
                        padding: '6px 16px', borderRadius: 'var(--radius-pill)', zIndex: 3,
                    }}>
                        📸 Kamera aktif — pilih jenis scan di bawah
                    </span>
                )}

                {isScanning && (
                    <span style={{
                        position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
                        color: '#FFFFFF', fontSize: '13px', background: 'rgba(46,155,90,0.8)',
                        padding: '6px 16px', borderRadius: 'var(--radius-pill)', zIndex: 3,
                    }}>
                        🔄 Sedang memindai...
                    </span>
                )}

                {cameraError && (
                    <div style={{
                        position: 'relative', zIndex: 2, textAlign: 'center',
                        color: '#FFFFFF', padding: 'var(--space-md)',
                    }}>
                        <span style={{ fontSize: '36px' }}>⚠️</span>
                        <p style={{ fontSize: '13px', marginTop: 'var(--space-sm)', opacity: 0.8 }}>{cameraError}</p>
                    </div>
                )}
            </div>

            {/* Scan Buttons */}
            {!results && (
                <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                    <button className="btn btn-primary" onClick={() => { if (!cameraActive) startCamera(); handleScan('menu'); }}
                        style={{ flex: 1 }} disabled={isScanning}>
                        📄 Scan Menu
                    </button>
                    <button className="btn btn-secondary" onClick={() => { if (!cameraActive) startCamera(); handleScan('kemasan'); }}
                        style={{ flex: 1 }} disabled={isScanning}>
                        📦 Scan Kemasan
                    </button>
                </div>
            )}

            {/* Results */}
            {results && (
                <div style={{ animation: 'fadeInUp 0.5s ease' }}>
                    <h2 className="section-title" style={{ marginBottom: 'var(--space-md)' }}>
                        📋 Hasil Analisis
                    </h2>

                    <div style={{
                        display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)',
                    }}>
                        {['safe', 'warning', 'danger'].map(status => {
                            const count = results.filter(r => r.status === status).length;
                            const cfg = statusConfig[status];
                            return (
                                <div key={status} style={{
                                    flex: 1, padding: 'var(--space-md)', borderRadius: 'var(--radius-md)',
                                    background: cfg.bg, textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: '24px' }}>{cfg.icon}</div>
                                    <div style={{ fontSize: '20px', fontWeight: 700, color: cfg.color }}>{count}</div>
                                    <div style={{ fontSize: '11px', color: cfg.color, fontWeight: 600 }}>{cfg.label}</div>
                                </div>
                            );
                        })}
                    </div>

                    {results.map((item, i) => {
                        const cfg = statusConfig[item.status];
                        return (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)',
                                padding: 'var(--space-md)', background: cfg.bg,
                                borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-sm)',
                                animation: `fadeInUp 0.4s ease ${i * 0.1}s forwards`, opacity: 0,
                            }}>
                                <span style={{ fontSize: '20px', flexShrink: 0 }}>{cfg.icon}</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '15px', color: cfg.color }}>
                                        {item.name}
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                        {item.note}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <button className="btn btn-outline btn-full" onClick={resetScan}
                        style={{ marginTop: 'var(--space-lg)' }}>
                        🔄 Scan Ulang
                    </button>
                </div>
            )}

            <style jsx>{`
                @keyframes scanLine {
                    0%, 100% { top: 20%; }
                    50% { top: 70%; }
                }
            `}</style>
        </div>
    );
}
