'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './BottomNav.module.css';
import { useUser } from '../context/UserContext';

export default function BottomNav() {
    const pathname = usePathname();
    const { user } = useUser();

    // Hide bottom nav on admin pages
    if (pathname.startsWith('/admin')) return null;

    const navItems = [
        { href: '/', label: 'Home', icon: '🏠' },
        { href: '/product', label: 'Produk', icon: '🛍️' },
        { href: '/scan', label: 'Scan', icon: '', isScan: true },
        { href: '/travel', label: 'Travel', icon: '🧳' },
        { href: '/profile', label: user?.isLoggedIn ? 'Profile' : 'Sign In', icon: '👤' },
    ];

    return (
        <nav className={styles.bottomNav}>
            {navItems.map((item) => {
                const isActive = pathname === item.href ||
                    (item.href !== '/' && pathname.startsWith(item.href));
                const isHome = item.href === '/' && pathname === '/';

                if (item.isScan) {
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.scanBtn} ${isActive ? styles.active : ''}`}
                            onClick={(e) => {
                                if (pathname === '/scan') {
                                    e.preventDefault();
                                    window.dispatchEvent(new Event('halalqu-reset-scan'));
                                }
                            }}
                        >
                            <div className={styles.scanBtnCircle}>
                                <span style={{ fontSize: '24px' }}>📷</span>
                            </div>
                            <span className={styles.navLabel}>{item.label}</span>
                        </Link>
                    );
                }

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`${styles.navItem} ${(isActive || isHome) ? styles.active : ''}`}
                    >
                        <span className={styles.navIcon}>{item.icon}</span>
                        <span className={styles.navLabel}>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
