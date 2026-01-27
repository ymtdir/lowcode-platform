'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Database, Settings, Users, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type HomeClientProps = {
  userName: string;
};

export function HomeClient({ userName }: HomeClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const containerClass = cn(
    'flex flex-col gap-12 p-8 max-w-6xl mx-auto transition-all duration-1000 ease-out',
    mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
  );

  return (
    <div className="min-h-full w-full bg-gradient-to-br from-background via-muted/20 to-background">
      <div className={containerClass}>
        {/* Welcome Section */}
        <section className="relative space-y-4 py-8">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl delay-700 animate-pulse" />

          <div className="relative">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent pb-2">
              Welcome back, {userName}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
              muku へようこそ。
              <br />
              直感的な操作で、あなたのビジネスを加速させるアプリケーションを構築しましょう。
            </p>
          </div>
        </section>

        {/* Quick Actions Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <HomeCard
            href="/workspace"
            icon={Database}
            title="ワークスペース"
            description="データベース設計、テーブル管理、フォルダ整理を行い、アプリケーションの基盤を作ります。"
            delay={100}
            color="text-blue-500"
          />
          <HomeCard
            href="/users"
            icon={Users}
            title="ユーザー管理"
            description="チームメンバーを招待し、きめ細やかな権限設定でセキュアなコラボレーションを実現します。"
            delay={200}
            color="text-emerald-500"
          />
          <HomeCard
            href="/settings"
            icon={Settings}
            title="設定"
            description="アプリケーション全体の振る舞いやデザイン、システム設定をカスタマイズします。"
            delay={300}
            color="text-purple-500"
          />
        </div>
      </div>
    </div>
  );
}

function HomeCard({
  href,
  icon: Icon,
  title,
  description,
  delay,
  color,
}: {
  href: string;
  icon: any;
  title: string;
  description: string;
  delay: number;
  color: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Link href={href} className="group block h-full">
      <Card
        className={cn(
          'h-full transition-all duration-500 ease-out border-muted/40 bg-card/50 backdrop-blur-sm hover:bg-card hover:shadow-lg hover:border-primary/20',
          mounted
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-8 scale-95'
        )}
      >
        <CardHeader className="gap-2">
          <div className="flex items-center justify-between">
            <div
              className={cn(
                'p-2 rounded-lg bg-background shadow-sm border ring-1 ring-inset ring-muted transition-transform group-hover:scale-110 duration-300',
                color
              )}
            >
              <Icon className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
          </div>
          <CardTitle className="text-xl group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
          <CardDescription className="line-clamp-2 text-base">
            {description}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
