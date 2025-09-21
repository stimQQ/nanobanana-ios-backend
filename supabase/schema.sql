-- Create enum for subscription tiers
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'pro', 'premium');

-- Create enum for payment status
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');

-- Create users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    apple_id TEXT UNIQUE NOT NULL,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    credits INTEGER DEFAULT 40, -- Initial 40 credits for new users
    free_attempts INTEGER DEFAULT 10, -- Initial 10 free attempts
    subscription_tier subscription_tier DEFAULT 'free',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    language_code VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    apple_transaction_id TEXT UNIQUE,
    tier subscription_tier NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    credits_per_month INTEGER NOT NULL,
    images_per_month INTEGER NOT NULL,
    status payment_status DEFAULT 'pending',
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create image_generations table
CREATE TABLE image_generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    input_images TEXT[], -- Array of image URLs for image-to-image
    output_image_url TEXT,
    generation_type VARCHAR(50) CHECK (generation_type IN ('text-to-image', 'image-to-image')),
    credits_used INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credit_transactions table for tracking credit usage
CREATE TABLE credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Positive for credit addition, negative for usage
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('subscription', 'purchase', 'usage', 'refund', 'initial')),
    description TEXT,
    related_id UUID, -- Can reference subscription_id or image_generation_id
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_history table
CREATE TABLE payment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    apple_transaction_id TEXT UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status payment_status DEFAULT 'pending',
    receipt_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create uploaded_images table for storing user uploads
CREATE TABLE uploaded_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    storage_path TEXT NOT NULL,
    public_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_users_apple_id ON users(apple_id);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_image_generations_user_id ON image_generations(user_id);
CREATE INDEX idx_image_generations_status ON image_generations(status);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_uploaded_images_user_id ON uploaded_images(user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update the updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to reset monthly credits for subscriptions
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void AS $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN
        SELECT u.id, u.subscription_tier, s.credits_per_month
        FROM users u
        LEFT JOIN subscriptions s ON u.id = s.user_id
        WHERE u.subscription_tier != 'free'
        AND s.expires_at > NOW()
        AND s.status = 'completed'
    LOOP
        UPDATE users
        SET credits = user_record.credits_per_month
        WHERE id = user_record.id;

        INSERT INTO credit_transactions (
            user_id,
            amount,
            transaction_type,
            description,
            balance_after
        ) VALUES (
            user_record.id,
            user_record.credits_per_month,
            'subscription',
            'Monthly credit reset',
            user_record.credits_per_month
        );
    END LOOP;
END;
$$ LANGUAGE 'plpgsql';

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_images ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY users_policy ON users
    FOR ALL USING (auth.uid()::text = id::text);

CREATE POLICY subscriptions_policy ON subscriptions
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY image_generations_policy ON image_generations
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY credit_transactions_policy ON credit_transactions
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY payment_history_policy ON payment_history
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY uploaded_images_policy ON uploaded_images
    FOR ALL USING (auth.uid()::text = user_id::text);