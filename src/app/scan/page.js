'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { analyzeWithLocalDB, parseIngredientList } from '../lib/halalDatabase';

const statusConfig = {
    safe: { icon: '✅', label: 'Halal', color: 'var(--halalqu-green)', bg: 'var(--halalqu-green-light)' },
    warning: { icon: '⚠️', label: 'Syubhat', color: '#D4920A', bg: '#FFF8E7' },
    danger: { icon: '❌', label: 'Haram', color: 'var(--danger)', bg: '#FDE8E8' },
};

const verdictConfig = {
    HALAL: { icon: '✅', color: 'var(--halalqu-green)', bg: 'var(--halalqu-green-light)', label: 'HALAL' },
    SYUBHAT: { icon: '⚠️', color: '#D4920A', bg: '#FFF8E7', label: 'SYUBHAT' },
    HARAM: { icon: '❌', color: 'var(--danger)', bg: '#FDE8E8', label: 'HARAM' },
};

// Steps: capture → extract → review → analyze → results
const STEPS = ['capture', 'extract', 'review', 'analyze', 'results'];

export default function ScanPage() {
    const [step, setStep] = useState('capture');
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrText, setOcrText] = useState('');
    const [results, setResults] = useState(null);
    const [overallVerdict, setOverallVerdict] = useState(null);
    const [confidence, setConfidence] = useState(0);
    const [summary, setSummary] = useState('');
    const [capturedImage, setCapturedImage] = useState(null);
    const [analysisMethod, setAnalysisMethod] = useState('');
    const [scanHistory, setScanHistory] = useState([]);

    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    // Load scan history from localStorage and set up reset listener
    useEffect(() => {
        try {
            const saved = localStorage.getItem('halalqu-scan-history');
            if (saved) setScanHistory(JSON.parse(saved));
        } catch (e) { /* SSR safety */ }

        // Listen for reset events from BottomNav
        const handleReset = () => {
            setStep('capture');
            setCapturedImage(null);
            setOcrText('');
            setResults(null);
            setOverallVerdict(null);
            setConfidence(0);
            setSummary('');
            setAnalysisMethod('');
            setCameraError(null);
            setOcrProgress(0);
        };
        window.addEventListener('halalqu-reset-scan', handleReset);
        return () => window.removeEventListener('halalqu-reset-scan', handleReset);
    }, []);

    // Camera controls
    const startCamera = async () => {
        try {
            setCameraError(null);

            // Start with ideal resolution
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
                });
            } catch (err) {
                // Fallback for devices that don't support the exact constraint or face mode
                console.warn('Ideal camera constraints failed, trying basic video...', err);
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' } // Just ask for rear camera, any size
                });
            }

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraActive(true);
        } catch (err) {
            console.error('Camera totally failed:', err);
            setCameraError(`Kamera gagal dibuka: ${err.message || 'Izin ditolak atau tidak ada kamera'}.`);
            setCameraActive(false);
        }
    };

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    }, []);

    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    // Capture photo from camera
    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');

        // Enhance image for OCR (Grayscale + High Contrast)
        ctx.filter = 'grayscale(100%) contrast(150%) brightness(110%)';
        ctx.drawImage(video, 0, 0);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(dataUrl);
        stopCamera();
        runOCR(dataUrl);
    };

    // Handle file upload
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                // Scale down large images for faster and more accurate OCR
                const MAX_DIM = 1280;
                let finalWidth = img.width;
                let finalHeight = img.height;
                if (finalWidth > MAX_DIM || finalHeight > MAX_DIM) {
                    const ratio = Math.min(MAX_DIM / finalWidth, MAX_DIM / finalHeight);
                    finalWidth *= ratio;
                    finalHeight *= ratio;
                }

                const canvas = document.createElement('canvas');
                canvas.width = finalWidth;
                canvas.height = finalHeight;
                const ctx = canvas.getContext('2d');

                // Enhance image for OCR
                ctx.filter = 'grayscale(100%) contrast(150%) brightness(110%)';
                ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

                const enhancedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                setCapturedImage(enhancedDataUrl);
                stopCamera();
                runOCR(enhancedDataUrl);
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    };

    // Run Tesseract.js OCR
    const runOCR = async (imageData) => {
        setStep('extract');
        setOcrProgress(0);

        try {
            // Dynamic import to avoid SSR issues
            const Tesseract = (await import('tesseract.js')).default;

            const result = await Tesseract.recognize(imageData, 'eng+ind', {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setOcrProgress(Math.round(m.progress * 100));
                    }
                },
            });

            const extractedText = result.data.text.trim();
            if (extractedText.length < 3) {
                setOcrText('');
                setStep('review');
            } else {
                setOcrText(extractedText);
                setStep('review');
            }
        } catch (err) {
            console.error('OCR Error:', err);
            setCameraError('Gagal membaca teks dari gambar. Coba lagi dengan gambar yang lebih jelas.');
            setStep('capture');
        }
    };

    // Analyze ingredients
    const analyzeIngredients = async () => {
        setStep('analyze');
        const textToAnalyze = ocrText.trim();

        if (!textToAnalyze) {
            setStep('review');
            return;
        }

        try {
            // Try AI analysis first
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: textToAnalyze }),
            });

            const data = await response.json();

            if (data.error === 'NO_API_KEY' || data.error === 'AI_ERROR' || data.error === 'AI_EMPTY') {
                // Fallback to local database
                useLocalAnalysis(textToAnalyze);
                return;
            }

            if (data.error) {
                useLocalAnalysis(textToAnalyze);
                return;
            }

            // AI results
            const aiIngredients = (data.ingredients || []).map(ing => ({
                name: ing.name,
                status: ing.status === 'safe' ? 'safe' : ing.status === 'warning' ? 'warning' : 'danger',
                note: ing.note || '',
            }));

            setResults(aiIngredients);
            setOverallVerdict(data.overallVerdict || 'HALAL');
            setConfidence(data.confidence || 0.8);
            setSummary(data.summary || '');
            setAnalysisMethod('🤖 AI (Gemini)');
            setStep('results');
            saveToHistory(textToAnalyze, data.overallVerdict || 'HALAL', aiIngredients.length);

        } catch (err) {
            console.error('AI Analysis error:', err);
            useLocalAnalysis(textToAnalyze);
        }
    };

    // Local database fallback
    const useLocalAnalysis = (text) => {
        const localResults = analyzeWithLocalDB(text);
        const parsedIngredients = parseIngredientList(text);

        // Mark unmatched ingredients as safe
        const allResults = [...localResults];
        for (const ing of parsedIngredients) {
            if (!localResults.find(r => ing.toLowerCase().includes(r.name.toLowerCase().split(' ')[0]))) {
                allResults.push({ name: ing, status: 'safe', note: 'Bahan aman', category: '' });
            }
        }

        const hasDanger = allResults.some(r => r.status === 'danger');
        const hasWarning = allResults.some(r => r.status === 'warning');
        const verdict = hasDanger ? 'HARAM' : hasWarning ? 'SYUBHAT' : 'HALAL';

        setResults(allResults);
        setOverallVerdict(verdict);
        setConfidence(0.6);
        setSummary('Analisis menggunakan database lokal. Untuk hasil lebih akurat, tambahkan Gemini API key.');
        setAnalysisMethod('📚 Database Lokal');
        setStep('results');
        saveToHistory(text, verdict, allResults.length);
    };

    // Save to history
    const saveToHistory = (text, verdict, count) => {
        try {
            const entry = { date: new Date().toISOString(), verdict, ingredientCount: count, textPreview: text.substring(0, 50) };
            const updated = [entry, ...scanHistory].slice(0, 10);
            setScanHistory(updated);
            localStorage.setItem('halalqu-scan-history', JSON.stringify(updated));
        } catch (e) { /* ignore */ }
    };

    // Reset
    const resetScan = () => {
        setStep('capture');
        setCapturedImage(null);
        setOcrText('');
        setResults(null);
        setOverallVerdict(null);
        setConfidence(0);
        setSummary('');
        setAnalysisMethod('');
        setCameraError(null);
        setOcrProgress(0);
    };

    // Current step index for progress bar
    const stepIndex = STEPS.indexOf(step);

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: '100px' }}>
            {/* Header */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <h1 style={{ marginBottom: '4px', fontSize: '22px' }}>AI Ingredient Scanner</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    Pindai komposisi produk untuk deteksi bahan kritis halal/haram
                </p>
            </div>

            {/* Step Progress */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: 'var(--space-xl)' }}>
                {STEPS.map((s, i) => (
                    <div key={s} style={{
                        flex: 1, height: '4px', borderRadius: '2px',
                        background: i <= stepIndex ? 'var(--halalqu-green)' : 'var(--border)',
                        transition: 'background 0.4s ease',
                    }} />
                ))}
            </div>

            {/* ==================== STEP 1: CAPTURE ==================== */}
            {step === 'capture' && (
                <div style={{ animation: 'fadeInUp 0.4s ease' }}>
                    {/* Camera/Preview Area */}
                    <div style={{
                        width: '100%', aspectRatio: '4/3', borderRadius: 'var(--radius-xl)',
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #3D444B 100%)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', gap: 'var(--space-md)', position: 'relative',
                        overflow: 'hidden', marginBottom: 'var(--space-lg)',
                    }}>
                        <video ref={videoRef} autoPlay playsInline muted style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            objectFit: 'cover',
                            display: cameraActive ? 'block' : 'none',
                        }} />

                        {/* Target frame */}
                        <div style={{
                            position: 'absolute', width: '80%', height: '65%',
                            border: '2px dashed rgba(255,255,255,0.3)', borderRadius: 'var(--radius-lg)',
                            zIndex: 2,
                        }} />

                        {!cameraActive && !cameraError && (
                            <>
                                <span style={{ fontSize: '56px', position: 'relative', zIndex: 1 }}>📸</span>
                                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 var(--space-lg)' }}>
                                    Arahkan kamera ke label komposisi / ingredients
                                </span>
                            </>
                        )}

                        {cameraActive && (
                            <button onClick={capturePhoto} style={{
                                position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
                                width: '64px', height: '64px', borderRadius: '50%',
                                background: 'rgba(255,255,255,0.9)', border: '4px solid var(--halalqu-green)',
                                cursor: 'pointer', zIndex: 3,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '28px', transition: 'transform 0.2s ease',
                            }}>
                                📸
                            </button>
                        )}

                        {cameraError && (
                            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', color: '#FFFFFF', padding: 'var(--space-md)' }}>
                                <span style={{ fontSize: '36px' }}>⚠️</span>
                                <p style={{ fontSize: '13px', marginTop: 'var(--space-sm)', opacity: 0.8 }}>{cameraError}</p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                        {!cameraActive ? (
                            <button className="btn btn-primary" onClick={startCamera} style={{ flex: 1, padding: '14px' }}>
                                Buka Kamera
                            </button>
                        ) : (
                            <button className="btn btn-secondary" onClick={stopCamera} style={{ flex: 1, padding: '14px' }}>
                                Tutup Kamera
                            </button>
                        )}
                        <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} style={{ flex: 1, padding: '14px' }}>
                            Upload Foto
                        </button>
                    </div>

                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />

                    {/* Manual Input Option */}
                    <div style={{
                        background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-md)', boxShadow: 'var(--shadow-sm)',
                        border: '1px solid var(--border)',
                    }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
                            Atau ketik manual
                        </div>
                        <textarea
                            placeholder="Paste atau ketik daftar komposisi di sini..."
                            style={{
                                width: '100%', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)',
                                border: '1.5px solid var(--border)', fontSize: '14px', resize: 'vertical',
                                lineHeight: 1.6, background: 'var(--bg)', minHeight: '80px',
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey) {
                                    const val = e.target.value.trim();
                                    if (val) {
                                        setOcrText(val);
                                        setStep('review');
                                    }
                                }
                            }}
                            onChange={(e) => setOcrText(e.target.value)}
                            value={ocrText}
                        />
                        {ocrText.trim().length > 0 && (
                            <button className="btn btn-primary btn-full" onClick={() => setStep('review')} style={{ marginTop: 'var(--space-sm)', padding: '12px' }}>
                                Analisis Teks Ini
                            </button>
                        )}
                    </div>

                    {/* Scan History */}
                    {scanHistory.length > 0 && (
                        <div style={{ marginTop: 'var(--space-xl)' }}>
                            <h3 style={{ fontSize: '15px', marginBottom: 'var(--space-sm)' }}>📜 Riwayat Scan</h3>
                            {scanHistory.slice(0, 3).map((h, i) => {
                                const vc = verdictConfig[h.verdict] || verdictConfig.HALAL;
                                return (
                                    <div key={i} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: 'var(--space-sm) var(--space-md)',
                                        background: 'var(--white)', borderRadius: 'var(--radius-md)',
                                        marginBottom: '6px', boxShadow: 'var(--shadow-sm)',
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 500 }}>{h.textPreview}...</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                {new Date(h.date).toLocaleDateString('id-ID')} · {h.ingredientCount} bahan
                                            </div>
                                        </div>
                                        <span style={{
                                            padding: '3px 10px', borderRadius: 'var(--radius-pill)',
                                            fontSize: '11px', fontWeight: 600, background: vc.bg, color: vc.color,
                                        }}>{vc.icon} {vc.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ==================== STEP 2: OCR EXTRACTION ==================== */}
            {step === 'extract' && (
                <div style={{ textAlign: 'center', padding: 'var(--space-2xl) 0', animation: 'fadeInUp 0.4s ease' }}>
                    {capturedImage && (
                        <div style={{
                            width: '200px', height: '150px', margin: '0 auto var(--space-lg)',
                            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                            boxShadow: 'var(--shadow-md)',
                        }}>
                            <img src={capturedImage} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    )}
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: 'var(--halalqu-green-light)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-md)',
                        fontSize: '36px', animation: 'pulse 1.5s ease-in-out infinite',
                    }}>🔍</div>
                    <h2 style={{ fontSize: '18px', marginBottom: 'var(--space-sm)' }}>Membaca Teks...</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: 'var(--space-lg)' }}>
                        OCR sedang mengekstrak teks dari gambar
                    </p>

                    {/* Progress bar */}
                    <div style={{
                        width: '80%', maxWidth: '300px', margin: '0 auto',
                        height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden',
                    }}>
                        <div style={{
                            width: `${ocrProgress}%`, height: '100%',
                            background: 'linear-gradient(90deg, var(--halalqu-green), #34D399)',
                            borderRadius: '4px', transition: 'width 0.3s ease',
                        }} />
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--halalqu-green)', fontWeight: 600, marginTop: 'var(--space-sm)' }}>
                        {ocrProgress}%
                    </p>
                </div>
            )}

            {/* ==================== STEP 3: REVIEW TEXT ==================== */}
            {step === 'review' && (
                <div style={{ animation: 'fadeInUp 0.4s ease' }}>
                    <div style={{
                        display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)',
                    }}>
                        {capturedImage && (
                            <div style={{
                                width: '80px', height: '60px', borderRadius: 'var(--radius-md)',
                                overflow: 'hidden', flexShrink: 0, border: '2px solid var(--halalqu-green)',
                            }}>
                                <img src={capturedImage} alt="Source" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        )}
                        <div>
                            <h2 style={{ fontSize: '18px', marginBottom: '2px' }}>Review Teks</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                Edit teks di bawah jika ada kesalahan OCR
                            </p>
                        </div>
                    </div>

                    <textarea
                        value={ocrText}
                        onChange={(e) => setOcrText(e.target.value)}
                        placeholder="Teks komposisi tidak terdeteksi. Silakan ketik manual..."
                        rows={8}
                        style={{
                            width: '100%', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)',
                            border: '1.5px solid var(--border)', fontSize: '14px', resize: 'vertical',
                            lineHeight: 1.8, background: 'var(--white)', fontFamily: 'monospace',
                        }}
                    />

                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)' }}>
                        <button className="btn btn-secondary" onClick={resetScan} style={{ flex: 1, padding: '14px' }}>
                            Ulang
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={analyzeIngredients}
                            disabled={!ocrText.trim()}
                            style={{ flex: 2, padding: '14px', opacity: ocrText.trim() ? 1 : 0.5 }}
                        >
                            Analisis Bahan
                        </button>
                    </div>
                </div>
            )}

            {/* ==================== STEP 4: ANALYZING ==================== */}
            {step === 'analyze' && (
                <div style={{ textAlign: 'center', padding: 'var(--space-2xl) 0', animation: 'fadeInUp 0.4s ease' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--halalqu-green-light), #D1FAE5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto var(--space-md)', fontSize: '36px',
                        animation: 'pulse 1.5s ease-in-out infinite',
                    }}>🤖</div>
                    <h2 style={{ fontSize: '18px', marginBottom: 'var(--space-sm)' }}>AI Menganalisis Bahan...</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                        Mencocokkan dengan database halal & AI
                    </p>
                    <div style={{
                        width: '60%', maxWidth: '200px', height: '4px', margin: 'var(--space-lg) auto 0',
                        background: 'var(--border)', borderRadius: '2px', overflow: 'hidden',
                    }}>
                        <div style={{
                            width: '100%', height: '100%',
                            background: 'linear-gradient(90deg, var(--halalqu-green), #34D399)',
                            animation: 'shimmer 1.5s ease-in-out infinite',
                        }} />
                    </div>
                </div>
            )}

            {/* ==================== STEP 5: RESULTS ==================== */}
            {step === 'results' && results && (
                <div style={{ animation: 'fadeInUp 0.4s ease' }}>
                    {/* Overall Verdict Card */}
                    {overallVerdict && (
                        <div style={{
                            background: verdictConfig[overallVerdict]?.bg || 'var(--white)',
                            borderRadius: 'var(--radius-xl)', padding: 'var(--space-lg)',
                            textAlign: 'center', marginBottom: 'var(--space-lg)',
                            border: `2px solid ${verdictConfig[overallVerdict]?.color || 'var(--border)'}`,
                            boxShadow: 'var(--shadow-md)',
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: 'var(--space-sm)' }}>
                                {verdictConfig[overallVerdict]?.icon}
                            </div>
                            <h2 style={{
                                fontSize: '24px', fontWeight: 800, marginBottom: '4px',
                                color: verdictConfig[overallVerdict]?.color,
                            }}>
                                {verdictConfig[overallVerdict]?.label}
                            </h2>
                            {confidence > 0 && (
                                <div style={{
                                    fontSize: '12px', color: 'var(--text-muted)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    marginTop: '4px',
                                }}>
                                    <span>Confidence: {Math.round(confidence * 100)}%</span>
                                    <span>·</span>
                                    <span>{analysisMethod}</span>
                                </div>
                            )}
                            {summary && (
                                <p style={{
                                    fontSize: '13px', color: 'var(--text-secondary)',
                                    marginTop: 'var(--space-sm)', lineHeight: 1.6,
                                    maxWidth: '400px', margin: 'var(--space-sm) auto 0',
                                }}>{summary}</p>
                            )}
                        </div>
                    )}

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                        {['safe', 'warning', 'danger'].map(status => {
                            const count = results.filter(r => r.status === status).length;
                            const cfg = statusConfig[status];
                            return (
                                <div key={status} style={{
                                    flex: 1, padding: 'var(--space-md)', borderRadius: 'var(--radius-md)',
                                    background: cfg.bg, textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: '20px' }}>{cfg.icon}</div>
                                    <div style={{ fontSize: '20px', fontWeight: 700, color: cfg.color }}>{count}</div>
                                    <div style={{ fontSize: '11px', color: cfg.color, fontWeight: 600 }}>{cfg.label}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Ingredient List */}
                    <h3 style={{ fontSize: '15px', marginBottom: 'var(--space-sm)' }}>📋 Detail Bahan ({results.length})</h3>
                    {results.map((item, i) => {
                        const cfg = statusConfig[item.status];
                        return (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)',
                                padding: 'var(--space-md)', background: cfg.bg,
                                borderRadius: 'var(--radius-md)', marginBottom: '6px',
                                animation: `fadeInUp 0.3s ease ${i * 0.05}s both`,
                            }}>
                                <span style={{ fontSize: '18px', flexShrink: 0 }}>{cfg.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '14px', color: cfg.color }}>
                                        {item.name}
                                    </div>
                                    {item.note && (
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.5 }}>
                                            {item.note}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-xl)' }}>
                        <button className="btn btn-primary btn-full" onClick={resetScan} style={{ padding: '14px' }}>
                            Scan Lagi
                        </button>
                    </div>
                </div>
            )}

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.85; }
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
