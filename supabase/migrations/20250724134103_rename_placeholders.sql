-- Rename briefing_client_domain to client_domain
UPDATE global_placeholders 
SET key = 'client_domain' 
WHERE key = 'briefing_client_domain';

-- Rename briefing_client_brandname to client_brandname
UPDATE global_placeholders 
SET key = 'client_brandname' 
WHERE key = 'briefing_client_brandname';

-- Add briefing_ prefix to video_instructions
UPDATE global_placeholders 
SET key = 'briefing_video_instructions' 
WHERE key = 'video_instructions';

-- Add briefing_ prefix to expectations
UPDATE global_placeholders 
SET key = 'briefing_expectations' 
WHERE key = 'expectations';

-- Add briefing_ prefix to scripts
UPDATE global_placeholders 
SET key = 'briefing_scripts' 
WHERE key = 'scripts';