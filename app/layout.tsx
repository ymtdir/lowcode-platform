import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/features/theme/providers/theme-provider';
import { ColorProvider } from '@/features/theme/providers/color-provider';
import { Toaster } from '@/components/ui/sonner';
import { getSettings } from '@/features/setting/api';
import { GlobalStyleInjector } from '@/components/shared/global-style-injector';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSettings();

    return {
      title: settings.appName,
      description: settings.appName,
      icons: {
        icon: settings.appFavicon,
      },
    };
  } catch {
    // ビルド時などDBに接続できない場合はデフォルト値を返す
    return {
      title: 'Lowcode Platform',
      description: 'Lowcode Platform',
      icons: {
        icon: '/system/favicon.ico',
      },
    };
  }
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
      <head>
        <GlobalStyleInjector />
      </head>
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
