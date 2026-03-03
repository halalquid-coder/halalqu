'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './BottomNav.module.css';

const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/search', label: 'Search', icon: '🔍' },
    { href: '/scan', label: 'Scan', icon: '', isScan: true, useIcon: true },
    { href: '/travel', label: 'Travel', icon: '🧳' },
    { href: '/profile', label: 'Profile', icon: '👤' },
];

export default function BottomNav() {
    const pathname = usePathname();

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
                        >
                            <div className={styles.scanBtnCircle}>
                                <img src="/icon.svg" alt="Scan" style={{ width: '28px', height: '28px' }} />
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
