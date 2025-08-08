'use client';

import { Home, Users, Building2, UserCircle, FileText, Settings, Lightbulb, Camera, Receipt, Calendar, Send, Zap, TestTube, Mail, Upload } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { UserRole } from '@/types';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userRole: UserRole;
  userEmail?: string;
}

export function AppSidebar({ userRole, userEmail, ...props }: AppSidebarProps) {
  const pathname = usePathname();

  const getNavItems = () => {
    switch (userRole) {
      case 'social_bubble':
        const baseItems = [
          { href: '/dashboard/social-bubble', label: 'Dashboard', icon: Home },
          { href: '/dashboard/creators', label: 'Creators', icon: Users },
          { href: '/dashboard/clients', label: 'Clients', icon: Building2 },
          { href: '/dashboard/briefings', label: 'Briefings', icon: FileText },
          { href: '/dashboard/creative-strategies', label: 'Creative Strategies', icon: Lightbulb },
          { href: '/dashboard/castings', label: 'Castings', icon: Camera },
          { href: '/dashboard/creative-agenda', label: 'Creative Agenda', icon: Calendar },
          { href: '/dashboard/invoices', label: 'Invoice Management', icon: Receipt },
          { href: '/dashboard/settings/placeholders', label: 'Placeholders', icon: Settings },
          { href: '/dashboard/settings/automations', label: 'Automations', icon: Zap },
          { href: '/dashboard/settings/google-drive', label: 'Google Drive', icon: Settings },
          { href: '/dashboard/test-slack', label: 'Test Slack', icon: Send },
          { href: '/dashboard/test-email', label: 'Test Email', icon: Mail },
          { href: '/dashboard/test-workflow', label: 'Test Workflow', icon: TestTube },
        ];
        
        // Add creator imports for bas@bubbleads.nl
        if (userEmail === 'bas@bubbleads.nl') {
          baseItems.splice(2, 0, { href: '/dashboard/creator-imports', label: 'Creator Imports', icon: Upload });
        }
        
        return baseItems;
      case 'creator':
        return [
          { href: '/dashboard/creator', label: 'Dashboard', icon: Home },
          { href: '/dashboard/creator/opportunities', label: 'Opportunities', icon: Camera },
          { href: '/dashboard/creator/briefings', label: 'Briefings', icon: FileText },
          { href: '/dashboard/creator/invoices', label: 'Invoices', icon: Receipt },
          { href: '/dashboard/creator/profile', label: 'Profile', icon: UserCircle },
        ];
      case 'client':
        return [
          { href: '/dashboard/client', label: 'Dashboard', icon: Home },
          { href: '/dashboard/client/castings', label: 'Castings', icon: Camera },
          { href: '/dashboard/creative-strategy', label: 'Creative Strategy', icon: Lightbulb },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex h-12 items-center px-2">
          <h2 className="text-lg font-semibold">Social Bubble</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-3 p-2">
          <UserButton afterSignOutUrl="/" />
          <div className="flex flex-col flex-1 truncate">
            <p className="text-sm font-medium truncate">Account</p>
            <p className="text-xs text-muted-foreground capitalize truncate">
              {userRole.replace('_', ' ')}
            </p>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}