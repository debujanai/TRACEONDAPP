-- Add credits column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS credits INT DEFAULT 100 NOT NULL;

-- Update existing profiles to have 100 credits
UPDATE profiles 
SET credits = 100 
WHERE credits IS NULL;

-- Create an index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address 
ON profiles(wallet_address);

-- Create a function to update credits
CREATE OR REPLACE FUNCTION update_user_credits(
    wallet_address_param TEXT,
    credits_change INT
) RETURNS BOOLEAN AS $$
DECLARE
    current_credits INT;
BEGIN
    -- Get current credits
    SELECT credits INTO current_credits 
    FROM profiles 
    WHERE wallet_address = wallet_address_param;

    -- Check if user has enough credits for deduction
    IF credits_change < 0 AND (current_credits + credits_change) < 0 THEN
        RETURN FALSE;
    END IF;

    -- Update credits
    UPDATE profiles 
    SET credits = credits + credits_change 
    WHERE wallet_address = wallet_address_param;

    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql; 