import type { Metadata } from 'next';
import SiteFooter from '@/components/site-footer';
import './globals.css';

export const metadata: Metadata = {
  title: '东盟道教与文化协会',
  description: '东方极简风格的东盟道教与文化协会官网'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
