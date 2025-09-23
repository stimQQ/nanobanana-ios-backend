-- URGENT: Fix Image Generations Table
-- Run this in Supabase SQL Editor NOW to fix image persistence

-- 1. Add missing model column
ALTER TABLE image_generations
ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'gemini-2.5-flash-image-preview';

-- 2. Ensure all required columns exist
ALTER TABLE image_generations
ADD COLUMN IF NOT EXISTS output_image_url TEXT;

ALTER TABLE image_generations
ADD COLUMN IF NOT EXISTS input_images TEXT[] DEFAULT '{}';

ALTER TABLE image_generations
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

ALTER TABLE image_generations
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

ALTER TABLE image_generations
ADD COLUMN IF NOT EXISTS generation_type TEXT DEFAULT 'text-to-image';

ALTER TABLE image_generations
ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 1;

ALTER TABLE image_generations
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_image_generations_user_id
ON image_generations(user_id);

CREATE INDEX IF NOT EXISTS idx_image_generations_created_at
ON image_generations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_image_generations_status
ON image_generations(status);

-- 4. Show updated structure
SELECT
    column_name,
    data_type,
    column_default
FROM
    information_schema.columns
WHERE
    table_name = 'image_generations'
ORDER BY
    ordinal_position;