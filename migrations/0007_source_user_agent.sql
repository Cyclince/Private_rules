ALTER TABLE category_sources ADD COLUMN user_agent TEXT DEFAULT 'clash-verge/v2.5.1';

UPDATE category_sources
SET user_agent = 'clash-verge/v2.5.1'
WHERE user_agent IS NULL OR TRIM(user_agent) = '';
