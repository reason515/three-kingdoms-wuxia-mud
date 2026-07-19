CREATE TABLE IF NOT EXISTS `training_states` (
  `character_id` text PRIMARY KEY NOT NULL REFERENCES `characters`(`id`),
  `skill_id` text NOT NULL,
  `started_at` integer NOT NULL
);
