-- Add is_super_admin column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Set admin@cerilas.com as super admin
UPDATE users SET is_super_admin = true WHERE email = 'admin@cerilas.com';

-- Verify
SELECT id, email, is_super_admin, is_org_admin FROM users WHERE email = 'admin@cerilas.com';
