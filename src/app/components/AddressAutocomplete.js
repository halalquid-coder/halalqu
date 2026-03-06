'use client';
import { useState, useEffect, useRef } from 'react';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function AddressAutocomplete({ value, onChange, onLocationSelect }) {
    const [query, setQuery] = useState(value || '');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const wrapperRef = useRef(null);
    const debounceTimeout = useRef(null);

    // Google Maps Refs
    const autocompleteService = useRef(null);
    const placesService = useRef(null);
    const sessionToken = useRef(null);

    // Sync input with external value changes
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

    // Initialize Google Maps if key is present
    useEffect(() => {
        if (!GOOGLE_MAPS_API_KEY) return;

        const initServices = () => {
            if (window.google?.maps?.places) {
                if (!autocompleteService.current) {
                    autocompleteService.current = new window.google.maps.places.AutocompleteService();
                    placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));
                    sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
                }
            }
        };

        if (window.google?.maps?.places) {
            initServices();
        } else {
            const scriptId = 'google-maps-script';
            if (!document.getElementById(scriptId)) {
                const script = document.createElement('script');
                script.id = scriptId;
                script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMapsPlacesAutocomplete`;
                script.async = true;
                script.defer = true;
                window.initGoogleMapsPlacesAutocomplete = initServices;
                document.head.appendChild(script);
            } else {
                // Wait for existing script to load
                const checkInterval = setInterval(() => {
                    if (window.google?.maps?.places) {
                        initServices();
                        clearInterval(checkInterval);
                    }
                }, 500);
            }
        }
    }, []);

    const searchAddress = async (searchTerm) => {
        if (!searchTerm || searchTerm.trim().length < 3) {
            setResults([]);
            return;
        }

        setIsLoading(true);

        // USE GOOGLE MAPS API if available
        if (autocompleteService.current) {
            try {
                autocompleteService.current.getPlacePredictions({
                    input: searchTerm,
                    sessionToken: sessionToken.current,
                    componentRestrictions: { country: 'id' }, // Restrict to Indonesia (optional)
                }, (predictions, status) => {
                    setIsLoading(false);
                    if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                        const mappedResults = predictions.map(p => ({
                            place_id: p.place_id,
                            name: p.structured_formatting.main_text,
                            display_name: p.description,
                            source: 'google'
                        }));
                        setResults(mappedResults);
                    } else {
                        setResults([]);
                    }
                });
            } catch (error) {
                console.error('Google Maps Autocomplete Error:', error);
                setIsLoading(false);
            }
            return;
        }

        // FALLBACK TO NOMINATIM OPENSTREETMAP (if no Google API Key)
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&limit=5&addressdetails=1`);
            const data = await res.json();
            const mappedResults = data.map(item => ({
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                name: item.name || item.display_name.split(',')[0],
                display_name: item.display_name,
                source: 'osm'
            }));
            setResults(mappedResults);
        } catch (error) {
            console.error('OSM Autocomplete Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        onChange(val);
        setShowDropdown(true);

        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            searchAddress(val);
        }, 600);
    };

    const handleSelect = (item) => {
        setQuery(item.display_name);
        onChange(item.display_name);
        setShowDropdown(false);

        if (!onLocationSelect) return;

        // If from Google, we need to fetch the LatLng using PlacesService
        if (item.source === 'google' && placesService.current) {
            placesService.current.getDetails({
                placeId: item.place_id,
                fields: ['geometry', 'name', 'formatted_address'],
                sessionToken: sessionToken.current
            }, (place, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
                    onLocationSelect({
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                        displayName: place.formatted_address || item.display_name
                    });
                    // Reset session token after a successful selection as per Google Maps guidelines
                    sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
                }
            });
        }
        // If from OSM, lat/lng is already in the object
        else if (item.source === 'osm') {
            onLocationSelect({
                lat: item.lat,
                lng: item.lng,
                displayName: item.display_name
            });
        }
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <input
                type="text"
                placeholder={GOOGLE_MAPS_API_KEY ? "Cari alamat dengan Google Maps..." : "Cari alamat..."}
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
                                transition: 'background 0.2s ease',
                                display: 'flex', gap: '8px', alignItems: 'flex-start'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <span style={{ fontSize: '16px', marginTop: '2px' }}>
                                {item.source === 'google' ? '🟢' : '📍'}
                            </span>
                            <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                                    {item.name}
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {item.display_name}
                                </div>
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
