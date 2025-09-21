-- Add Stripe-related columns to existing tables

-- Add Stripe customer ID to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Add Stripe-related columns to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS payment_provider TEXT CHECK (payment_provider IN ('apple', 'stripe'));

-- Add Stripe-related columns to payment_history table
ALTER TABLE payment_history
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS payment_provider TEXT CHECK (payment_provider IN ('apple', 'stripe'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_provider ON subscriptions(payment_provider);
CREATE INDEX IF NOT EXISTS idx_payment_history_stripe_session_id ON payment_history(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_history_payment_provider ON payment_history(payment_provider);

-- Add comments for documentation
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for web platform payments';
COMMENT ON COLUMN subscriptions.stripe_customer_id IS 'Stripe customer ID associated with this subscription';
COMMENT ON COLUMN subscriptions.stripe_subscription_id IS 'Stripe subscription ID for recurring payments';
COMMENT ON COLUMN subscriptions.stripe_price_id IS 'Stripe price ID for the subscription plan';
COMMENT ON COLUMN subscriptions.payment_provider IS 'Payment provider used: apple for iOS, stripe for web';
COMMENT ON COLUMN payment_history.stripe_payment_intent_id IS 'Stripe payment intent ID for the transaction';
COMMENT ON COLUMN payment_history.stripe_session_id IS 'Stripe checkout session ID';
COMMENT ON COLUMN payment_history.payment_provider IS 'Payment provider used for this transaction';