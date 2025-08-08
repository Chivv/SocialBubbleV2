'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Edit, Globe, ArrowRight, Calendar, Users } from 'lucide-react';

interface CreativeAgendaHubProps {
  stats: {
    concepting: number;
    editing: number;
    publication: number;
  };
}

export function CreativeAgendaHub({ stats }: CreativeAgendaHubProps) {
  const router = useRouter();

  const departments = [
    {
      title: 'Concepting',
      description: 'Create and refine content concepts before production',
      icon: Lightbulb,
      href: '/dashboard/creative-agenda/concepting',
      count: stats.concepting,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    },
    {
      title: 'Editing',
      description: 'Manage content production and creator submissions',
      icon: Edit,
      href: '/dashboard/creative-agenda/editing',
      count: stats.editing,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    },
    {
      title: 'Publication',
      description: 'Final approval, publishing, and media buying',
      icon: Globe,
      href: '/dashboard/creative-agenda/publication',
      count: stats.publication,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Creative Agenda</h1>
        <p className="text-muted-foreground mt-1">
          Manage your content creation workflow across all departments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {departments.map((dept) => {
          const Icon = dept.icon;
          return (
            <Card 
              key={dept.title} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(dept.href)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${dept.bgColor}`}>
                    <Icon className={`h-6 w-6 ${dept.color}`} />
                  </div>
                  <span className="text-2xl font-bold">{dept.count}</span>
                </div>
                <CardTitle className="mt-4">{dept.title}</CardTitle>
                <CardDescription>{dept.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full justify-between">
                  Go to {dept.title}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Workflow Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full" />
              <span className="text-sm">
                <strong>Concepting:</strong> Ideas are developed and refined with client feedback
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-600 rounded-full" />
              <span className="text-sm">
                <strong>Editing:</strong> Approved concepts move to production with creators
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-600 rounded-full" />
              <span className="text-sm">
                <strong>Publication:</strong> Final approval and content distribution
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Card Types
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Briefing Cards</h3>
              <p className="text-sm text-muted-foreground">
                Automatically created from approved briefings and move through the workflow
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Concept Cards</h3>
              <p className="text-sm text-muted-foreground">
                Manually created content ideas with properties like format and video type
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}