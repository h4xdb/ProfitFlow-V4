import {
  users, tasks, receiptBooks, receipts, expenses, expenseTypes, publishedReports,
  type User, type InsertUser, type Task, type InsertTask,
  type ReceiptBook, type InsertReceiptBook, type Receipt, type InsertReceipt,
  type Expense, type InsertExpense, type ExpenseType, type InsertExpenseType,
  type PublishedReport, type InsertPublishedReport
} from "@shared/schema";
// Database client - conditional import based on environment
import { db } from "./db";
import { eq, desc, and, sum, count } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;

  // Task operations
  getTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string): Promise<void>;

  // Receipt Book operations
  getReceiptBooks(): Promise<ReceiptBook[]>;
  getReceiptBook(id: string): Promise<ReceiptBook | undefined>;
  getReceiptBooksByUser(userId: string): Promise<ReceiptBook[]>;
  createReceiptBook(receiptBook: InsertReceiptBook): Promise<ReceiptBook>;
  updateReceiptBook(id: string, receiptBook: Partial<InsertReceiptBook>): Promise<ReceiptBook>;
  deleteReceiptBook(id: string): Promise<void>;
  getReceiptBookByNumber(bookNumber: string): Promise<ReceiptBook | undefined>;

  // Receipt operations
  getReceipts(): Promise<Receipt[]>;
  getReceipt(id: string): Promise<Receipt | undefined>;
  getReceiptsByBook(receiptBookId: string): Promise<Receipt[]>;
  getReceiptBooksByTask(taskId: string): Promise<ReceiptBook[]>;
  getReceiptsByUser(userId: string): Promise<Receipt[]>;
  createReceipt(receipt: InsertReceipt): Promise<Receipt>;
  updateReceipt(id: string, receipt: Partial<InsertReceipt>): Promise<Receipt>;
  deleteReceipt(id: string): Promise<void>;
  getNextReceiptNumber(receiptBookId: string): Promise<number>;

  // Expense Type operations
  getExpenseTypes(): Promise<ExpenseType[]>;
  getExpenseType(id: string): Promise<ExpenseType | undefined>;
  createExpenseType(expenseType: InsertExpenseType): Promise<ExpenseType>;
  updateExpenseType(id: string, expenseType: Partial<InsertExpenseType>): Promise<ExpenseType>;
  deleteExpenseType(id: string): Promise<void>;

  // Expense operations
  getExpenses(): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(id: string): Promise<void>;

  // Financial calculations
  getTotalIncome(): Promise<number>;
  getTotalExpenses(): Promise<number>;
  getCurrentBalance(): Promise<number>;
  getIncomeByTask(): Promise<Array<{ taskId: string; taskName: string; total: number; receiptBookCount: number }>>;

  // Published Reports operations
  getPublishedReports(): Promise<PublishedReport[]>;
  getLatestPublishedReport(): Promise<PublishedReport | undefined>;
  createPublishedReport(report: InsertPublishedReport): Promise<PublishedReport>;

  // Backup operations
  getAllDataForBackup(): Promise<{
    users: User[];
    tasks: Task[];
    receiptBooks: ReceiptBook[];
    receipts: Receipt[];
    expenses: Expense[];
    expenseTypes: ExpenseType[];
    publishedReports: PublishedReport[];
  }>;
  
  // Restore operations
  restoreFromBackup(backupData: {
    users?: User[];
    tasks?: Task[];
    receiptBooks?: ReceiptBook[];
    receipts?: Receipt[];
    expenses?: Expense[];
    expenseTypes?: ExpenseType[];
    publishedReports?: PublishedReport[];
  }): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Task operations
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async updateTask(id: string, updateData: Partial<InsertTask>): Promise<Task> {
    const [task] = await db.update(tasks).set(updateData).where(eq(tasks.id, id)).returning();
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Receipt Book operations
  async getReceiptBooks(): Promise<ReceiptBook[]> {
    return await db.select().from(receiptBooks).orderBy(desc(receiptBooks.createdAt));
  }

  async getReceiptBook(id: string): Promise<ReceiptBook | undefined> {
    const [receiptBook] = await db.select().from(receiptBooks).where(eq(receiptBooks.id, id));
    return receiptBook || undefined;
  }

  async getReceiptBooksByUser(userId: string): Promise<ReceiptBook[]> {
    return await db.select().from(receiptBooks).where(eq(receiptBooks.assignedTo, userId));
  }

  async createReceiptBook(insertReceiptBook: InsertReceiptBook): Promise<ReceiptBook> {
    const [receiptBook] = await db.insert(receiptBooks).values([insertReceiptBook]).returning();
    return receiptBook;
  }

  async updateReceiptBook(id: string, updateData: Partial<InsertReceiptBook>): Promise<ReceiptBook> {
    const [receiptBook] = await db.update(receiptBooks).set(updateData).where(eq(receiptBooks.id, id)).returning();
    return receiptBook;
  }

  async deleteReceiptBook(id: string): Promise<void> {
    await db.delete(receiptBooks).where(eq(receiptBooks.id, id));
  }

  async getReceiptBookByNumber(bookNumber: string): Promise<ReceiptBook | undefined> {
    const [receiptBook] = await db.select().from(receiptBooks).where(eq(receiptBooks.bookNumber, bookNumber));
    return receiptBook || undefined;
  }

  // Receipt operations
  async getReceipts(): Promise<Receipt[]> {
    return await db.select().from(receipts).orderBy(desc(receipts.createdAt));
  }

  async getReceipt(id: string): Promise<Receipt | undefined> {
    const [receipt] = await db.select().from(receipts).where(eq(receipts.id, id));
    return receipt || undefined;
  }

  async getReceiptsByBook(receiptBookId: string): Promise<Receipt[]> {
    return await db.select().from(receipts).where(eq(receipts.receiptBookId, receiptBookId)).orderBy(receipts.receiptNumber);
  }

  async getReceiptBooksByTask(taskId: string): Promise<ReceiptBook[]> {
    return await db.select().from(receiptBooks).where(eq(receiptBooks.taskId, taskId)).orderBy(receiptBooks.bookNumber);
  }

  async getReceiptsByUser(userId: string): Promise<Receipt[]> {
    return await db.select().from(receipts).where(eq(receipts.enteredBy, userId)).orderBy(desc(receipts.createdAt));
  }

  async createReceipt(insertReceipt: InsertReceipt): Promise<Receipt> {
    const [receipt] = await db.insert(receipts).values(insertReceipt).returning();
    return receipt;
  }

  async updateReceipt(id: string, updateData: Partial<InsertReceipt>): Promise<Receipt> {
    const [receipt] = await db.update(receipts).set(updateData).where(eq(receipts.id, id)).returning();
    return receipt;
  }

  async deleteReceipt(id: string): Promise<void> {
    await db.delete(receipts).where(eq(receipts.id, id));
  }

  async getNextReceiptNumber(receiptBookId: string): Promise<number> {
    const receiptBook = await this.getReceiptBook(receiptBookId);
    if (!receiptBook) throw new Error("Receipt book not found");

    const existingReceipts = await this.getReceiptsByBook(receiptBookId);
    const usedNumbers = existingReceipts.map(r => r.receiptNumber);
    
    for (let num = receiptBook.startingReceiptNumber; num <= receiptBook.endingReceiptNumber; num++) {
      if (!usedNumbers.includes(num)) {
        return num;
      }
    }
    
    throw new Error("All receipt numbers in this book have been used");
  }

  // Expense Type operations
  async getExpenseTypes(): Promise<ExpenseType[]> {
    return await db.select().from(expenseTypes).orderBy(expenseTypes.name);
  }

  async getExpenseType(id: string): Promise<ExpenseType | undefined> {
    const [expenseType] = await db.select().from(expenseTypes).where(eq(expenseTypes.id, id));
    return expenseType || undefined;
  }

  async createExpenseType(insertExpenseType: InsertExpenseType): Promise<ExpenseType> {
    const [expenseType] = await db.insert(expenseTypes).values(insertExpenseType).returning();
    return expenseType;
  }

  async updateExpenseType(id: string, updateData: Partial<InsertExpenseType>): Promise<ExpenseType> {
    const [expenseType] = await db.update(expenseTypes).set(updateData).where(eq(expenseTypes.id, id)).returning();
    return expenseType;
  }

  async deleteExpenseType(id: string): Promise<void> {
    await db.delete(expenseTypes).where(eq(expenseTypes.id, id));
  }

  // Expense operations
  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses).orderBy(desc(expenses.expenseDate));
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense || undefined;
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [expense] = await db.insert(expenses).values(insertExpense).returning();
    return expense;
  }

  async updateExpense(id: string, updateData: Partial<InsertExpense>): Promise<Expense> {
    const [expense] = await db.update(expenses).set(updateData).where(eq(expenses.id, id)).returning();
    return expense;
  }

  async deleteExpense(id: string): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  // Financial calculations
  async getTotalIncome(): Promise<number> {
    const result = await db.select({ total: sum(receipts.amount) }).from(receipts);
    return Number(result[0]?.total || 0);
  }

  async getTotalExpenses(): Promise<number> {
    const result = await db.select({ total: sum(expenses.amount) }).from(expenses);
    return Number(result[0]?.total || 0);
  }

  async getCurrentBalance(): Promise<number> {
    const totalIncome = await this.getTotalIncome();
    const totalExpenses = await this.getTotalExpenses();
    return totalIncome - totalExpenses;
  }

  async getIncomeByTask(): Promise<Array<{ taskId: string; taskName: string; total: number; receiptBookCount: number }>> {
    const result = await db
      .select({
        taskId: tasks.id,
        taskName: tasks.name,
        total: sum(receipts.amount),
        receiptBookCount: count(receiptBooks.id)
      })
      .from(tasks)
      .leftJoin(receipts, eq(tasks.id, receipts.taskId))
      .leftJoin(receiptBooks, eq(tasks.id, receiptBooks.taskId))
      .groupBy(tasks.id, tasks.name);

    return result.map(r => ({
      taskId: r.taskId,
      taskName: r.taskName,
      total: Number(r.total || 0),
      receiptBookCount: Number(r.receiptBookCount || 0)
    }));
  }

  // Published Reports operations
  async getPublishedReports(): Promise<PublishedReport[]> {
    return await db.select().from(publishedReports).orderBy(desc(publishedReports.publishedAt));
  }

  async getLatestPublishedReport(): Promise<PublishedReport | undefined> {
    const [report] = await db.select().from(publishedReports).orderBy(desc(publishedReports.publishedAt)).limit(1);
    return report || undefined;
  }

  async createPublishedReport(insertReport: InsertPublishedReport): Promise<PublishedReport> {
    const [report] = await db.insert(publishedReports).values(insertReport).returning();
    return report;
  }

  // Backup operations
  async getAllDataForBackup(): Promise<{
    users: User[];
    tasks: Task[];
    receiptBooks: ReceiptBook[];
    receipts: Receipt[];
    expenses: Expense[];
    expenseTypes: ExpenseType[];
    publishedReports: PublishedReport[];
  }> {
    const [
      usersData,
      tasksData,
      receiptBooksData,
      receiptsData,
      expensesData,
      expenseTypesData,
      publishedReportsData
    ] = await Promise.all([
      this.getAllUsers(),
      this.getTasks(),
      this.getReceiptBooks(),
      this.getReceipts(),
      this.getExpenses(),
      this.getExpenseTypes(),
      this.getPublishedReports()
    ]);

    return {
      users: usersData,
      tasks: tasksData,
      receiptBooks: receiptBooksData,
      receipts: receiptsData,
      expenses: expensesData,
      expenseTypes: expenseTypesData,
      publishedReports: publishedReportsData
    };
  }

  // Restore operations
  async restoreFromBackup(backupData: {
    users?: User[];
    tasks?: Task[];
    receiptBooks?: ReceiptBook[];
    receipts?: Receipt[];
    expenses?: Expense[];
    expenseTypes?: ExpenseType[];
    publishedReports?: PublishedReport[];
  }): Promise<void> {
    try {
      // Clear existing data (in reverse order to maintain referential integrity)
      await Promise.all([
        db.delete(receipts),
        db.delete(expenses),
        db.delete(publishedReports)
      ]);
      
      await Promise.all([
        db.delete(receiptBooks),
        db.delete(expenseTypes)
      ]);
      
      await Promise.all([
        db.delete(tasks),
        db.delete(users)
      ]);

      // Restore data (in correct order to maintain referential integrity)
      if (backupData.users?.length) {
        await db.insert(users).values(backupData.users);
      }

      if (backupData.tasks?.length) {
        await db.insert(tasks).values(backupData.tasks);
      }

      if (backupData.expenseTypes?.length) {
        await db.insert(expenseTypes).values(backupData.expenseTypes);
      }

      if (backupData.receiptBooks?.length) {
        await db.insert(receiptBooks).values(backupData.receiptBooks);
      }

      if (backupData.receipts?.length) {
        await db.insert(receipts).values(backupData.receipts);
      }

      if (backupData.expenses?.length) {
        await db.insert(expenses).values(backupData.expenses);
      }

      if (backupData.publishedReports?.length) {
        await db.insert(publishedReports).values(backupData.publishedReports);
      }
    } catch (error) {
      console.error("Error restoring backup:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
