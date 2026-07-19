CREATE TABLE IF NOT EXISTS `players` (
  `id` text PRIMARY KEY NOT NULL,
  `username` text NOT NULL UNIQUE,
  `password_hash` text NOT NULL,
  `created_at` integer NOT NULL,
  `last_login` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `characters` (
  `id` text PRIMARY KEY NOT NULL,
  `player_id` text NOT NULL UNIQUE REFERENCES `players`(`id`),
  `name` text NOT NULL,
  `location_room_id` text NOT NULL DEFAULT 'changan.inn',
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `innate_attrs` (
  `character_id` text PRIMARY KEY NOT NULL REFERENCES `characters`(`id`),
  `strength` integer NOT NULL,
  `intelligence` integer NOT NULL,
  `dexterity` integer NOT NULL,
  `constitution` integer NOT NULL
);
