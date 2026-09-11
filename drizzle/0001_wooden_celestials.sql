CREATE TABLE `actRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`organization` varchar(220) NOT NULL,
	`email` varchar(320) NOT NULL,
	`country` varchar(180) NOT NULL,
	`sector` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`status` enum('RECEIVED','QUALIFYING','QUALIFIED','CLOSED') NOT NULL DEFAULT 'RECEIVED',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `actRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(180) NOT NULL,
	`titleFr` varchar(260) NOT NULL,
	`titleEn` varchar(260) NOT NULL,
	`summaryFr` text,
	`summaryEn` text,
	`bodyFr` text,
	`bodyEn` text,
	`countryId` int,
	`sectorId` int,
	`publishedAt` timestamp,
	`status` enum('DRAFT','REVIEW','VALIDATED','PUBLISHED') NOT NULL DEFAULT 'DRAFT',
	CONSTRAINT `analyses_id` PRIMARY KEY(`id`),
	CONSTRAINT `analyses_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(180) NOT NULL,
	`titleFr` varchar(260) NOT NULL,
	`titleEn` varchar(260) NOT NULL,
	`excerptFr` text,
	`excerptEn` text,
	`bodyFr` text,
	`bodyEn` text,
	`category` varchar(100),
	`sectorId` int,
	`countryId` int,
	`publishedAt` timestamp,
	`status` enum('DRAFT','REVIEW','VALIDATED','PUBLISHED') NOT NULL DEFAULT 'DRAFT',
	CONSTRAINT `articles_id` PRIMARY KEY(`id`),
	CONSTRAINT `articles_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `countries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`isoCode` varchar(3) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`nameFr` varchar(160) NOT NULL,
	`nameEn` varchar(160) NOT NULL,
	`descriptionFr` text,
	`descriptionEn` text,
	`status` enum('DRAFT','PUBLISHED') NOT NULL DEFAULT 'PUBLISHED',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `countries_id` PRIMARY KEY(`id`),
	CONSTRAINT `countries_isoCode_unique` UNIQUE(`isoCode`),
	CONSTRAINT `countries_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `indicators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`nameFr` varchar(240) NOT NULL,
	`nameEn` varchar(240) NOT NULL,
	`valueNumeric` varchar(80),
	`valueText` text,
	`unit` varchar(80),
	`period` varchar(80),
	`territory` varchar(180),
	`countryId` int,
	`sectorId` int,
	`sourceId` int,
	`methodologyFr` text,
	`methodologyEn` text,
	`status` enum('INGESTED','VALIDATED','NORMALIZED','PUBLISHED') NOT NULL DEFAULT 'INGESTED',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `indicators_id` PRIMARY KEY(`id`),
	CONSTRAINT `indicators_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `infrastructures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(140) NOT NULL,
	`name` varchar(220) NOT NULL,
	`type` varchar(120) NOT NULL,
	`countryId` int,
	`city` varchar(160),
	`latitude` varchar(32),
	`longitude` varchar(32),
	CONSTRAINT `infrastructures_id` PRIMARY KEY(`id`),
	CONSTRAINT `infrastructures_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `markets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(140) NOT NULL,
	`nameFr` varchar(200) NOT NULL,
	`nameEn` varchar(200) NOT NULL,
	`countryId` int,
	`sectorId` int,
	CONSTRAINT `markets_id` PRIMARY KEY(`id`),
	CONSTRAINT `markets_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(180) NOT NULL,
	`titleFr` varchar(260) NOT NULL,
	`titleEn` varchar(260) NOT NULL,
	`countryId` int,
	`sectorId` int,
	`contextFr` text,
	`contextEn` text,
	`interventionFr` text,
	`interventionEn` text,
	`deliverablesFr` text,
	`deliverablesEn` text,
	`status` enum('DRAFT','REVIEW','VALIDATED','PUBLISHED') NOT NULL DEFAULT 'DRAFT',
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `projects_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `sectors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(120) NOT NULL,
	`nameFr` varchar(160) NOT NULL,
	`nameEn` varchar(160) NOT NULL,
	`descriptionFr` text,
	`descriptionEn` text,
	CONSTRAINT `sectors_id` PRIMARY KEY(`id`),
	CONSTRAINT `sectors_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(220) NOT NULL,
	`publisher` varchar(220),
	`url` text,
	`publicationDate` timestamp,
	`accessedAt` timestamp,
	`methodology` text,
	CONSTRAINT `sources_id` PRIMARY KEY(`id`)
);
