'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getUserProfile, createUserProfile, updateUserProfile } from '../lib/firestore';

const UserContext = createContext();

const translations = {
    id: {
        greeting: 'Assalamualaikum',
        heroTitle: 'Mau makan apa hari ini?',
        heroSubtitle: 'Temukan makanan halal terdekat yang terpercaya',
        searchPlaceholder: 'Cari restoran, menu, atau kota...',
        nearMe: '📍 Cari di Sekitarku',
        all: 'Semua',
        certified: 'Certified',
        muslimOwned: 'Muslim Owned',
        halalIngredients: 'Halal Ingredients',
        interactiveMap: 'Peta Interaktif',
        nearbyHalal: 'Restoran Halal Terdekat',
        seeAll: 'Semua →',
        travelGuide: 'Travel Guide',
        home: 'Home', search: 'Search', scan: 'Scan', travel: 'Travel', profile: 'Profile',
        settings: 'Pengaturan', aboutHalalqu: 'Tentang Halalqu',
        logout: 'Keluar', deleteAccount: 'Hapus Akun Saya',
        language: 'Bahasa', darkMode: 'Mode Gelap', notifications: 'Notifikasi',
        locationAccess: 'Akses Lokasi', halalDefault: 'Standar Halal Default',
        general: 'Umum', account: 'Akun', changePassword: 'Ubah Password',
        changeEmail: 'Ubah Email', version: 'Halalqu v1.0.0',
        loginBtn: 'Masuk / Daftar',
        loginPrompt: 'Login untuk menyimpan bookmark & menulis review',
    },
    en: {
        greeting: 'Assalamualaikum',
        heroTitle: 'What do you want to eat today?',
        heroSubtitle: 'Find trusted halal food nearby',
        searchPlaceholder: 'Search restaurants, menus, or cities...',
        nearMe: '📍 Search Near Me',
        all: 'All',
        certified: 'Certified',
        muslimOwned: 'Muslim Owned',
        halalIngredients: 'Halal Ingredients',
        interactiveMap: 'Interactive Map',
        nearbyHalal: 'Nearby Halal Restaurants',
        seeAll: 'All →',
        travelGuide: 'Travel Guide',
        home: 'Home', search: 'Search', scan: 'Scan', travel: 'Travel', profile: 'Profile',
        settings: 'Settings', aboutHalalqu: 'About Halalqu',
        logout: 'Logout', deleteAccount: 'Delete My Account',
        language: 'Language', darkMode: 'Dark Mode', notifications: 'Notifications',
        locationAccess: 'Location Access', halalDefault: 'Default Halal Standard',
        general: 'General', account: 'Account', changePassword: 'Change Password',
        changeEmail: 'Change Email', version: 'Halalqu v1.0.0',
        loginBtn: 'Login / Register',
        loginPrompt: 'Login to save bookmarks & write reviews',
    },
    ar: {
        greeting: 'السلام عليكم',
        heroTitle: 'ماذا تريد أن تأكل اليوم؟',
        heroSubtitle: 'اعثر على طعام حلال موثوق بالقرب منك',
        searchPlaceholder: 'ابحث عن مطاعم، قوائم، أو مدن...',
        nearMe: '📍 ابحث بالقرب مني',
        all: 'الكل',
        certified: '✅ معتمد',
        muslimOwned: '🕌 مملوك لمسلم',
        halalIngredients: '🥗 مكونات حلال',
        interactiveMap: '🗺 خريطة تفاعلية',
        nearbyHalal: '📍 مطاعم حلال قريبة',
        seeAll: 'الكل ←',
        travelGuide: '🧳 دليل السفر',
        home: 'الرئيسية', search: 'بحث', scan: 'فحص', travel: 'سفر', profile: 'حسابي',
        settings: '⚙️ الإعدادات', aboutHalalqu: 'عن حلالكو',
        logout: '🚪 تسجيل الخروج', deleteAccount: '🗑️ حذف حسابي',
        language: 'اللغة', darkMode: 'الوضع الداكن', notifications: 'الإشعارات',
        locationAccess: 'الوصول للموقع', halalDefault: 'معيار الحلال الافتراضي',
        general: 'عام', account: 'الحساب', changePassword: 'تغيير كلمة المرور',
        changeEmail: 'تغيير البريد', version: 'حلالكو v1.0.0',
        loginBtn: 'تسجيل الدخول',
        loginPrompt: 'سجّل الدخول لحفظ المفضلات وكتابة المراجعات',
    },
    ms: {
        greeting: 'Assalamualaikum',
        heroTitle: 'Nak makan apa hari ini?',
        heroSubtitle: 'Cari makanan halal berdekatan yang dipercayai',
        searchPlaceholder: 'Cari restoran, menu, atau bandar...',
        nearMe: '📍 Cari Berdekatan',
        all: 'Semua',
        certified: '✅ Certified',
        muslimOwned: '🕌 Muslim Owned',
        halalIngredients: '🥗 Halal Ingredients',
        interactiveMap: '🗺 Peta Interaktif',
        nearbyHalal: '📍 Restoran Halal Berdekatan',
        seeAll: 'Semua →',
        travelGuide: '🧳 Panduan Travel',
        home: 'Utama', search: 'Cari', scan: 'Imbas', travel: 'Travel', profile: 'Profil',
        settings: '⚙️ Tetapan', aboutHalalqu: 'Tentang Halalqu',
        logout: '🚪 Log Keluar', deleteAccount: '🗑️ Padam Akaun',
        language: 'Bahasa', darkMode: 'Mod Gelap', notifications: 'Notifikasi',
        locationAccess: 'Akses Lokasi', halalDefault: 'Standard Halal Default',
        general: 'Umum', account: 'Akaun', changePassword: 'Tukar Kata Laluan',
        changeEmail: 'Tukar Emel', version: 'Halalqu v1.0.0',
        loginBtn: 'Log Masuk / Daftar',
        loginPrompt: 'Log masuk untuk simpan bookmark & tulis review',
    },
};

