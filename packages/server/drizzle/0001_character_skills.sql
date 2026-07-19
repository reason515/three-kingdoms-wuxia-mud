CREATE TABLE IF NOT EXISTS `character_skills` (
  `character_id` text NOT NULL REFERENCES `characters`(`id`),
  `skill_id` text NOT NULL,
  `proficiency` integer NOT NULL DEFAULT 0,
  PRIMARY KEY (`character_id`, `skill_id`)
);
