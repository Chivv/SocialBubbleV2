-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum for user roles
CREATE TYPE user_role AS ENUM ('social_bubble', 'client', 'creator');

-- Enum for client status
CREATE TYPE client_status AS ENUM ('onboarding', 'active', 'lost');

-- Creators table
CREATE TABLE creators (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL,
  primary_language TEXT NOT NULL,
  has_dog BOOLEAN NOT NULL DEFAULT false,
  has_children BOOLEAN NOT NULL DEFAULT false,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  website_url TEXT,
  profile_picture_url TEXT,
  introduction_video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Clients table
CREATE TABLE clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name TEXT NOT NULL,
  website TEXT NOT NULL,
  interesting_competitors TEXT,
  differentiation TEXT,
  cool_ads_brands TEXT,
  content_folder_link TEXT,
  brand_assets_url TEXT,
  ideal_customer TEXT,
  customer_problems TEXT,
  customer_objections TEXT,
  recent_research TEXT,
  pricing_info TEXT,
  cold_friendly_offer TEXT,
  contract_email TEXT NOT NULL,
  contract_full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  kvk TEXT NOT NULL,
  invoice_details TEXT,
  status client_status DEFAULT 'onboarding',
  creators_count INTEGER DEFAULT 0,
  briefings_count INTEGER DEFAULT 0,
  creatives_count INTEGER DEFAULT 0,
  invoice_date INTEGER CHECK (invoice_date >= 1 AND invoice_date <= 31),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Client users table (for multiple users per client)
CREATE TABLE client_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- User roles table (maps Clerk users to roles)
CREATE TABLE user_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for better performance
CREATE INDEX idx_creators_clerk_user_id ON creators(clerk_user_id);
CREATE INDEX idx_client_users_clerk_user_id ON client_users(clerk_user_id);
CREATE INDEX idx_client_users_client_id ON client_users(client_id);
CREATE INDEX idx_user_roles_clerk_user_id ON user_roles(clerk_user_id);

-- Row Level Security (RLS) policies
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Creators can view and edit their own profile
CREATE POLICY "Creators can view own profile" ON creators
  FOR SELECT USING (clerk_user_id = auth.uid()::text);

CREATE POLICY "Creators can update own profile" ON creators
  FOR UPDATE USING (clerk_user_id = auth.uid()::text);

-- Social Bubble colleagues can view all creators and clients
CREATE POLICY "Social Bubble can view all creators" ON creators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE clerk_user_id = auth.uid()::text 
      AND role = 'social_bubble'
    )
  );

CREATE POLICY "Social Bubble can view all clients" ON clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE clerk_user_id = auth.uid()::text 
      AND role = 'social_bubble'
    )
  );

CREATE POLICY "Social Bubble can update clients" ON clients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE clerk_user_id = auth.uid()::text 
      AND role = 'social_bubble'
    )
  );

-- Client users can view their own company
CREATE POLICY "Client users can view own company" ON clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM client_users 
      WHERE clerk_user_id = auth.uid()::text 
      AND client_id = clients.id
    )
  );

-- Client users can view other users in their company
CREATE POLICY "Client users can view company users" ON client_users
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM client_users 
      WHERE clerk_user_id = auth.uid()::text
    )
  );

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updating timestamps
CREATE TRIGGER update_creators_updated_at BEFORE UPDATE ON creators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_users_updated_at BEFORE UPDATE ON client_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();