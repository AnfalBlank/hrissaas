CREATE TABLE `chat_conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`type` text DEFAULT 'direct',
	`title` text,
	`last_message_at` integer,
	`last_message_text` text,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `conv_company_idx` ON `chat_conversations` (`company_id`);--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`from_user_id` text NOT NULL,
	`text` text,
	`attachment_url` text,
	`attachment_name` text,
	`attachment_mime` text,
	`attachment_size` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `msg_conv_idx` ON `chat_messages` (`conversation_id`);--> statement-breakpoint
CREATE TABLE `chat_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`user_id` text NOT NULL,
	`last_read_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `part_conv_user_idx` ON `chat_participants` (`conversation_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `part_user_idx` ON `chat_participants` (`user_id`);--> statement-breakpoint
CREATE TABLE `holidays` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`date` text NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'national',
	`recurring_yearly` integer DEFAULT false,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `overtime_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`company_id` text NOT NULL,
	`date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`hours` integer DEFAULT 0 NOT NULL,
	`description` text,
	`is_holiday` integer DEFAULT false,
	`status` text DEFAULT 'pending' NOT NULL,
	`approver_id` text,
	`approver_note` text,
	`approved_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ot_emp_idx` ON `overtime_requests` (`employee_id`);--> statement-breakpoint
CREATE INDEX `ot_co_date_idx` ON `overtime_requests` (`company_id`,`date`);--> statement-breakpoint
CREATE TABLE `payroll_components` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`company_id` text NOT NULL,
	`type` text NOT NULL,
	`category` text NOT NULL,
	`name` text NOT NULL,
	`amount` integer NOT NULL,
	`recurring` integer DEFAULT false,
	`start_period` text,
	`end_period` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `payroll_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`allowance_default_pct` real DEFAULT 0.27,
	`working_hours_per_month` integer DEFAULT 173,
	`late_deduction_cap_pct` real DEFAULT 0.1,
	`ot_weekday_first_rate` real DEFAULT 1.5,
	`ot_weekday_rate` real DEFAULT 2,
	`ot_holiday_first_8h_rate` real DEFAULT 2,
	`ot_holiday_9th_rate` real DEFAULT 3,
	`ot_holiday_10th_rate` real DEFAULT 4,
	`thr_full_months` integer DEFAULT 12,
	`thr_min_months` integer DEFAULT 1,
	`bpjs_kesehatan_enabled` integer DEFAULT true,
	`bpjs_jht_enabled` integer DEFAULT true,
	`bpjs_jp_enabled` integer DEFAULT true,
	`tax_scheme` text DEFAULT 'gross',
	`tax_method` text DEFAULT 'TER',
	`default_jkk_class` integer DEFAULT 1,
	`work_days_per_week` integer DEFAULT 5,
	`late_deduction_base` text DEFAULT 'baseSalary',
	`company_npwp` text,
	`company_tax_address` text,
	`updated_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payroll_settings_company_id_unique` ON `payroll_settings` (`company_id`);--> statement-breakpoint
ALTER TABLE `employees` ADD `ptkp_status` text DEFAULT 'TK/0';--> statement-breakpoint
ALTER TABLE `employees` ADD `npwp` text;--> statement-breakpoint
ALTER TABLE `employees` ADD `marital_status` text DEFAULT 'single';--> statement-breakpoint
ALTER TABLE `employees` ADD `jkk_class` integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE `employees` ADD `resign_date` integer;--> statement-breakpoint
ALTER TABLE `notifications` ADD `link` text;--> statement-breakpoint
ALTER TABLE `payrolls` ADD `overtime_hours` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `payrolls` ADD `late_minutes` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `payrolls` ADD `bpjs_kesehatan` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `payrolls` ADD `bpjs_jht` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `payrolls` ADD `bpjs_jp` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `payrolls` ADD `employer_bpjs` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `payrolls` ADD `ptkp_status` text DEFAULT 'TK/0';--> statement-breakpoint
ALTER TABLE `payrolls` ADD `generated_by_id` text;--> statement-breakpoint
ALTER TABLE `payrolls` ADD `generated_at` integer;--> statement-breakpoint
ALTER TABLE `payrolls` ADD `approved_by_id` text;--> statement-breakpoint
ALTER TABLE `payrolls` ADD `approved_at` integer;--> statement-breakpoint
ALTER TABLE `payrolls` ADD `payment_method` text;--> statement-breakpoint
ALTER TABLE `payrolls` ADD `payment_reference` text;--> statement-breakpoint
ALTER TABLE `payrolls` ADD `payslip_pdf_url` text;--> statement-breakpoint
ALTER TABLE `payrolls` ADD `notes` text;--> statement-breakpoint
CREATE UNIQUE INDEX `payroll_emp_period_idx` ON `payrolls` (`employee_id`,`period`);--> statement-breakpoint
CREATE INDEX `payroll_co_period_idx` ON `payrolls` (`company_id`,`period`);