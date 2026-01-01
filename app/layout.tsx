import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/features/theme/providers/theme-provider';
import { ColorProvider } from '@/features/theme/providers/color-provider';
import { Toaster } from '@/components/ui/sonner';
import { getSettings } from '@/features/setting/api';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();

  return {
    title: settings.appTitle,
    description: settings.appTitle,
    icons: {
      icon: settings.faviconUrl,
    },
  };
}

/**
 * ルートレイアウトコンポーネント
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ColorProvider>{children}</ColorProvider>
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
