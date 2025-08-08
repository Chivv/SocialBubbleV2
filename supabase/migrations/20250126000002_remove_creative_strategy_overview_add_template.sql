-- Remove creative_strategy_client_overview column from clients table
ALTER TABLE clients DROP COLUMN IF EXISTS creative_strategy_client_overview;

-- Insert new global placeholder for creative strategy template
INSERT INTO global_placeholders (key, name, content)
VALUES (
  'creative_strategy_template',
  'Creative Strategy Template',
  '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Creative Strategy"}]},{"type":"paragraph","content":[{"type":"text","text":"This creative strategy document outlines the strategic approach for {{client_brandname}}."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Brand Overview"}]},{"type":"paragraph","content":[{"type":"text","text":"[Add brand overview here]"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Target Audience"}]},{"type":"paragraph","content":[{"type":"text","text":"[Define target audience]"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Key Messages"}]},{"type":"paragraph","content":[{"type":"text","text":"[List key messages]"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Creative Approach"}]},{"type":"paragraph","content":[{"type":"text","text":"[Describe creative approach]"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Content Pillars"}]},{"type":"paragraph","content":[{"type":"text","text":"[Define content pillars]"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Success Metrics"}]},{"type":"paragraph","content":[{"type":"text","text":"[Define success metrics]"}]}]}'::jsonb
) ON CONFLICT (key) DO NOTHING;