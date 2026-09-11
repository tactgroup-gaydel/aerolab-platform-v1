CREATE TABLE `connectorRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`connectorId` varchar(120) NOT NULL,
	`endpoint` varchar(360) NOT NULL,
	`status` enum('SUCCESS','DEGRADED','ERROR') NOT NULL,
	`requestStartedAt` timestamp NOT NULL DEFAULT (now()),
	`requestFinishedAt` timestamp,
	`recordCount` int NOT NULL DEFAULT 0,
	`validationFailureCount` int NOT NULL DEFAULT 0,
	`freshnessStatus` enum('VALID','STALE','INVALID','ERROR') NOT NULL,
	`errorState` text,
	CONSTRAINT `connectorRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dataSources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceKey` varchar(120) NOT NULL,
	`name` varchar(220) NOT NULL,
	`priority` enum('A','B','C') NOT NULL,
	`status` enum('active','prepared','disabled') NOT NULL DEFAULT 'prepared',
	`licenseStatus` varchar(180) NOT NULL,
	`commercialUse` varchar(40) NOT NULL,
	`redistributionAllowed` varchar(40) NOT NULL,
	`attributionRequired` enum('yes','no') NOT NULL DEFAULT 'yes',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dataSources_id` PRIMARY KEY(`id`),
	CONSTRAINT `dataSources_sourceKey_unique` UNIQUE(`sourceKey`)
);
--> statement-breakpoint
CREATE TABLE `mobilityObservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`observationKey` varchar(220) NOT NULL,
	`domain` enum('aviation','maritime','rail','road','logistics') NOT NULL,
	`type` varchar(120) NOT NULL,
	`status` varchar(120) NOT NULL,
	`severity` enum('low','medium','high','critical'),
	`countryId` int,
	`infrastructureId` int,
	`latitude` varchar(32),
	`longitude` varchar(32),
	`observedAt` timestamp,
	`retrievedAt` timestamp NOT NULL DEFAULT (now()),
	`freshnessStatus` enum('VALID','STALE','INVALID','ERROR') NOT NULL DEFAULT 'VALID',
	`sourceId` int,
	`sourceEndpoint` varchar(360),
	`externalId` varchar(220),
	`rawPayloadHash` varchar(80),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mobilityObservations_id` PRIMARY KEY(`id`),
	CONSTRAINT `mobilityObservations_observationKey_unique` UNIQUE(`observationKey`)
);
--> statement-breakpoint
CREATE TABLE `sourceObservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` int NOT NULL,
	`sourceEndpoint` varchar(360) NOT NULL,
	`externalId` varchar(220),
	`rawPayloadHash` varchar(80),
	`rawPayloadRef` text,
	`retrievedAt` timestamp NOT NULL DEFAULT (now()),
	`observedAt` timestamp,
	`quality` enum('VALID','STALE','INVALID','ERROR') NOT NULL DEFAULT 'VALID',
	`errorState` text,
	CONSTRAINT `sourceObservations_id` PRIMARY KEY(`id`)
);
