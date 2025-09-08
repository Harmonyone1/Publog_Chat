import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'PubLog Chat',
  description: 'Ask natural-language questions over your PubLog (Athena) data'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
