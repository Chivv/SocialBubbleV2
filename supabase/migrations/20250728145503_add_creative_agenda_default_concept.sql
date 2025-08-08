-- Ensure creative_agenda_default_concept placeholder exists
-- Using INSERT ... ON CONFLICT to handle if it already exists
INSERT INTO global_placeholders (key, name, content) VALUES 
(
  'creative_agenda_default_concept',
  'Creative Agenda Default Concept',
  jsonb_build_object(
    'type', 'doc',
    'content', jsonb_build_array(
      jsonb_build_object('type', 'heading', 'attrs', jsonb_build_object('level', 1), 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', 'Concept Brief'))),
      jsonb_build_object('type', 'paragraph'),
      jsonb_build_object('type', 'heading', 'attrs', jsonb_build_object('level', 2), 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', 'Objective'))),
      jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', 'Define the main objective and goals for this concept.'))),
      jsonb_build_object('type', 'paragraph'),
      jsonb_build_object('type', 'heading', 'attrs', jsonb_build_object('level', 2), 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', 'Target Audience'))),
      jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', 'Describe the target audience and their characteristics.'))),
      jsonb_build_object('type', 'paragraph'),
      jsonb_build_object('type', 'heading', 'attrs', jsonb_build_object('level', 2), 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', 'Key Message'))),
      jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', 'What is the core message we want to communicate?'))),
      jsonb_build_object('type', 'paragraph'),
      jsonb_build_object('type', 'heading', 'attrs', jsonb_build_object('level', 2), 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', 'Creative Direction'))),
      jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', 'Outline the creative approach and visual style.'))),
      jsonb_build_object('type', 'paragraph'),
      jsonb_build_object('type', 'heading', 'attrs', jsonb_build_object('level', 2), 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', 'Format & Specifications'))),
      jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', 'Specify the format (video/static), dimensions, and any technical requirements.'))),
      jsonb_build_object('type', 'paragraph'),
      jsonb_build_object('type', 'heading', 'attrs', jsonb_build_object('level', 2), 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', 'Deliverables'))),
      jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', 'List all expected deliverables and deadlines.')))
    )
  )
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  content = EXCLUDED.content;