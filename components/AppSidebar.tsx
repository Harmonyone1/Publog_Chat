"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/chat', label: 'Ask' },
  { href: '/insights', label: 'Insights' },
  { href: '/datasets', label: 'Datasets' },
  { href: '/saved', label: 'Saved' },
  { href: '/settings', label: 'Settings' },
  { href: '/support', label: 'Support' },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'PubLog';

  return (
    <aside className="w-56 bg-slate-900 text-slate-100 flex flex-col p-4 gap-2">
      <div className="text-xl font-bold mb-4">{appName}</div>
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={clsx(
                'p-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                active
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
