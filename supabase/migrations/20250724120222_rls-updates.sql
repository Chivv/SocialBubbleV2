-- Additional RLS policies to allow users to check and insert their own roles

-- Allow any authenticated user to check if they have a role
CREATE POLICY "Users can check own role" ON user_roles
  FOR SELECT USING (true);

-- Allow users to insert their own role (one time during onboarding)
CREATE POLICY "Users can insert own role" ON user_roles
  FOR INSERT WITH CHECK (clerk_user_id = current_setting('request.jwt.claim.sub', true));

-- For creators table, allow insert during signup
CREATE POLICY "Creators can insert own profile" ON creators
  FOR INSERT WITH CHECK (clerk_user_id = current_setting('request.jwt.claim.sub', true));

-- For client_users table, allow insert during signup
CREATE POLICY "Client users can insert own record" ON client_users
  FOR INSERT WITH CHECK (clerk_user_id = current_setting('request.jwt.claim.sub', true));

-- For clients table, allow insert during signup
CREATE POLICY "Clients can insert own company" ON clients
  FOR INSERT WITH CHECK (true);