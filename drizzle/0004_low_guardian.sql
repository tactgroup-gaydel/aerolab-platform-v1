CREATE TABLE `airports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` int NOT NULL,
	`externalId` varchar(64) NOT NULL,
	`name` varchar(220) NOT NULL,
	`iata` varchar(8),
	`icao` varchar(8),
	`countryCode` varchar(4),
	`countryId` int,
	`latitude` varchar(32),
	`longitude` varchar(32),
	`retrievedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `airports_id` PRIMARY KEY(`id`),
	CONSTRAINT `airports_source_external_idx` UNIQUE(`sourceId`,`externalId`)
);
