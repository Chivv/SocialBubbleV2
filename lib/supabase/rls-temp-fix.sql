-- Temporary RLS policies to allow operations
-- In production, you would integrate Clerk JWT with Supabase for proper auth

-- Drop existing policies
DROP POLICY IF EXISTS "Creators can view own profile" ON creators;
DROP POLICY IF EXISTS "Creators can update own profile" ON creators;
DROP POLICY IF EXISTS "Social Bubble can view all creators" ON creators;
DROP POLICY IF EXISTS "Social Bubble can view all clients" ON clients;
DROP POLICY IF EXISTS "Social Bubble can update clients" ON clients;
DROP POLICY IF EXISTS "Client users can view own company" ON clients;
DROP POLICY IF EXISTS "Client users can view company users" ON client_users;

-- Allow all operations for now (temporary - replace with proper Clerk integration)
CREATE POLICY "Allow all user_roles select" ON user_roles FOR SELECT USING (true);
CREATE POLICY "Allow all user_roles insert" ON user_roles FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all creators select" ON creators FOR SELECT USING (true);
CREATE POLICY "Allow all creators insert" ON creators FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all creators update" ON creators FOR UPDATE USING (true);

CREATE POLICY "Allow all clients select" ON clients FOR SELECT USING (true);
CREATE POLICY "Allow all clients insert" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all clients update" ON clients FOR UPDATE USING (true);

CREATE POLICY "Allow all client_users select" ON client_users FOR SELECT USING (true);
CREATE POLICY "Allow all client_users insert" ON client_users FOR INSERT WITH CHECK (true);