-- Fix Image Persistence Database Schema
-- This migration ensures the image_generations table has the correct structure

-- 1. Check if output_image_url column exists, if not rename image_url
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'image_generations'
        AND column_name = 'image_url'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'image_generations'
        AND column_name = 'output_image_url'
    ) THEN
        ALTER TABLE image_generations
        RENAME COLUMN image_url TO output_image_url;
        RAISE NOTICE 'Renamed image_url to output_image_url';
    END IF;
END $$;

-- 2. Ensure output_image_url column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'image_generations'
        AND column_name = 'output_image_url'
    ) THEN
        ALTER TABLE image_generations
        ADD COLUMN output_image_url TEXT;
        RAISE NOTICE 'Added output_image_url column';
    END IF;
END $$;

-- 3. Ensure input_images column exists (for image-to-image)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'image_generations'
        AND column_name = 'input_images'
    ) THEN
        ALTER TABLE image_generations
        ADD COLUMN input_images TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added input_images column';
    END IF;
END $$;

-- 4. Ensure status column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'image_generations'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE image_generations
        ADD COLUMN status TEXT DEFAULT 'pending';
        RAISE NOTICE 'Added status column';
    END IF;
END $$;

-- 5. Ensure metadata column exists (JSONB)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'image_generations'
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE image_generations
        ADD COLUMN metadata JSONB DEFAULT '{}';
        RAISE NOTICE 'Added metadata column';
    END IF;
END $$;

-- 6. Remove language column if it exists (moved to metadata)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'image_generations'
        AND column_name = 'language'
    ) THEN
        -- First, migrate existing language data to metadata
        UPDATE image_generations
        SET metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{language}',
            to_jsonb(language)
        )
        WHERE language IS NOT NULL;

        -- Then drop the column
        ALTER TABLE image_generations
        DROP COLUMN language;
        RAISE NOTICE 'Migrated and removed language column';
    END IF;
END $$;

-- 7. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_image_generations_user_id
ON image_generations(user_id);

CREATE INDEX IF NOT EXISTS idx_image_generations_created_at
ON image_generations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_image_generations_status
ON image_generations(status);

-- 8. Show current table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM
    information_schema.columns
WHERE
    table_name = 'image_generations'
ORDER BY
    ordinal_position;

-- 9. Show recent generations to verify data
SELECT
    id,
    user_id,
    prompt,
    output_image_url IS NOT NULL as has_image,
    status,
    created_at
FROM
    image_generations
ORDER BY
    created_at DESC
LIMIT 5;