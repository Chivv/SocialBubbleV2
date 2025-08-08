'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Creator } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Globe, Dog, Baby, Eye, Calendar } from 'lucide-react';
import { getLanguageLabel } from '@/lib/constants/languages';
import { getLanguageEmoji } from '@/lib/constants/language-emojis';
import Link from 'next/link';
import Image from 'next/image';

export default function CreatorsListPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    async function fetchCreators() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('creators')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching creators:', error);
        } else if (data) {
          setCreators(data);
          setFilteredCreators(data);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCreators();
  }, []);

  useEffect(() => {
    const filtered = creators.filter(creator => {
      const searchLower = searchTerm.toLowerCase();
      return (
        creator.first_name.toLowerCase().includes(searchLower) ||
        creator.last_name.toLowerCase().includes(searchLower) ||
        creator.email.toLowerCase().includes(searchLower) ||
        creator.primary_language.toLowerCase().includes(searchLower)
      );
    });
    setFilteredCreators(filtered);
  }, [searchTerm, creators]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Loading creators...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">All Creators</h1>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search creators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredCreators.length} of {creators.length} creators
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCreators.map((creator) => (
          <Card key={creator.id} className="hover:shadow-lg transition-shadow overflow-hidden">
            <div className="aspect-square relative bg-muted">
              {creator.profile_picture_url ? (
                <Image
                  src={creator.profile_picture_url}
                  alt={`${creator.first_name} ${creator.last_name}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-6xl font-semibold text-muted-foreground">
                    {creator.first_name[0]}{creator.last_name[0]}
                  </div>
                </div>
              )}
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {creator.first_name} {creator.last_name}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-4 w-4" />
                      <span>{calculateAge(creator.date_of_birth)} years old</span>
                    </div>
                  </div>
                  <span className="text-3xl" title={getLanguageLabel(creator.primary_language)}>
                    {getLanguageEmoji(creator.primary_language)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {creator.has_dog && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Dog className="h-3 w-3" />
                    Has Dog
                  </Badge>
                )}
                {creator.has_children && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Baby className="h-3 w-3" />
                    Has Children
                  </Badge>
                )}
                {creator.website_url && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    Portfolio
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-muted-foreground">
                  Joined {new Date(creator.created_at).toLocaleDateString()}
                </div>
                <Link href={`/dashboard/creators/${creator.id}`}>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCreators.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No creators found matching your search.</p>
        </div>
      )}
    </div>
  );
}