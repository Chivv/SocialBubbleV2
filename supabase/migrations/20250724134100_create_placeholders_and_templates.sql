-- Create global placeholders table
CREATE TABLE global_placeholders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  content JSONB NOT NULL, -- Tiptap JSON content
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index on key for fast lookups
CREATE INDEX idx_global_placeholders_key ON global_placeholders(key);

-- Create briefing templates table
CREATE TABLE briefing_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  content JSONB NOT NULL, -- Tiptap JSON content with placeholders
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Ensure only one default template
CREATE UNIQUE INDEX idx_one_default_template ON briefing_templates (is_default) WHERE is_default = true;

-- Insert default global placeholders
INSERT INTO global_placeholders (key, name, content) VALUES
  ('briefing_intro', 'Briefing Introduction', '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Welcome to {{briefing_client_brandname}}"}]},{"type":"paragraph","content":[{"type":"text","text":"This briefing document contains all the information you need to create amazing content for {{briefing_client_brandname}}."}]}]}'),
  ('video_instructions', 'Video Instructions', '{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Video Creation Guidelines"}]},{"type":"paragraph","content":[{"type":"text","text":"Please follow these instructions when creating videos:"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Keep videos between 15-60 seconds"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Use vertical format (9:16 aspect ratio)"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Include captions for accessibility"}]}]}]}]}'),
  ('expectations', 'Expectations', '{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"What We Expect"}]},{"type":"paragraph","content":[{"type":"text","text":"We expect high-quality, authentic content that resonates with the target audience of {{briefing_client_brandname}}."}]}]}'),
  ('scripts', 'Scripts', '{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Content Scripts"}]},{"type":"paragraph","content":[{"type":"text","text":"Use the following scripts as inspiration for your content. Feel free to adapt them to your style while maintaining the key messages."}]}]}'),
  ('lifestyle_photos', 'Lifestyle Photos', '{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Lifestyle Photography Guidelines"}]},{"type":"paragraph","content":[{"type":"text","text":"Capture authentic moments that showcase {{briefing_client_brandname}} products in real-life situations."}]}]}');

-- Insert default briefing template
INSERT INTO briefing_templates (name, content, is_default) VALUES
  ('Default Briefing Template', 
   '{"type":"doc","content":[
     {"type":"paragraph","content":[{"type":"text","text":"{{briefing_intro}}"}]},
     {"type":"paragraph","content":[]},
     {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"About {{briefing_client_brandname}}"}]},
     {"type":"paragraph","content":[{"type":"text","text":"{{briefing_client_overview}}"}]},
     {"type":"paragraph","content":[]},
     {"type":"paragraph","content":[{"type":"text","text":"{{video_instructions}}"}]},
     {"type":"paragraph","content":[]},
     {"type":"paragraph","content":[{"type":"text","text":"{{expectations}}"}]},
     {"type":"paragraph","content":[]},
     {"type":"paragraph","content":[{"type":"text","text":"{{scripts}}"}]},
     {"type":"paragraph","content":[]},
     {"type":"paragraph","content":[{"type":"text","text":"{{lifestyle_photos}}"}]}
   ]}', 
   true);

-- Enable RLS
ALTER TABLE global_placeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefing_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for global_placeholders
-- Social Bubble can manage all placeholders
CREATE POLICY "Social Bubble can manage placeholders" ON global_placeholders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE clerk_user_id = auth.uid()::text 
      AND role = 'social_bubble'
    )
  );

-- Everyone can read placeholders (needed for replacement)
CREATE POLICY "Everyone can read placeholders" ON global_placeholders
  FOR SELECT USING (true);

-- RLS Policies for briefing_templates
-- Social Bubble can manage all templates
CREATE POLICY "Social Bubble can manage templates" ON briefing_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE clerk_user_id = auth.uid()::text 
      AND role = 'social_bubble'
    )
  );

-- Everyone can read templates
CREATE POLICY "Everyone can read templates" ON briefing_templates
  FOR SELECT USING (true);

-- Add updated_at triggers
CREATE TRIGGER update_global_placeholders_updated_at BEFORE UPDATE ON global_placeholders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_briefing_templates_updated_at BEFORE UPDATE ON briefing_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();