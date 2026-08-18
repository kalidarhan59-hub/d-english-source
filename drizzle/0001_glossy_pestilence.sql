CREATE TABLE `learning_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentLevel` varchar(2) NOT NULL DEFAULT 'A0',
	`xp` int NOT NULL DEFAULT 0,
	`streak` int NOT NULL DEFAULT 0,
	`completedLessons` int NOT NULL DEFAULT 0,
	`lastActiveAt` timestamp,
	`mascotStage` varchar(2) NOT NULL DEFAULT 'A0',
	`interfaceTheme` enum('light','dark','system') NOT NULL DEFAULT 'system',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `learning_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lessonId` varchar(80) NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`completed` int NOT NULL DEFAULT 0,
	`xpAwarded` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lesson_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `lesson_progress_user_lesson_idx` UNIQUE(`userId`,`lessonId`)
);
