import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/types';

export function useUserRole() {
  const { user, isLoaded } = useUser();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      if (!isLoaded || !user) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('clerk_user_id', user.id)
          .maybeSingle();

        console.log('User role query result:', { data, error, userId: user.id });

        if (error) {
          console.error('Error fetching user role:', error);
        } else if (data) {
          setRole(data.role as UserRole);
        }
        // If no data and no error, user hasn't selected a role yet
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [user, isLoaded]);

  return { role, loading, isLoaded };
}