const defaultUser = {
    isLoggedIn: false,
    uid: null,
    name: '',
    email: '',
    phone: '',
    photoURL: null,
    bio: '',
    role: 'user',
    merchantStatus: null,
    stats: { reviews: 0, places: 0, bookmarks: 0 },
    contributorLevel: 'bronze',
    merchantInfo: null,
    bookmarks: [],
};

export function UserProvider({ children }) {
    const [user, setUser] = useState(defaultUser);
    const [authLoading, setAuthLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [language, setLanguage] = useState('id');
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    // Listen for Firebase auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // User is signed in — fetch profile from Firestore
                try {
                    let profile = await getUserProfile(firebaseUser.uid);

                    if (!profile) {
                        // New user — create profile doc
                        await createUserProfile(firebaseUser.uid, {
                            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
                            email: firebaseUser.email || '',
                        });
                        profile = await getUserProfile(firebaseUser.uid);
                    }

                    setUser({
                        isLoggedIn: true,
                        uid: firebaseUser.uid,
                        name: profile?.name || firebaseUser.displayName || '',
                        email: profile?.email || firebaseUser.email || '',
                        phone: profile?.phone || '',
                        photoURL: profile?.photoURL || firebaseUser.photoURL || null,
                        bio: profile?.bio || '',
                        role: profile?.role || 'user',
                        merchantStatus: profile?.merchantStatus || null,
                        stats: profile?.stats || { reviews: 0, places: 0, bookmarks: 0 },
                        contributorLevel: profile?.contributorLevel || 'bronze',
                        merchantInfo: profile?.merchantInfo || null,
                        bookmarks: profile?.bookmarks || [],
                    });

                    // Restore preferences
                    if (profile?.darkMode !== undefined) setDarkMode(profile.darkMode);
                    if (profile?.language) setLanguage(profile.language);
                    if (profile?.notificationsEnabled !== undefined) setNotificationsEnabled(profile.notificationsEnabled);

                } catch (err) {
                    console.warn('Firestore profile fetch skipped:', err.message);
                    // Still mark as logged in with basic info
                    setUser({
                        ...defaultUser,
                        isLoggedIn: true,
                        uid: firebaseUser.uid,
                        name: firebaseUser.displayName || '',
                        email: firebaseUser.email || '',
                        photoURL: firebaseUser.photoURL || null,
                    });
                }
            } else {
                // User is signed out
                setUser(defaultUser);
            }
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Load preferences from localStorage (instant, before Firestore)
    useEffect(() => {
        try {
            const savedDark = localStorage.getItem('halalqu-darkMode');
            const savedLang = localStorage.getItem('halalqu-language');
            const savedNotif = localStorage.getItem('halalqu-notifications');
            if (savedDark !== null) setDarkMode(savedDark === 'true');
            if (savedLang) setLanguage(savedLang);
            if (savedNotif !== null) setNotificationsEnabled(savedNotif === 'true');
        } catch (e) { /* SSR safety */ }
    }, []);

    // Apply dark mode to DOM
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
        try { localStorage.setItem('halalqu-darkMode', String(darkMode)); } catch (e) { }
    }, [darkMode]);

    // Save language preference
    useEffect(() => {
        try { localStorage.setItem('halalqu-language', language); } catch (e) { }
    }, [language]);

    const toggleDarkMode = async () => {
        const newVal = !darkMode;
        setDarkMode(newVal);
        // Persist to Firestore if logged in
        if (user.uid) {
            try { await updateUserProfile(user.uid, { darkMode: newVal }); } catch (e) { }
        }
    };

    const toggleNotifications = async () => {
        const newVal = !notificationsEnabled;
        setNotificationsEnabled(newVal);
        try { localStorage.setItem('halalqu-notifications', String(newVal)); } catch (e) { }
        if (user.uid) {
            try { await updateUserProfile(user.uid, { notificationsEnabled: newVal }); } catch (e) { }
        }
    };

    const changeLanguage = async (lang) => {
        setLanguage(lang);
        if (user.uid) {
            try { await updateUserProfile(user.uid, { language: lang }); } catch (e) { }
        }
    };

    const t = (key) => translations[language]?.[key] || translations['id'][key] || key;

    const upgradeTo = (role) => {
        setUser(prev => ({ ...prev, role }));
    };

    const setMerchantStatus = (status, merchantInfo = null) => {
        setUser(prev => ({
            ...prev,
            merchantStatus: status,
            ...(status === 'approved' ? { role: 'merchant', merchantInfo } : {}),
        }));
    };

    const refreshUser = async () => {
        if (!user.uid) return;
        try {
            const profile = await getUserProfile(user.uid);
            if (profile) {
                setUser(prev => ({
                    ...prev,
                    stats: profile.stats || prev.stats,
                    role: profile.role || 'user',
                    merchantStatus: profile.merchantStatus !== undefined ? profile.merchantStatus : prev.merchantStatus,
                    merchantInfo: profile.merchantInfo !== undefined ? profile.merchantInfo : prev.merchantInfo,
                    bookmarks: profile.bookmarks || prev.bookmarks,
                }));
            }
        } catch (e) {
            console.warn('refreshUser error:', e);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (err) {
            console.error('Logout error:', err);
        }
        setUser(defaultUser);
    };

    return (
        <UserContext.Provider value={{
            user, setUser, upgradeTo, setMerchantStatus, logout, refreshUser,
            darkMode, toggleDarkMode, language, setLanguage: changeLanguage, t,
            notificationsEnabled, toggleNotifications, setNotificationsEnabled,
            authLoading,
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
