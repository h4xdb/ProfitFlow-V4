import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  authenticateToken, 
  requireRole, 
  requireAdminOrManager, 
  requireAdmin,
  generateToken, 
  hashPassword, 
  comparePassword,
  type AuthenticatedRequest 
} from "./middleware/auth";
import { 
  insertUserSchema, 
  insertTaskSchema, 
  insertReceiptBookSchema, 
  insertReceiptSchema,
  insertExpenseTypeSchema,
  insertExpenseSchema,
  insertPublishedReportSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken(user);
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          username: user.username, 
          fullName: user.fullName, 
          role: user.role 
        } 
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed", error: (error as Error).message });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
    res.json({ 
      user: { 
        id: req.user!.id, 
        username: req.user!.username, 
        fullName: req.user!.fullName, 
        role: req.user!.role 
      } 
    });
  });

  // User management routes (Admin only)
  app.get("/api/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const sanitizedUsers = users.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users", error: (error as Error).message });
    }
  });

  app.post("/api/users", authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const hashedPassword = await hashPassword(userData.password);
      
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      const { password, ...sanitizedUser } = newUser;
      res.status(201).json(sanitizedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create user", error: (error as Error).message });
      }
    }
  });

  app.put("/api/users/:id", authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updateData = insertUserSchema.partial().parse(req.body);
      
      if (updateData.password) {
        updateData.password = await hashPassword(updateData.password);
      }

      const updatedUser = await storage.updateUser(id, updateData);
      const { password, ...sanitizedUser } = updatedUser;
      res.json(sanitizedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update user", error: (error as Error).message });
      }
    }
  });

  app.delete("/api/users/:id", authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUser(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user", error: (error as Error).message });
    }
  });

  // Task routes
  app.get("/api/tasks", authenticateToken, async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks", error: (error as Error).message });
    }
  });

  app.post("/api/tasks", authenticateToken, requireAdminOrManager, async (req: AuthenticatedRequest, res) => {
    try {
      const taskData = insertTaskSchema.parse({ ...req.body, createdBy: req.user!.id });
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create task", error: (error as Error).message });
      }
    }
  });

  app.put("/api/tasks/:id", authenticateToken, requireAdminOrManager, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updateData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(id, updateData);
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update task", error: (error as Error).message });
      }
    }
  });

  app.delete("/api/tasks/:id", authenticateToken, requireAdminOrManager, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTask(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task", error: (error as Error).message });
    }
  });

  // Receipt Book routes
  app.get("/api/receipt-books", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      let receiptBooks;
      if (req.user!.role === "cash_collector") {
        receiptBooks = await storage.getReceiptBooksByUser(req.user!.id);
      } else {
        receiptBooks = await storage.getReceiptBooks();
      }
      res.json(receiptBooks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch receipt books", error: (error as Error).message });
    }
  });

  app.post("/api/receipt-books", authenticateToken, requireAdminOrManager, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertReceiptBookSchema.parse({ ...req.body, createdBy: req.user!.id });
      
      // Check if book number already exists
      const existingBook = await storage.getReceiptBookByNumber(validatedData.bookNumber);
      if (existingBook) {
        return res.status(400).json({ message: "Book number already exists" });
      }

      // Calculate total receipts and create the full data object
      const totalReceipts = validatedData.endingReceiptNumber - validatedData.startingReceiptNumber + 1;
      const receiptBookData = {
        ...validatedData,
        totalReceipts
      };
      
      const receiptBook = await storage.createReceiptBook(receiptBookData);
      res.status(201).json(receiptBook);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create receipt book", error: (error as Error).message });
      }
    }
  });

  app.put("/api/receipt-books/:id", authenticateToken, requireAdminOrManager, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updateData = insertReceiptBookSchema.partial().parse(req.body);
      const receiptBook = await storage.updateReceiptBook(id, updateData);
      res.json(receiptBook);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update receipt book", error: (error as Error).message });
      }
    }
  });

  app.delete("/api/receipt-books/:id", authenticateToken, requireAdminOrManager, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      await storage.deleteReceiptBook(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete receipt book", error: (error as Error).message });
    }
  });

  // Receipt routes
  app.get("/api/receipts", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      let receipts;
      if (req.user!.role === "cash_collector") {
        receipts = await storage.getReceiptsByUser(req.user!.id);
      } else {
        receipts = await storage.getReceipts();
      }
      res.json(receipts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch receipts", error: (error as Error).message });
    }
  });

  app.get("/api/receipts/book/:receiptBookId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { receiptBookId } = req.params;
      const receipts = await storage.getReceiptsByBook(receiptBookId);
      res.json(receipts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch receipts", error: (error as Error).message });
    }
  });

  app.get("/api/receipts/next-number/:receiptBookId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { receiptBookId } = req.params;
      const nextNumber = await storage.getNextReceiptNumber(receiptBookId);
      res.json({ nextReceiptNumber: nextNumber });
    } catch (error) {
      res.status(500).json({ message: "Failed to get next receipt number", error: (error as Error).message });
    }
  });

  app.post("/api/receipts", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const receiptData = insertReceiptSchema.parse({ ...req.body, enteredBy: req.user!.id });
      
      // Validate receipt book assignment for cash collectors
      if (req.user!.role === "cash_collector") {
        const receiptBook = await storage.getReceiptBook(receiptData.receiptBookId);
        if (!receiptBook || receiptBook.assignedTo !== req.user!.id) {
          return res.status(403).json({ message: "You can only add receipts to assigned receipt books" });
        }
      }

      const receipt = await storage.createReceipt(receiptData);
      res.status(201).json(receipt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create receipt", error: (error as Error).message });
      }
    }
  });

  app.put("/api/receipts/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updateData = insertReceiptSchema.partial().parse(req.body);
      
      // Check permissions for cash collectors
      if (req.user!.role === "cash_collector") {
        const existingReceipt = await storage.getReceipt(id);
        if (!existingReceipt || existingReceipt.enteredBy !== req.user!.id) {
          return res.status(403).json({ message: "You can only edit receipts you created" });
        }
      }

      const receipt = await storage.updateReceipt(id, updateData);
      res.json(receipt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update receipt", error: (error as Error).message });
      }
    }
  });

  app.delete("/api/receipts/:id", authenticateToken, requireAdminOrManager, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      await storage.deleteReceipt(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete receipt", error: (error as Error).message });
    }
  });

  // Expense Type routes
  app.get("/api/expense-types", authenticateToken, async (req, res) => {
    try {
      const expenseTypes = await storage.getExpenseTypes();
      res.json(expenseTypes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expense types", error: (error as Error).message });
    }
  });

  app.post("/api/expense-types", authenticateToken, requireAdminOrManager, async (req: AuthenticatedRequest, res) => {
    try {
      const expenseTypeData = insertExpenseTypeSchema.parse({ ...req.body, createdBy: req.user!.id });
      const expenseType = await storage.createExpenseType(expenseTypeData);
      res.status(201).json(expenseType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create expense type", error: (error as Error).message });
      }
    }
  });

  app.put("/api/expense-types/:id", authenticateToken, requireAdminOrManager, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updateData = insertExpenseTypeSchema.partial().parse(req.body);
      const expenseType = await storage.updateExpenseType(id, updateData);
      res.json(expenseType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update expense type", error: (error as Error).message });
      }
    }
  });

  app.delete("/api/expense-types/:id", authenticateToken, requireAdminOrManager, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      await storage.deleteExpenseType(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense type", error: (error as Error).message });
    }
  });

  // Expense routes
  app.get("/api/expenses", authenticateToken, async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses", error: (error as Error).message });
    }
  });

  app.post("/api/expenses", authenticateToken, requireAdminOrManager, async (req: AuthenticatedRequest, res) => {
    try {
      const expenseData = insertExpenseSchema.parse({ ...req.body, createdBy: req.user!.id });
      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create expense", error: (error as Error).message });
      }
    }
  });

  app.put("/api/expenses/:id", authenticateToken, requireAdminOrManager, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updateData = insertExpenseSchema.partial().parse(req.body);
      const expense = await storage.updateExpense(id, updateData);
      res.json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update expense", error: (error as Error).message });
      }
    }
  });

  app.delete("/api/expenses/:id", authenticateToken, requireAdminOrManager, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      await storage.deleteExpense(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense", error: (error as Error).message });
    }
  });

  // Financial data routes
  app.get("/api/financials", authenticateToken, async (req, res) => {
    try {
      const [totalIncome, totalExpenses, currentBalance, incomeByTask] = await Promise.all([
        storage.getTotalIncome(),
        storage.getTotalExpenses(),
        storage.getCurrentBalance(),
        storage.getIncomeByTask()
      ]);

      res.json({
        totalIncome,
        totalExpenses,
        currentBalance,
        incomeByTask
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch financial data", error: (error as Error).message });
    }
  });

  // Published Reports routes
  app.get("/api/reports/published", async (req, res) => {
    try {
      const latestReport = await storage.getLatestPublishedReport();
      if (!latestReport) {
        return res.status(404).json({ message: "No published reports found" });
      }
      
      const reportData = JSON.parse(latestReport.reportData);
      res.json({ ...reportData, publishedAt: latestReport.publishedAt });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch published report", error: (error as Error).message });
    }
  });

  app.post("/api/reports/publish", authenticateToken, requireAdminOrManager, async (req: AuthenticatedRequest, res) => {
    try {
      const [totalIncome, totalExpenses, currentBalance, incomeByTask] = await Promise.all([
        storage.getTotalIncome(),
        storage.getTotalExpenses(),
        storage.getCurrentBalance(),
        storage.getIncomeByTask()
      ]);

      const reportData = {
        totalIncome,
        totalExpenses,
        currentBalance,
        incomeByTask
      };

      const publishedReport = await storage.createPublishedReport({
        reportData: JSON.stringify(reportData),
        publishedBy: req.user!.id
      });

      res.status(201).json(publishedReport);
    } catch (error) {
      res.status(500).json({ message: "Failed to publish report", error: (error as Error).message });
    }
  });

  // Public routes for detailed viewing (no authentication required)
  app.get("/api/public/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      // Return only public information
      const publicTasks = tasks.map(task => ({
        id: task.id,
        name: task.name,
        description: task.description,
        status: task.status,
        createdAt: task.createdAt
      }));
      res.json(publicTasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks", error: (error as Error).message });
    }
  });

  app.get("/api/public/tasks/:taskId/receipt-books", async (req, res) => {
    try {
      const { taskId } = req.params;
      const receiptBooks = await storage.getReceiptBooksByTask(taskId);
      // Return only public information
      const publicReceiptBooks = receiptBooks.map(book => ({
        id: book.id,
        bookNumber: book.bookNumber,
        startingReceiptNumber: book.startingReceiptNumber,
        endingReceiptNumber: book.endingReceiptNumber,
        totalReceipts: book.totalReceipts,
        createdAt: book.createdAt
      }));
      res.json(publicReceiptBooks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch receipt books", error: (error as Error).message });
    }
  });

  app.get("/api/public/receipt-books/:bookId/receipts", async (req, res) => {
    try {
      const { bookId } = req.params;
      const receipts = await storage.getReceiptsByBook(bookId);
      // Return all public information including full donor names
      const publicReceipts = receipts.map(receipt => ({
        id: receipt.id,
        receiptNumber: receipt.receiptNumber,
        amount: receipt.amount,
        createdAt: receipt.createdAt,
        giverName: receipt.giverName
      }));
      res.json(publicReceipts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch receipts", error: (error as Error).message });
    }
  });

  app.get("/api/public/expenses", async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      const expenseTypes = await storage.getExpenseTypes();
      
      // Return only public information
      const publicExpenses = expenses.map(expense => {
        const expenseType = expenseTypes.find(et => et.id === expense.expenseTypeId);
        return {
          id: expense.id,
          amount: expense.amount,
          description: expense.description,
          expenseDate: expense.expenseDate,
          expenseTypeName: expenseType?.name || 'Unknown',
          createdAt: expense.createdAt
        };
      });
      res.json(publicExpenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses", error: (error as Error).message });
    }
  });

  // Backup routes
  app.get("/api/backup/sql", authenticateToken, requireAdminOrManager, async (req: AuthenticatedRequest, res) => {
    try {
      // This would require pg_dump or similar functionality
      // For now, return JSON data that can be used for restoration
      const backupData = await storage.getAllDataForBackup();
      
      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', `attachment; filename="masjid_backup_${new Date().toISOString().split('T')[0]}.sql"`);
      
      // Generate SQL INSERT statements
      let sqlContent = "-- Masjid ERP Database Backup\n-- Generated on " + new Date().toISOString() + "\n\n";
      
      // This is a simplified version - in production you'd want proper SQL generation
      sqlContent += "-- Users\n";
      for (const user of backupData.users) {
        sqlContent += `INSERT INTO users (id, username, password, full_name, role, is_active) VALUES ('${user.id}', '${user.username}', '${user.password}', '${user.fullName}', '${user.role}', ${user.isActive});\n`;
      }
      
      res.send(sqlContent);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate backup", error: (error as Error).message });
    }
  });

  app.get("/api/backup/csv", authenticateToken, requireAdminOrManager, async (req: AuthenticatedRequest, res) => {
    try {
      const backupData = await storage.getAllDataForBackup();
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="masjid_backup_${new Date().toISOString().split('T')[0]}.json"`);
      
      res.json(backupData);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate backup", error: (error as Error).message });
    }
  });

  // Restore data from backup
  app.post("/api/restore", authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const backupData = req.body;
      
      // Validate backup data structure
      if (!backupData || typeof backupData !== 'object') {
        return res.status(400).json({ message: "Invalid backup data format" });
      }

      await storage.restoreFromBackup(backupData);
      
      res.json({ message: "Data restored successfully", timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ message: "Failed to restore data", error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
