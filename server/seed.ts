import bcrypt from "bcrypt";
import { db } from "./db.js";
import { users, tasks, expenseTypes } from "@shared/schema.js";

// Default users for the system
const defaultUsers = [
  {
    username: "admin",
    password: "admin123",
    fullName: "System Administrator",
    role: "admin" as const,
  },
  {
    username: "manager1", 
    password: "manager123",
    fullName: "Masjid Manager",
    role: "manager" as const,
  },
  {
    username: "collector1",
    password: "collector123", 
    fullName: "Cash Collector 1",
    role: "cash_collector" as const,
  },
  {
    username: "collector2",
    password: "collector456",
    fullName: "Cash Collector 2", 
    role: "cash_collector" as const,
  },
];

// Default donation categories
const defaultTasks = [
  { name: "Construction Fund", description: "Building and infrastructure development" },
  { name: "Charity Fund", description: "General charitable activities" },
  { name: "Educational Fund", description: "Islamic education and schools" },
  { name: "Maintenance Fund", description: "Regular maintenance and utilities" },
  { name: "Special Events", description: "Religious celebrations and events" },
];

// Default expense types
const defaultExpenseTypes = [
  { name: "Utilities", description: "Electricity, water, gas bills" },
  { name: "Maintenance", description: "Building repairs and upkeep" },
  { name: "Staff Salaries", description: "Employee compensation" },
  { name: "Office Supplies", description: "Stationery and office materials" },
  { name: "Religious Events", description: "Cost of organizing religious activities" },
];

export async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Create default users
    console.log("Creating default users...");
    for (const userData of defaultUsers) {
      const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, userData.username),
      });

      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await db.insert(users).values({
          username: userData.username,
          password: hashedPassword,
          fullName: userData.fullName,
          role: userData.role,
          isActive: true,
        });
        console.log(`Created user: ${userData.username} (${userData.role})`);
      } else {
        console.log(`User ${userData.username} already exists, skipping...`);
      }
    }

    // Create default tasks  
    console.log("Creating default donation categories...");
    const adminUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, "admin"),
    });

    if (adminUser) {
      for (const taskData of defaultTasks) {
        const existingTask = await db.query.tasks.findFirst({
          where: (tasks, { eq }) => eq(tasks.name, taskData.name),
        });

        if (!existingTask) {
          await db.insert(tasks).values({
            ...taskData,
            status: "active" as const,
            createdBy: adminUser.id, // Use admin user ID as creator
          });
          console.log(`Created task: ${taskData.name}`);
        } else {
          console.log(`Task ${taskData.name} already exists, skipping...`);
        }
      }
    } else {
      console.log("Admin user not found, skipping task creation");
    }

    // Create default expense types
    console.log("Creating default expense types...");
    if (adminUser) {
      for (const expenseTypeData of defaultExpenseTypes) {
        const existingExpenseType = await db.query.expenseTypes.findFirst({
          where: (expenseTypes, { eq }) => eq(expenseTypes.name, expenseTypeData.name),
        });

        if (!existingExpenseType) {
          await db.insert(expenseTypes).values({
            ...expenseTypeData,
            status: "active" as const,
            createdBy: adminUser.id, // Use admin user ID as creator
          });
          console.log(`Created expense type: ${expenseTypeData.name}`);
        } else {
          console.log(`Expense type ${expenseTypeData.name} already exists, skipping...`);
        }
      }
    } else {
      console.log("Admin user not found, skipping expense type creation");
    }

    console.log("Database seeding completed successfully!");
    console.log("\n=== DEFAULT LOGIN CREDENTIALS ===");
    console.log("Admin: username='admin', password='admin123'");
    console.log("Manager: username='manager1', password='manager123'");
    console.log("Cash Collector 1: username='collector1', password='collector123'");
    console.log("Cash Collector 2: username='collector2', password='collector456'");
    console.log("=====================================\n");

  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log("Seeding completed!");
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
    });
}