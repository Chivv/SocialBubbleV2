'use client';

import { Home, Users, Building2, UserCircle, FileText, Settings, Lightbulb, Camera, Receipt, Calendar, Send, Zap, TestTube, Mail, Upload, ChevronRight, Code2, Edit, BookOpen } from 'lucide-react';
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userRole: UserRole;
  userEmail?: string;
}

export function AppSidebar({ userRole, userEmail, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const [testingOpen, setTestingOpen] = useState(false);
  const [developmentOpen, setDevelopmentOpen] = useState(false);
  const [clientsOpen, setClientsOpen] = useState(false);
  const [creativeAgendaOpen, setCreativeAgendaOpen] = useState(false);
  const [creatorsOpen, setCreatorsOpen] = useState(false);

  const getNavItems = () => {
    switch (userRole) {
      case 'social_bubble':
        const baseItems = [
          { href: '/dashboard/social-bubble', label: 'Dashboard', icon: Home },
        ];
        
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

  // Creators dropdown items for social_bubble role
  const creatorsItems = userRole === 'social_bubble' ? [
    { href: '/dashboard/creators', label: 'Creators', icon: Users },
    { href: '/dashboard/invoices', label: 'Invoice Management', icon: Receipt },
  ] : [];

  // Client items for social_bubble role
  const clientItems = userRole === 'social_bubble' ? [
    { href: '/dashboard/clients', label: 'Clients', icon: Building2 },
    { href: '/dashboard/creative-strategies', label: 'Creative Strategies', icon: Lightbulb },
  ] : [];

  // Creative Agenda items for social_bubble role
  const creativeAgendaItems = userRole === 'social_bubble' ? [
    { href: '/dashboard/creative-agenda/concepting', label: 'Concepting', icon: Lightbulb },
    { href: '/dashboard/creative-agenda/editing', label: 'Editing', icon: Edit },
    { href: '/dashboard/creative-agenda/publication', label: 'Publication', icon: BookOpen },
    { href: '/dashboard/briefings', label: 'Briefings', icon: FileText },
    { href: '/dashboard/castings', label: 'Castings', icon: Camera },
  ] : [];

  // Development items for bas@bubbleads.nl - added Google Drive
  const developmentItems = (userRole === 'social_bubble' && userEmail === 'bas@bubbleads.nl') ? [
    { href: '/dashboard/creator-imports', label: 'Creator Imports', icon: Upload },
    { href: '/dashboard/settings/automations', label: 'Automations', icon: Zap },
    { href: '/dashboard/settings/placeholders', label: 'Placeholders', icon: Settings },
    { href: '/dashboard/settings/google-drive', label: 'Google Drive', icon: Settings },
  ] : [];

  // Test items for social_bubble role
  const testItems = userRole === 'social_bubble' ? [
    { href: '/dashboard/test-slack', label: 'Test Slack', icon: Send },
    { href: '/dashboard/test-email', label: 'Test Email', icon: Mail },
    { href: '/dashboard/test-workflow', label: 'Test Workflow', icon: TestTube },
  ] : [];

  // Check if dropdowns should be active
  const isCreatorsActive = creatorsItems.some(item => pathname === item.href || pathname.startsWith(item.href + '/'));
  const isClientsActive = clientItems.some(item => pathname === item.href || pathname.startsWith(item.href + '/'));
  const isCreativeAgendaActive = creativeAgendaItems.some(item => pathname === item.href || pathname.startsWith(item.href + '/'));
  const isDevelopmentActive = developmentItems.some(item => pathname === item.href || pathname.startsWith(item.href + '/'));
  const isTestingActive = testItems.some(item => pathname === item.href || pathname.startsWith(item.href + '/'));

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

              {/* Creative Agenda dropdown - moved under Dashboard */}
              {creativeAgendaItems.length > 0 && (
                <Collapsible open={creativeAgendaOpen} onOpenChange={setCreativeAgendaOpen}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="w-full" isActive={isCreativeAgendaActive}>
                        <Calendar className="h-4 w-4" />
                        <span>Creative Agenda</span>
                        <ChevronRight className={`ml-auto h-4 w-4 transition-transform duration-200 ${creativeAgendaOpen ? 'rotate-90' : ''}`} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {creativeAgendaItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href;
                          return (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton asChild isActive={isActive}>
                                <Link href={item.href}>
                                  <Icon className="h-4 w-4" />
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}

              {/* Creators dropdown for social_bubble role */}
              {creatorsItems.length > 0 && (
                <Collapsible open={creatorsOpen} onOpenChange={setCreatorsOpen}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="w-full" isActive={isCreatorsActive}>
                        <Users className="h-4 w-4" />
                        <span>Creators</span>
                        <ChevronRight className={`ml-auto h-4 w-4 transition-transform duration-200 ${creatorsOpen ? 'rotate-90' : ''}`} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {creatorsItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href;
                          return (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton asChild isActive={isActive}>
                                <Link href={item.href}>
                                  <Icon className="h-4 w-4" />
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
              
              {/* Clients dropdown for social_bubble role */}
              {clientItems.length > 0 && (
                <Collapsible open={clientsOpen} onOpenChange={setClientsOpen}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="w-full" isActive={isClientsActive}>
                        <Building2 className="h-4 w-4" />
                        <span>Clients</span>
                        <ChevronRight className={`ml-auto h-4 w-4 transition-transform duration-200 ${clientsOpen ? 'rotate-90' : ''}`} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {clientItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href;
                          return (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton asChild isActive={isActive}>
                                <Link href={item.href}>
                                  <Icon className="h-4 w-4" />
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}

              {/* Development dropdown for bas@bubbleads.nl */}
              {developmentItems.length > 0 && (
                <Collapsible open={developmentOpen} onOpenChange={setDevelopmentOpen}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="w-full" isActive={isDevelopmentActive}>
                        <Code2 className="h-4 w-4" />
                        <span>Development</span>
                        <ChevronRight className={`ml-auto h-4 w-4 transition-transform duration-200 ${developmentOpen ? 'rotate-90' : ''}`} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {developmentItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href;
                          return (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton asChild isActive={isActive}>
                                <Link href={item.href}>
                                  <Icon className="h-4 w-4" />
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
              
              {/* Testing dropdown for social_bubble role */}
              {testItems.length > 0 && (
                <Collapsible open={testingOpen} onOpenChange={setTestingOpen}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="w-full" isActive={isTestingActive}>
                        <TestTube className="h-4 w-4" />
                        <span>Testing</span>
                        <ChevronRight className={`ml-auto h-4 w-4 transition-transform duration-200 ${testingOpen ? 'rotate-90' : ''}`} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {testItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href;
                          return (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton asChild isActive={isActive}>
                                <Link href={item.href}>
                                  <Icon className="h-4 w-4" />
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
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