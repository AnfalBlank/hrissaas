CREATE TABLE `announcements` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`type` text DEFAULT 'article' NOT NULL,
	`title` text NOT NULL,
	`excerpt` text,
	`content` text,
	`image_url` text,
	`category` text,
	`status` text DEFAULT 'live',
	`created_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `attendances` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`company_id` text NOT NULL,
	`branch_id` text,
	`date` text NOT NULL,
	`check_in_at` integer,
	`check_in_lat` real,
	`check_in_lng` real,
	`check_in_method` text,
	`check_in_photo_url` text,
	`check_in_confidence` real,
	`check_out_at` integer,
	`check_out_lat` real,
	`check_out_lng` real,
	`check_out_method` text,
	`status` text DEFAULT 'present' NOT NULL,
	`late_minutes` integer DEFAULT 0,
	`overtime_minutes` integer DEFAULT 0,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `att_emp_date_idx` ON `attendances` (`employee_id`,`date`);--> statement-breakpoint
CREATE INDEX `att_company_date_idx` ON `attendances` (`company_id`,`date`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text,
	`user_id` text,
	`action` text NOT NULL,
	`details` text,
	`ip` text,
	`user_agent` text,
	`created_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE TABLE `branches` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`city` text,
	`address` text,
	`latitude` real,
	`longitude` real,
	`radius_meters` integer DEFAULT 100,
	`active` integer DEFAULT true,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chats` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`from_user_id` text NOT NULL,
	`to_role` text DEFAULT 'hr',
	`text` text NOT NULL,
	`attachment_url` text,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`domain` text,
	`plan` text DEFAULT 'professional',
	`timezone` text DEFAULT 'Asia/Jakarta',
	`logo_url` text,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `companies_slug_unique` ON `companies` (`slug`);--> statement-breakpoint
CREATE TABLE `employees` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`company_id` text NOT NULL,
	`branch_id` text,
	`shift_id` text,
	`employee_code` text NOT NULL,
	`full_name` text NOT NULL,
	`division` text,
	`position` text,
	`phone` text,
	`avatar_url` text,
	`face_registered` integer DEFAULT false,
	`base_salary` integer DEFAULT 0,
	`bank_name` text,
	`bank_account` text,
	`join_date` integer,
	`status` text DEFAULT 'active',
	`created_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employees_code_idx` ON `employees` (`employee_code`);--> statement-breakpoint
CREATE INDEX `employees_company_idx` ON `employees` (`company_id`);--> statement-breakpoint
CREATE TABLE `leave_quotas` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`type` text NOT NULL,
	`total` integer NOT NULL,
	`used` integer DEFAULT 0 NOT NULL,
	`year` integer NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `leaves` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`company_id` text NOT NULL,
	`type` text NOT NULL,
	`from_date` text NOT NULL,
	`to_date` text NOT NULL,
	`days` integer DEFAULT 1 NOT NULL,
	`reason` text,
	`attachment_url` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`approver_id` text,
	`approver_note` text,
	`approved_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`company_id` text,
	`title` text NOT NULL,
	`body` text,
	`icon` text DEFAULT 'bell',
	`category` text DEFAULT 'system',
	`read_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payrolls` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`company_id` text NOT NULL,
	`period` text NOT NULL,
	`base_salary` integer DEFAULT 0 NOT NULL,
	`allowance` integer DEFAULT 0 NOT NULL,
	`overtime_pay` integer DEFAULT 0 NOT NULL,
	`bonus` integer DEFAULT 0 NOT NULL,
	`attendance_deduction` integer DEFAULT 0 NOT NULL,
	`tax_deduction` integer DEFAULT 0 NOT NULL,
	`bpjs_deduction` integer DEFAULT 0 NOT NULL,
	`thr` integer DEFAULT 0 NOT NULL,
	`net_salary` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft',
	`paid_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`grace_minutes` integer DEFAULT 5,
	`type` text DEFAULT 'regular',
	`created_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'employee' NOT NULL,
	`active` integer DEFAULT true,
	`last_login_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);