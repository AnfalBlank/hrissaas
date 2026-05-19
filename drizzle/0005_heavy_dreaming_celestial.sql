ALTER TABLE `payroll_settings` ADD `payroll_cycle` text DEFAULT 'end_of_month';--> statement-breakpoint
ALTER TABLE `payroll_settings` ADD `cutoff_day` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `payroll_settings` ADD `pay_date` integer DEFAULT 25;