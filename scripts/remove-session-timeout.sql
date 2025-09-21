-- Script to remove 30-minute session timeout and use persistent sessions

-- Drop the existing function
DROP FUNCTION IF EXISTS get_or_create_session(UUID);
DROP FUNCTION IF EXISTS get_or_create_session(UUID, INTEGER);

-- Create new function that always returns the same session for a user
-- No more timeout checks - just one persistent session per user
CREATE OR REPLACE FUNCTION get_or_create_session(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
BEGIN
    -- Get the user's existing session (if any)
    SELECT session_id INTO v_session_id
    FROM chat_messages
    WHERE user_id = p_user_id
    ORDER BY created_at ASC  -- Get the FIRST session ever created
    LIMIT 1;

    -- If no session exists, create a new one
    IF v_session_id IS NULL THEN
        v_session_id := gen_random_uuid();
    END IF;

    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_or_create_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_session(UUID) TO service_role;

-- Optional: Consolidate all existing sessions for each user into one
-- This will update all messages to use the earliest session_id for each user
DO $$
DECLARE
    user_record RECORD;
    first_session UUID;
BEGIN
    -- For each user with chat messages
    FOR user_record IN
        SELECT DISTINCT user_id
        FROM chat_messages
    LOOP
        -- Get the first session for this user
        SELECT session_id INTO first_session
        FROM chat_messages
        WHERE user_id = user_record.user_id
        ORDER BY created_at ASC
        LIMIT 1;

        -- Update all messages for this user to use the first session
        UPDATE chat_messages
        SET session_id = first_session
        WHERE user_id = user_record.user_id
        AND session_id != first_session;
    END LOOP;
END $$;

COMMENT ON FUNCTION get_or_create_session(UUID) IS
'Returns the persistent session ID for a user. Creates one if it doesn''t exist. No timeout - sessions are permanent.';