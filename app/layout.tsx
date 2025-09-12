import './globals.css';
import type { Metadata } from 'next';
import AppShell from '../components/AppShell';
import { PlanProvider } from '../lib/plan';
import AuthProvider from '../components/AuthProvider';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'Orcha Insights',
  description: 'Ask natural-language questions over your data',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full bg-slate-950 text-slate-50">
        <PlanProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </PlanProvider>
      </body>
    </html>
  );
}
