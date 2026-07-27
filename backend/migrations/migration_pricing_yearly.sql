-- Add yearly_subscription_price_usd column to app_settings
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS yearly_subscription_price_usd NUMERIC(10, 2) DEFAULT 99.99;

-- Update existing seed row if present
UPDATE public.app_settings 
SET yearly_subscription_price_usd = 99.99 
WHERE id = 'global' AND yearly_subscription_price_usd IS NULL;
