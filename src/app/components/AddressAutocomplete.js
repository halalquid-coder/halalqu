'use client';
import { useState, useEffect, useRef } from 'react';

export default function AddressAutocomplete({ value, onChange, onLocationSelect }) {
    const [query, setQuery] = useState(value || '');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const wrapperRef = useRef(null);
    const debounceTimeout = useRef(null);

    // Sync input with external value changes (e.g., from auto-detect)
    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchAddress = async (searchTerm) => {
        if (!searchTerm || searchTerm.trim().length < 3) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        try {
            // Using Nominatim API (OpenStreetMap)
            // Added countrycodes=id to prioritize Indonesian addresses (optional, can be removed for global)
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&limit=5&addressdetails=1`);
            const data = await res.json();
            setResults(data);
        } catch (error) {
            console.error('Error fetching addresses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        onChange(val); // Update parent state with raw text
        setShowDropdown(true);

        // Debounce search
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            searchAddress(val);
        }, 600);
    };

    const handleSelect = (item) => {
        setQuery(item.display_name);
        onChange(item.display_name);
        setShowDropdown(false);

        if (onLocationSelect) {
            onLocationSelect({
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                displayName: item.display_name
            });
        }
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <input
                type="text"
                placeholder="Cari alamat atau ketik manual..."
                value={query}
                onChange={handleInputChange}
                onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
                style={{
                    width: '100%', padding: '14px var(--space-md)', borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--border)', fontSize: '15px', background: 'var(--white)',
                }}
            />
            {isLoading && (
                <div style={{
                    position: 'absolute', right: '14px', top: '14px',
                    fontSize: '14px', animation: 'spin 1s linear infinite',
                    display: 'inline-block'
                }}>⏳</div>
            )}

            {showDropdown && results.length > 0 && (
                <ul style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    margin: '4px 0 0', padding: 0, listStyle: 'none',
                    background: 'var(--white)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                    zIndex: 1000, maxHeight: '250px', overflowY: 'auto'
                }}>
                    {results.map((item, index) => (
                        <li
                            key={index}
                            onClick={() => handleSelect(item)}
                            style={{
                                padding: '12px 16px', borderBottom: index < results.length - 1 ? '1px solid var(--border-light)' : 'none',
                                cursor: 'pointer', fontSize: '13.5px', lineHeight: 1.4,
                                transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                                {item.name || item.display_name.split(',')[0]}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {item.display_name}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            <style jsx>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
