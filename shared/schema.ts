import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "manager", "cash_collector"]);
export const expenseTypeStatusEnum = pgEnum("expense_type_status", ["active", "inactive"]);
export const taskStatusEnum = pgEnum("task_status", ["active", "inactive", "completed"]);
export const receiptBookStatusEnum = pgEnum("receipt_book_status", ["active", "completed", "assigned"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull().default("cash_collector"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").notNull().default("active"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Receipt books table
export const receiptBooks = pgTable("receipt_books", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookNumber: text("book_number").notNull().unique(),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  assignedTo: varchar("assigned_to").references(() => users.id),
  startingReceiptNumber: integer("starting_receipt_number").notNull(),
  endingReceiptNumber: integer("ending_receipt_number").notNull(),
  totalReceipts: integer("total_receipts").notNull(),
  status: receiptBookStatusEnum("status").notNull().default("active"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Receipts table
export const receipts = pgTable("receipts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  receiptNumber: integer("receipt_number").notNull(),
  receiptBookId: varchar("receipt_book_id").notNull().references(() => receiptBooks.id),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  giverName: text("giver_name").notNull(),
  address: text("address").notNull(),
  phoneNumber: text("phone_number"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  enteredBy: varchar("entered_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Expense types table
export const expenseTypes = pgTable("expense_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  status: expenseTypeStatusEnum("status").notNull().default("active"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Expenses table
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  expenseTypeId: varchar("expense_type_id").notNull().references(() => expenseTypes.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  expenseDate: timestamp("expense_date").notNull(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Published reports table
export const publishedReports = pgTable("published_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportData: text("report_data").notNull(), // JSON string
  publishedBy: varchar("published_by").notNull().references(() => users.id),
  publishedAt: timestamp("published_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdTasks: many(tasks),
  createdReceiptBooks: many(receiptBooks),
  assignedReceiptBooks: many(receiptBooks),
  receipts: many(receipts),
  createdExpenseTypes: many(expenseTypes),
  expenses: many(expenses),
  publishedReports: many(publishedReports),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  createdBy: one(users, { fields: [tasks.createdBy], references: [users.id] }),
  receiptBooks: many(receiptBooks),
  receipts: many(receipts),
}));

export const receiptBooksRelations = relations(receiptBooks, ({ one, many }) => ({
  task: one(tasks, { fields: [receiptBooks.taskId], references: [tasks.id] }),
  assignedTo: one(users, { fields: [receiptBooks.assignedTo], references: [users.id] }),
  createdBy: one(users, { fields: [receiptBooks.createdBy], references: [users.id] }),
  receipts: many(receipts),
}));

export const receiptsRelations = relations(receipts, ({ one }) => ({
  receiptBook: one(receiptBooks, { fields: [receipts.receiptBookId], references: [receiptBooks.id] }),
  task: one(tasks, { fields: [receipts.taskId], references: [tasks.id] }),
  enteredBy: one(users, { fields: [receipts.enteredBy], references: [users.id] }),
}));

export const expenseTypesRelations = relations(expenseTypes, ({ one, many }) => ({
  createdBy: one(users, { fields: [expenseTypes.createdBy], references: [users.id] }),
  expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  expenseType: one(expenseTypes, { fields: [expenses.expenseTypeId], references: [expenseTypes.id] }),
  createdBy: one(users, { fields: [expenses.createdBy], references: [users.id] }),
}));

export const publishedReportsRelations = relations(publishedReports, ({ one }) => ({
  publishedBy: one(users, { fields: [publishedReports.publishedBy], references: [users.id] }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReceiptBookSchema = createInsertSchema(receiptBooks).omit({
  id: true,
  totalReceipts: true, // Remove totalReceipts from validation as it's calculated on the server
  createdAt: true,
  updatedAt: true,
});

export const insertReceiptSchema = createInsertSchema(receipts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExpenseTypeSchema = createInsertSchema(expenseTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  expenseDate: z.string().min(1, "Expense date is required").transform((val) => new Date(val)),
});

export const insertPublishedReportSchema = createInsertSchema(publishedReports).omit({
  id: true,
  publishedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type ReceiptBook = typeof receiptBooks.$inferSelect;
export type InsertReceiptBook = z.infer<typeof insertReceiptBookSchema>;
export type Receipt = typeof receipts.$inferSelect;
export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type ExpenseType = typeof expenseTypes.$inferSelect;
export type InsertExpenseType = z.infer<typeof insertExpenseTypeSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type PublishedReport = typeof publishedReports.$inferSelect;
export type InsertPublishedReport = z.infer<typeof insertPublishedReportSchema>;
