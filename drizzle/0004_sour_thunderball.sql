DROP INDEX "att_emp_date_idx";--> statement-breakpoint
DROP INDEX "att_company_date_idx";--> statement-breakpoint
DROP INDEX "conv_company_idx";--> statement-breakpoint
DROP INDEX "msg_conv_idx";--> statement-breakpoint
DROP INDEX "part_conv_user_idx";--> statement-breakpoint
DROP INDEX "part_user_idx";--> statement-breakpoint
DROP INDEX "companies_slug_unique";--> statement-breakpoint
DROP INDEX "employees_code_idx";--> statement-breakpoint
DROP INDEX "employees_company_idx";--> statement-breakpoint
DROP INDEX "ot_emp_idx";--> statement-breakpoint
DROP INDEX "ot_co_date_idx";--> statement-breakpoint
DROP INDEX "rev_payroll_idx";--> statement-breakpoint
DROP INDEX "payroll_settings_company_id_unique";--> statement-breakpoint
DROP INDEX "payroll_emp_period_idx";--> statement-breakpoint
DROP INDEX "payroll_co_period_idx";--> statement-breakpoint
DROP INDEX "users_email_idx";--> statement-breakpoint
ALTER TABLE `audit_logs` ALTER COLUMN "company_id" TO "company_id" text DEFAULT 'system';--> statement-breakpoint
CREATE UNIQUE INDEX `att_emp_date_idx` ON `attendances` (`employee_id`,`date`);--> statement-breakpoint
CREATE INDEX `att_company_date_idx` ON `attendances` (`company_id`,`date`);--> statement-breakpoint
CREATE INDEX `conv_company_idx` ON `chat_conversations` (`company_id`);--> statement-breakpoint
CREATE INDEX `msg_conv_idx` ON `chat_messages` (`conversation_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `part_conv_user_idx` ON `chat_participants` (`conversation_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `part_user_idx` ON `chat_participants` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `companies_slug_unique` ON `companies` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `employees_code_idx` ON `employees` (`employee_code`);--> statement-breakpoint
CREATE INDEX `employees_company_idx` ON `employees` (`company_id`);--> statement-breakpoint
CREATE INDEX `ot_emp_idx` ON `overtime_requests` (`employee_id`);--> statement-breakpoint
CREATE INDEX `ot_co_date_idx` ON `overtime_requests` (`company_id`,`date`);--> statement-breakpoint
CREATE INDEX `rev_payroll_idx` ON `payroll_revisions` (`payroll_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payroll_settings_company_id_unique` ON `payroll_settings` (`company_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payroll_emp_period_idx` ON `payrolls` (`employee_id`,`period`);--> statement-breakpoint
CREATE INDEX `payroll_co_period_idx` ON `payrolls` (`company_id`,`period`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);