'use client';

import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type ActionCardProps = {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
};

export function ActionCard({
  href,
  icon: Icon,
  title,
  description,
  color,
}: ActionCardProps) {
  return (
    <Link
      href={href}
      className="group block h-full rounded-xl outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card
        className={cn(
          'h-full transition-colors bg-transparent hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <CardHeader className="gap-2">
          <div className="flex items-center justify-between">
            <div
              className={cn(
                'p-2 rounded-lg bg-muted transition-colors group-hover:bg-background',
                color
              )}
            >
              <Icon className="w-6 h-6" />
            </div>
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
