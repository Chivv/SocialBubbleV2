'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { UserButton } from '@clerk/nextjs';
import { Home, Users, Building2, UserCircle, LogOut, FileText, Lightbulb } from 'lucide-react';
import { UserRole } from '@/types';

interface DashboardNavProps {
  userRole: UserRole;
}

export function DashboardNav({ userRole }: DashboardNavProps) {
  const pathname = usePathname();

  const getNavItems = () => {
    switch (userRole) {
      case 'social_bubble':
        return [
          { href: '/dashboard/social-bubble', label: 'Dashboard', icon: Home },
          { href: '/dashboard/creators', label: 'Creators', icon: Users },
          { href: '/dashboard/clients', label: 'Clients', icon: Building2 },
          { href: '/dashboard/briefings', label: 'Briefings', icon: FileText },
          { href: '/dashboard/creative-strategies', label: 'Creative Strategies', icon: Lightbulb },
        ];
      case 'creator':
        return [
          { href: '/dashboard/creator', label: 'Dashboard', icon: Home },
          { href: '/dashboard/creator/profile', label: 'Profile', icon: UserCircle },
        ];
      case 'client':
        return [
          { href: '/dashboard/client', label: 'Dashboard', icon: Home },
          { href: '/dashboard/creative-strategy', label: 'Creative Strategy', icon: Lightbulb },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">Social Bubble</h2>
          <div className="flex items-center space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={pathname === item.href ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  );
}