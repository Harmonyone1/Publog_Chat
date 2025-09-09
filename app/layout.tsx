import './globals.css';
import type { Metadata } from 'next';
import AppShell from '../components/AppShell';
import { PlanProvider } from '../lib/plan';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'PubLog Insights',
  description: 'Ask natural-language questions over your PubLog data',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full bg-slate-950 text-slate-50">
        <PlanProvider>
          <AppShell>{children}</AppShell>
        </PlanProvider>
      </body>
    </html>
  );
}
