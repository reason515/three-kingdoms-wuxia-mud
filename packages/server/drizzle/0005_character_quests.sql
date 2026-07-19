CREATE TABLE IF NOT EXISTS `character_quests` (
  `character_id` text NOT NULL REFERENCES `characters`(`id`),
  `quest_id` text NOT NULL,
  `current_step_index` integer NOT NULL DEFAULT 0,
  `completed` integer NOT NULL DEFAULT 0,
  `completed_at` integer,
  PRIMARY KEY (`character_id`, `quest_id`)
);
