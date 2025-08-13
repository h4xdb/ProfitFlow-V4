import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import ReceiptForm from "@/components/forms/receipt-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Receipt, ReceiptBook, Task } from "@shared/schema";

interface ReceiptWithDetails extends Receipt {
  receiptBook?: ReceiptBook;
  task?: Task;
}

export default function Receipts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<ReceiptWithDetails | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdminOrManager } = useAuth();

  const { data: receipts = [], isLoading } = useQuery<ReceiptWithDetails[]>({
    queryKey: ["/api/receipts"],
  });

  const { data: receiptBooks = [] } = useQuery<ReceiptBook[]>({
    queryKey: ["/api/receipt-books"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const deleteReceiptMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/receipts/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/receipts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financials"] });
      toast({
        title: "Success",
        description: "Receipt deleted successfully",
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

  const handleEdit = (receipt: ReceiptWithDetails) => {
    setEditingReceipt(receipt);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this receipt?")) {
      deleteReceiptMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingReceipt(null);
  };

  const getReceiptBookNumber = (receiptBookId: string) => {
    const book = receiptBooks.find(b => b.id === receiptBookId);
    return book?.bookNumber || "Unknown";
  };

  const getTaskName = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    return task?.name || "Unknown Task";
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
        title="Receipts"
        subtitle="Manage donation receipts and entries"
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-islamic-600 hover:bg-islamic-700">
                <i className="fas fa-plus mr-2"></i>
                New Receipt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingReceipt ? "Edit Receipt" : "Create New Receipt"}
                </DialogTitle>
              </DialogHeader>
              <ReceiptForm
                receipt={editingReceipt}
                receiptBooks={receiptBooks}
                tasks={tasks}
                onSuccess={handleDialogClose}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <main className="flex-1 overflow-auto p-6">
        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <i className="fas fa-spinner fa-spin text-gray-400 text-2xl mb-2"></i>
                <p className="text-gray-500">Loading receipts...</p>
              </div>
            ) : receipts.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-receipt text-gray-400 text-4xl mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No receipts found</h3>
                <p className="text-gray-500 mb-4">
                  Start adding receipts to track donations and income.
                </p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-islamic-600 hover:bg-islamic-700">
                      <i className="fas fa-plus mr-2"></i>
                      Add First Receipt
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Receipt</DialogTitle>
                    </DialogHeader>
                    <ReceiptForm
                      receiptBooks={receiptBooks}
                      tasks={tasks}
                      onSuccess={handleDialogClose}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Book</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Giver Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipts.map((receipt) => (
                      <TableRow key={receipt.id}>
                        <TableCell className="font-medium">
                          #{receipt.receiptNumber}
                        </TableCell>
                        <TableCell>{getReceiptBookNumber(receipt.receiptBookId)}</TableCell>
                        <TableCell>{getTaskName(receipt.taskId)}</TableCell>
                        <TableCell className="font-medium">{receipt.giverName}</TableCell>
                        <TableCell className="text-gray-600">{receipt.address}</TableCell>
                        <TableCell className="text-gray-600">
                          {receipt.phoneNumber || "N/A"}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-islamic-600">
                          {formatCurrency(receipt.amount)}
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {new Date(receipt.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(receipt)}
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                            {isAdminOrManager && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(receipt.id)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <i className="fas fa-trash"></i>
                              </Button>
                            )}
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
      </main>
    </>
  );
}
