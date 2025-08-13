import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExpenseForm from "@/components/forms/expense-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Expense, ExpenseType } from "@shared/schema";

interface ExpenseWithType extends Expense {
  expenseType?: ExpenseType;
}

export default function Expenses() {
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithType | null>(null);
  const [editingType, setEditingType] = useState<ExpenseType | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading: expensesLoading } = useQuery<ExpenseWithType[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: expenseTypes = [], isLoading: typesLoading } = useQuery<ExpenseType[]>({
    queryKey: ["/api/expense-types"],
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/expenses/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financials"] });
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/expense-types/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-types"] });
      toast({
        title: "Success",
        description: "Expense type deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditExpense = (expense: ExpenseWithType) => {
    setEditingExpense(expense);
    setIsExpenseDialogOpen(true);
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      deleteExpenseMutation.mutate(id);
    }
  };

  const handleDeleteType = (id: string) => {
    if (confirm("Are you sure you want to delete this expense type?")) {
      deleteTypeMutation.mutate(id);
    }
  };

  const handleExpenseDialogClose = () => {
    setIsExpenseDialogOpen(false);
    setEditingExpense(null);
  };

  const getExpenseTypeName = (typeId: string) => {
    const type = expenseTypes.find(t => t.id === typeId);
    return type?.name || "Unknown Type";
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.active}>
        {status}
      </Badge>
    );
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(amount));
  };

  return (
    <>
      <Header
        title="Expense Management"
        subtitle="Track operational costs and expenditures"
        actions={
          <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <i className="fas fa-plus mr-2"></i>
                New Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingExpense ? "Edit Expense" : "Add New Expense"}
                </DialogTitle>
              </DialogHeader>
              <ExpenseForm
                expense={editingExpense}
                expenseTypes={expenseTypes}
                onSuccess={handleExpenseDialogClose}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <main className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="types">Expense Types</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses">
            <Card>
              <CardContent className="p-6">
                {expensesLoading ? (
                  <div className="text-center py-8">
                    <i className="fas fa-spinner fa-spin text-gray-400 text-2xl mb-2"></i>
                    <p className="text-gray-500">Loading expenses...</p>
                  </div>
                ) : expenses.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-credit-card text-gray-400 text-4xl mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
                    <p className="text-gray-500 mb-4">
                      Start recording expenses to track operational costs.
                    </p>
                    <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-red-600 hover:bg-red-700">
                          <i className="fas fa-plus mr-2"></i>
                          Add First Expense
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Add New Expense</DialogTitle>
                        </DialogHeader>
                        <ExpenseForm
                          expenseTypes={expenseTypes}
                          onSuccess={handleExpenseDialogClose}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell className="font-medium">
                              {getExpenseTypeName(expense.expenseTypeId)}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-red-600">
                              {formatCurrency(expense.amount)}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {expense.description || "No description"}
                            </TableCell>
                            <TableCell className="text-gray-500">
                              {new Date(expense.expenseDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-gray-500">
                              {new Date(expense.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditExpense(expense)}
                                >
                                  <i className="fas fa-edit"></i>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteExpense(expense.id)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                >
                                  <i className="fas fa-trash"></i>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="types">
            <Card>
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Expense Types</h3>
                <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <i className="fas fa-plus mr-2"></i>
                      New Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingType ? "Edit Expense Type" : "Create New Expense Type"}
                      </DialogTitle>
                    </DialogHeader>
                    <ExpenseForm
                      isTypeForm={true}
                      expenseType={editingType}
                      onSuccess={() => {
                        setIsTypeDialogOpen(false);
                        setEditingType(null);
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
              <CardContent className="p-6">
                {typesLoading ? (
                  <div className="text-center py-8">
                    <i className="fas fa-spinner fa-spin text-gray-400 text-2xl mb-2"></i>
                    <p className="text-gray-500">Loading expense types...</p>
                  </div>
                ) : expenseTypes.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-tags text-gray-400 text-4xl mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No expense types found</h3>
                    <p className="text-gray-500 mb-4">
                      Create expense types to categorize your expenditures.
                    </p>
                    <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <i className="fas fa-plus mr-2"></i>
                          Create First Type
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Expense Type</DialogTitle>
                        </DialogHeader>
                        <ExpenseForm
                          isTypeForm={true}
                          onSuccess={() => {
                            setIsTypeDialogOpen(false);
                            setEditingType(null);
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenseTypes.map((type) => (
                        <TableRow key={type.id}>
                          <TableCell className="font-medium">{type.name}</TableCell>
                          <TableCell className="text-gray-600">
                            {type.description || "No description"}
                          </TableCell>
                          <TableCell>{getStatusBadge(type.status)}</TableCell>
                          <TableCell className="text-gray-500">
                            {new Date(type.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingType(type);
                                  setIsTypeDialogOpen(true);
                                }}
                              >
                                <i className="fas fa-edit"></i>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteType(type.id)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <i className="fas fa-trash"></i>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
