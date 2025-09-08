import './globals.css';
import type { Metadata } from 'next';
import AppSidebar from '../components/AppSidebar';
import AppHeader from '../components/AppHeader';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'PubLog Insights',
  description: 'Ask natural-language questions over your PubLog data',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full bg-slate-950 text-slate-50">
        <div className="flex min-h-screen">
          <AppSidebar />
          <div className="flex flex-col flex-1 min-h-screen">
            <AppHeader />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
