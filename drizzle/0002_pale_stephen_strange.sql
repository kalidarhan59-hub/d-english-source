CREATE TABLE `assessment_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`assessmentType` enum('diagnostic','promotion','ielts') NOT NULL,
	`targetLevel` varchar(2) NOT NULL DEFAULT 'A0',
	`questionsPayload` text NOT NULL,
	`score` int,
	`passed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `assessment_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`taskDate` varchar(10) NOT NULL,
	`taskKey` varchar(80) NOT NULL,
	`taskType` varchar(32) NOT NULL,
	`level` varchar(8) NOT NULL,
	`difficulty` varchar(16) NOT NULL,
	`title` varchar(160) NOT NULL,
	`prompt` text NOT NULL,
	`expectedAnswer` text NOT NULL,
	`completed` int NOT NULL DEFAULT 0,
	`score` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_tasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `daily_tasks_user_date_key_idx` UNIQUE(`userId`,`taskDate`,`taskKey`)
);
--> statement-breakpoint
CREATE TABLE `essay_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`taskDate` varchar(10) NOT NULL,
	`topic` text NOT NULL,
	`body` text,
	`status` enum('new','draft','submitted') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `essay_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `essay_entries_user_date_idx` UNIQUE(`userId`,`taskDate`)
);
--> statement-breakpoint
CREATE TABLE `quest_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questKey` varchar(80) NOT NULL,
	`title` varchar(160) NOT NULL,
	`goal` int NOT NULL,
	`current` int NOT NULL DEFAULT 0,
	`completed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `quest_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `quest_progress_user_key_idx` UNIQUE(`userId`,`questKey`)
);
--> statement-breakpoint
CREATE TABLE `vocabulary_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`word` varchar(180) NOT NULL,
	`translation` varchar(240) NOT NULL,
	`source` varchar(120) NOT NULL,
	`mastery` int NOT NULL DEFAULT 1,
	`lastReviewedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vocabulary_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `vocabulary_progress_user_word_idx` UNIQUE(`userId`,`word`)
);
--> statement-breakpoint
ALTER TABLE `learning_profiles` ADD `diagnosticComplete` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `learning_profiles` ADD `diagnosticLevel` varchar(2) DEFAULT 'A0' NOT NULL;--> statement-breakpoint
ALTER TABLE `learning_profiles` ADD `diagnosticScore` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `learning_profiles` ADD `learningTrack` varchar(32) DEFAULT 'academic' NOT NULL;--> statement-breakpoint
ALTER TABLE `learning_profiles` ADD `careerTrack` varchar(100) DEFAULT 'engineering' NOT NULL;--> statement-breakpoint
ALTER TABLE `learning_profiles` ADD `academicStartedAt` timestamp;--> statement-breakpoint
ALTER TABLE `learning_profiles` ADD `dailyTaskCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `learning_profiles` ADD `dailyTaskDate` varchar(10);--> statement-breakpoint
ALTER TABLE `learning_profiles` ADD `promotionReady` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `learning_profiles` ADD `ieltsBand` varchar(4) DEFAULT '6.0' NOT NULL;