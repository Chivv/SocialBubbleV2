-- Create automation rules table (user-configured rules with conditions)
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_name TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  conditions JSONB DEFAULT '{"all": []}',
  execution_order INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create automation actions table (actions within rules)
CREATE TABLE automation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('slack_notification', 'email', 'webhook')),
  configuration JSONB NOT NULL DEFAULT '{}',
  execution_order INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create automation logs table (execution history)
CREATE TABLE automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_name TEXT NOT NULL,
  rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL,
  action_id UUID REFERENCES automation_actions(id) ON DELETE SET NULL,
  parameters JSONB DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'test', 'skipped')),
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  executed_by TEXT
);

-- Create indexes for performance
CREATE INDEX idx_automation_rules_trigger ON automation_rules(trigger_name);
CREATE INDEX idx_automation_rules_enabled ON automation_rules(enabled);
CREATE INDEX idx_automation_actions_rule ON automation_actions(rule_id);
CREATE INDEX idx_automation_actions_enabled ON automation_actions(enabled);
CREATE INDEX idx_automation_logs_trigger ON automation_logs(trigger_name);
CREATE INDEX idx_automation_logs_executed ON automation_logs(executed_at DESC);
CREATE INDEX idx_automation_logs_status ON automation_logs(status);

-- Add RLS policies
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

-- Rules and actions are manageable by specific users only
CREATE POLICY "Automation rules manageable by admins" ON automation_rules
  FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    auth.jwt()->>'email' IN ('bas@bubbleads.nl', 'kaylie@bubbleads.nl')
  );

CREATE POLICY "Automation actions manageable by admins" ON automation_actions
  FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    auth.jwt()->>'email' IN ('bas@bubbleads.nl', 'kaylie@bubbleads.nl')
  );

CREATE POLICY "Automation logs viewable by admins" ON automation_logs
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    auth.jwt()->>'email' IN ('bas@bubbleads.nl', 'kaylie@bubbleads.nl')
  );

CREATE POLICY "Automation logs insertable by service role" ON automation_logs
  FOR INSERT WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_automation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_updated_at();

CREATE TRIGGER update_automation_actions_updated_at
  BEFORE UPDATE ON automation_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_updated_at();