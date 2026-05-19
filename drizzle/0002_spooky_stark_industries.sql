CREATE TABLE `payroll_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`payroll_id` text NOT NULL,
	`company_id` text NOT NULL,
	`revised_by_id` text,
	`action` text NOT NULL,
	`snapshot` text NOT NULL,
	`diff` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`payroll_id`) REFERENCES `payrolls`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `rev_payroll_idx` ON `payroll_revisions` (`payroll_id`);