CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`detectionId` int,
	`action` enum('VIEW','DELETE','EXPORT') NOT NULL,
	`ipAddress` varchar(45),
	`actionAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `detections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plateText` varchar(20) NOT NULL,
	`confidence` int NOT NULL,
	`bbox` text NOT NULL,
	`originalImageUrl` text NOT NULL,
	`croppedImageUrl` text,
	`status` enum('OK','LOW_CONFIDENCE','NO_PLATE_FOUND','MANUAL_REVIEW') NOT NULL DEFAULT 'OK',
	`cameraId` varchar(64),
	`userId` int,
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `detections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `systemConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configKey` varchar(64) NOT NULL,
	`configValue` text NOT NULL,
	`description` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `systemConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `systemConfig_configKey_unique` UNIQUE(`configKey`)
);
--> statement-breakpoint
ALTER TABLE `auditLogs` ADD CONSTRAINT `auditLogs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auditLogs` ADD CONSTRAINT `auditLogs_detectionId_detections_id_fk` FOREIGN KEY (`detectionId`) REFERENCES `detections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `detections` ADD CONSTRAINT `detections_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;