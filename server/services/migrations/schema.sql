-- Create tables for dog breeding game
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  level INTEGER NOT NULL DEFAULT 1,
  experience INTEGER NOT NULL DEFAULT 0,
  plk INTEGER NOT NULL DEFAULT 50,
  lor INTEGER NOT NULL DEFAULT 100,
  gems INTEGER NOT NULL DEFAULT 5,
  last_resource_update TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dogs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  experience INTEGER NOT NULL DEFAULT 0,
  strength INTEGER NOT NULL DEFAULT 5,
  agility INTEGER NOT NULL DEFAULT 5,
  defense INTEGER NOT NULL DEFAULT 5,
  happiness INTEGER NOT NULL DEFAULT 50,
  loyalty INTEGER NOT NULL DEFAULT 50,
  energy INTEGER NOT NULL DEFAULT 100,
  is_adult BOOLEAN NOT NULL DEFAULT FALSE,
  parent1_id INTEGER REFERENCES dogs(id),
  parent2_id INTEGER REFERENCES dogs(id),
  breeding_cooldown TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS combat_encounters (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ongoing',
  difficulty INTEGER NOT NULL DEFAULT 1,
  plk_reward INTEGER NOT NULL,
  lor_reward INTEGER NOT NULL,
  gems_reward INTEGER NOT NULL,
  exp_reward INTEGER NOT NULL,
  current_turn INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS combat_participants (
  id SERIAL PRIMARY KEY,
  encounter_id INTEGER NOT NULL REFERENCES combat_encounters(id) ON DELETE CASCADE,
  dog_id INTEGER REFERENCES dogs(id),
  is_enemy BOOLEAN NOT NULL DEFAULT FALSE,
  name TEXT NOT NULL,
  current_hp INTEGER NOT NULL,
  max_hp INTEGER NOT NULL,
  strength INTEGER NOT NULL,
  agility INTEGER NOT NULL,
  defense INTEGER NOT NULL,
  position INTEGER NOT NULL,
  defeated BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS quests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  target INTEGER NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  plk_reward INTEGER NOT NULL,
  lor_reward INTEGER NOT NULL,
  gems_reward INTEGER NOT NULL,
  exp_reward INTEGER NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT,
  member_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, group_id)
);

CREATE TABLE IF NOT EXISTS group_messages (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_invites (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_by_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shop (
  id SERIAL PRIMARY KEY,
  item_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  currency_type TEXT NOT NULL,
  rarity TEXT,
  boost JSONB,
  available BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES shop(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price INTEGER NOT NULL,
  purchased_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create session table for express-session
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- Insert initial shop items
INSERT INTO shop (item_type, name, description, price, currency_type, rarity, boost, available)
VALUES
  ('dog', 'Golden Retriever', 'A loyal and friendly breed with excellent combat abilities', 100, 'lor', 'rare', '{"strength": 10, "agility": 8, "defense": 9}', true),
  ('dog', 'German Shepherd', 'A protective and intelligent breed with high defense', 150, 'lor', 'rare', '{"strength": 9, "agility": 10, "defense": 12}', true),
  ('dog', 'Husky', 'A fast and agile breed with high speed stats', 200, 'lor', 'rare', '{"strength": 8, "agility": 12, "defense": 7}', true),
  ('dog', 'Royal Guardian', 'A legendary breed specifically trained to protect royalty', 25, 'gems', 'legendary', '{"strength": 15, "agility": 13, "defense": 14}', true),
  ('booster', 'Training Manual', 'Gives +2 to all dog stats when used', 50, 'plk', null, '{"strength": 2, "agility": 2, "defense": 2}', true),
  ('booster', 'Happy Treat', 'Instantly boosts a dog''s happiness by 20 points', 15, 'plk', null, '{"happiness": 20}', true),
  ('booster', 'Loyalty Badge', 'Instantly boosts a dog''s loyalty by 20 points', 15, 'plk', null, '{"loyalty": 20}', true),
  ('booster', 'Energy Potion', 'Instantly refills a dog''s energy to full', 20, 'plk', null, '{"energy": 100}', true),
  ('currency', 'PLK Pack', 'Get 100 PLK instantly', 10, 'gems', null, null, true),
  ('currency', 'Lor Pack', 'Get 200 Lor instantly', 15, 'gems', null, null, true),
  ('currency', 'Gem Pack', 'Get 5 Gems instantly', 300, 'lor', null, null, true);