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
import ReceiptBookForm from "@/components/forms/receipt-book-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { ReceiptBook, Task, User } from "@shared/schema";

interface ReceiptBookWithDetails extends ReceiptBook {
  task?: Task;
  assignedUser?: User;
  createdByUser?: User;
}

export default function ReceiptBooks() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<ReceiptBookWithDetails | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdminOrManager } = useAuth();

  const { data: receiptBooks = [], isLoading } = useQuery<ReceiptBookWithDetails[]>({
    queryKey: ["/api/receipt-books"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    enabled: isAdminOrManager,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: isAdminOrManager,
  });

  const deleteBookMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/receipt-books/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/receipt-books"] });
      toast({
        title: "Success",
        description: "Receipt book deleted successfully",
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

  const handleEdit = (book: ReceiptBookWithDetails) => {
    setEditingBook(book);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this receipt book?")) {
      deleteBookMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingBook(null);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800",
      assigned: "bg-blue-100 text-blue-800",
      completed: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.active}>
        {status}
      </Badge>
    );
  };

  const getTaskName = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    return task?.name || "Unknown Task";
  };

  const getUserName = (userId: string | null) => {
    if (!userId) return "Unassigned";
    const user = users.find(u => u.id === userId);
    return user?.fullName || "Unknown User";
  };

  return (
    <>
      <Header
        title="Receipt Books"
        subtitle="Manage receipt books and assignments"
        actions={
          isAdminOrManager ? (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-islamic-600 hover:bg-islamic-700">
                  <i className="fas fa-plus mr-2"></i>
                  New Receipt Book
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingBook ? "Edit Receipt Book" : "Create New Receipt Book"}
                  </DialogTitle>
                </DialogHeader>
                <ReceiptBookForm
                  receiptBook={editingBook}
                  tasks={tasks}
                  users={users}
                  onSuccess={handleDialogClose}
                />
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      <main className="flex-1 overflow-auto p-6">
        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <i className="fas fa-spinner fa-spin text-gray-400 text-2xl mb-2"></i>
                <p className="text-gray-500">Loading receipt books...</p>
              </div>
            ) : receiptBooks.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-book text-gray-400 text-4xl mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No receipt books found</h3>
                <p className="text-gray-500 mb-4">
                  {isAdminOrManager 
                    ? "Create your first receipt book to start collecting donations."
                    : "No receipt books have been assigned to you yet."
                  }
                </p>
                {isAdminOrManager && (
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-islamic-600 hover:bg-islamic-700">
                        <i className="fas fa-plus mr-2"></i>
                        Create First Receipt Book
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Receipt Book</DialogTitle>
                      </DialogHeader>
                      <ReceiptBookForm
                        tasks={tasks}
                        users={users}
                        onSuccess={handleDialogClose}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book Number</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Receipt Range</TableHead>
                      <TableHead>Total Receipts</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      {isAdminOrManager && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receiptBooks.map((book) => (
                      <TableRow key={book.id}>
                        <TableCell className="font-medium">{book.bookNumber}</TableCell>
                        <TableCell>{getTaskName(book.taskId)}</TableCell>
                        <TableCell>
                          {book.startingReceiptNumber} - {book.endingReceiptNumber}
                        </TableCell>
                        <TableCell>{book.totalReceipts}</TableCell>
                        <TableCell>{getUserName(book.assignedTo)}</TableCell>
                        <TableCell>{getStatusBadge(book.status)}</TableCell>
                        <TableCell className="text-gray-500">
                          {new Date(book.createdAt).toLocaleDateString()}
                        </TableCell>
                        {isAdminOrManager && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(book)}
                              >
                                <i className="fas fa-edit"></i>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(book.id)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <i className="fas fa-trash"></i>
                              </Button>
                            </div>
                          </TableCell>
                        )}
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
