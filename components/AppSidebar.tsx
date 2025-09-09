"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const navItems = [
  { href: '/chat', label: 'Home' },
  { href: '/insights', label: 'Insights' },
  { href: '/datasets', label: 'Datasets' },
  { href: '/saved', label: 'Saved' },
  { href: '/settings', label: 'Settings' },
  { href: '/support', label: 'Support' },
  { href: '/plans', label: 'Plans' },
];

export default function AppSidebar({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'PubLog';

  return (
    <aside className="w-full bg-slate-900 text-slate-100 flex flex-col p-2 md:p-4 gap-2">
      {!collapsed && <div className="text-xl font-bold mb-2 md:mb-4">{appName}</div>}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={clsx(
                'p-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 flex items-center justify-center md:justify-start',
                active
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <span className={clsx(collapsed ? 'sr-only md:sr-only' : 'inline')}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
