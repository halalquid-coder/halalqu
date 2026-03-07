'use client';
import { useState, useEffect } from 'react';

export default function ImageSlider() {
    const [currentIndex, setCurrentIndex] = useState(0);

    // In the future this will be fetched from Admin CMS
    const defaultSlides = [
        {
            id: 1,
            image: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?q=80&w=800&auto=format&fit=crop",
            title: "Promo Akhir Bulan",
            subtitle: "Diskon 20% di resto pilihan!"
        },
        {
            id: 2,
            image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=800&auto=format&fit=crop",
            title: "Makanan Khas Timur Tengah",
            subtitle: "Jelajahi rasa otentik halal."
        },
        {
            id: 3,
            image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop",
            title: "Sertifikasi Halal Baru",
            subtitle: "5 tempat baru tersertifikasi minggu ini."
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) =>
                prevIndex === defaultSlides.length - 1 ? 0 : prevIndex + 1
            );
        }, 4500); // 4.5 seconds

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="slider-wrapper" style={{
            position: 'relative',
            width: '100%',
            height: '180px',
            borderRadius: '16px',
            overflow: 'hidden',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
            {defaultSlides.map((slide, index) => (
                <div
                    key={slide.id}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: index === currentIndex ? 1 : 0,
                        transition: 'opacity 0.8s ease-in-out',
                        zIndex: index === currentIndex ? 1 : 0
                    }}
                >
                    <img
                        src={slide.image}
                        alt={slide.title}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                    {/* Gradient Overlay for Text Visibility */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0) 100%)'
                    }} />

                    <div style={{
                        position: 'absolute',
                        bottom: '16px',
                        left: '16px',
                        right: '16px',
                        color: 'white',
                        zIndex: 2
                    }}>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                            {slide.title}
                        </h3>
                        <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                            {slide.subtitle}
                        </p>
                    </div>
                </div>
            ))}

            {/* Slide Indicators */}
            <div style={{
                position: 'absolute',
                bottom: '12px',
                right: '16px',
                display: 'flex',
                gap: '6px',
                zIndex: 2
            }}>
                {defaultSlides.map((_, i) => (
                    <div
                        key={i}
                        style={{
                            width: i === currentIndex ? '16px' : '6px',
                            height: '6px',
                            borderRadius: '3px',
                            backgroundColor: i === currentIndex ? 'var(--halalqu-green, #10b981)' : 'rgba(255,255,255,0.5)',
                            transition: 'all 0.3s ease'
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
