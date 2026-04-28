-- Run in your Vercel Postgres / Neon SQL editor
-- Creates the employees table used by alfahuman-dashboard auth

CREATE TABLE IF NOT EXISTS employees (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT        UNIQUE NOT NULL,
  name           TEXT        NOT NULL,
  password_hash  TEXT        NOT NULL,
  role           TEXT        NOT NULL DEFAULT 'viewer',  -- owner | admin | sales | viewer
  telegram_chat_id  BIGINT,
  telegram_user_id  BIGINT,
  registered_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Add initial users
-- Generate bcrypt hash: node -e "require('bcryptjs').hash('YOUR_PASSWORD',10).then(console.log)"
-- Then insert:
-- INSERT INTO employees (email, name, password_hash, role)
-- VALUES ('fede@example.com', 'Federico', '$2b$10$...', 'owner');
