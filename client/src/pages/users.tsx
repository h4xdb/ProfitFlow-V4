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
import UserForm from "@/components/forms/user-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@shared/schema";

export default function Users() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/users/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
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

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (currentUser?.id === id) {
      toast({
        title: "Error",
        description: "You cannot delete your own account",
        variant: "destructive",
      });
      return;
    }

    if (confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: "bg-purple-100 text-purple-800",
      manager: "bg-blue-100 text-blue-800",
      cash_collector: "bg-green-100 text-green-800",
    };
    const labels = {
      admin: "Admin",
      manager: "Manager",
      cash_collector: "Cash Collector",
    };
    return (
      <Badge className={variants[role as keyof typeof variants] || variants.cash_collector}>
        {labels[role as keyof typeof labels] || role}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge className={isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  return (
    <>
      <Header
        title="User Management"
        subtitle="Manage system users and their roles"
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary-600 hover:bg-primary-700">
                <i className="fas fa-plus mr-2"></i>
                New User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? "Edit User" : "Create New User"}
                </DialogTitle>
              </DialogHeader>
              <UserForm
                user={editingUser}
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
                <p className="text-gray-500">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-users text-gray-400 text-4xl mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-500 mb-4">
                  Create your first user to start managing the system.
                </p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary-600 hover:bg-primary-700">
                      <i className="fas fa-plus mr-2"></i>
                      Create First User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                    </DialogHeader>
                    <UserForm onSuccess={handleDialogClose} />
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                              <i className="fas fa-user text-primary-600 text-sm"></i>
                            </div>
                            <span className="font-medium text-gray-900">{user.fullName}</span>
                            {user.id === currentUser?.id && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">{user.username}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                        <TableCell className="text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(user)}
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                            {user.id !== currentUser?.id && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(user.id)}
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
