'use client';

import { Header } from './Header';
import { Footer } from './Footer';

export default function DefaultLayout({
  children,
  includeFooter = true,
}: {
  children: React.ReactNode;
  includeFooter?: boolean;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      {includeFooter && <Footer />}
    </div>
  );
}