import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

const userFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  fullName: z.string().min(1, "Full name is required"),
  role: z.enum(["admin", "manager", "cash_collector"]),
  isActive: z.boolean().default(true),
}).refine((data) => {
  // Password is required for new users
  return data.password && data.password.length >= 6;
}, {
  message: "Password is required",
  path: ["password"],
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
  user?: User | null;
  onSuccess?: () => void;
}

export default function UserForm({ user, onSuccess }: UserFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: user?.username || "",
      password: "",
      fullName: user?.fullName || "",
      role: user?.role || "cash_collector",
      isActive: user?.isActive ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: UserFormData) => {
      const payload = { ...data };
      // Remove password if empty for updates
      if (user && !data.password) {
        delete payload.password;
      }
      
      if (user) {
        return apiRequest("PUT", `/api/users/${user.id}`, payload);
      } else {
        return apiRequest("POST", "/api/users", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: user ? "User updated successfully" : "User created successfully",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserFormData) => {
    mutation.mutate(data);
  };

  const roleDescriptions = {
    admin: "Full system access, can manage users and all features",
    manager: "Can manage tasks, receipt books, expenses, and publish reports",
    cash_collector: "Can only enter receipts for assigned receipt books",
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          {...form.register("fullName")}
          placeholder="Enter full name"
        />
        {form.formState.errors.fullName && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.fullName.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          {...form.register("username")}
          placeholder="Enter username"
        />
        {form.formState.errors.username && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.username.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="password">
          Password {user && <span className="text-gray-500">(leave blank to keep current)</span>}
        </Label>
        <Input
          id="password"
          type="password"
          {...form.register("password")}
          placeholder={user ? "Enter new password" : "Enter password"}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="role">Role</Label>
        <Select
          value={form.watch("role")}
          onValueChange={(value) => form.setValue("role", value as "admin" | "manager" | "cash_collector")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="cash_collector">Cash Collector</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          {roleDescriptions[form.watch("role")]}
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={form.watch("isActive")}
          onCheckedChange={(checked) => form.setValue("isActive", checked)}
        />
        <Label htmlFor="isActive">Active User</Label>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Role Permissions</h4>
        <div className="text-sm text-blue-700">
          {form.watch("role") === "admin" && (
            <ul className="space-y-1">
              <li>• Full system access and control</li>
              <li>• Can create, edit, and delete users</li>
              <li>• All manager and cash collector permissions</li>
              <li>• System backup and restore capabilities</li>
            </ul>
          )}
          {form.watch("role") === "manager" && (
            <ul className="space-y-1">
              <li>• Create and manage tasks/categories</li>
              <li>• Create and assign receipt books</li>
              <li>• Add and manage expenses</li>
              <li>• Publish financial reports publicly</li>
              <li>• View all receipts and financial data</li>
            </ul>
          )}
          {form.watch("role") === "cash_collector" && (
            <ul className="space-y-1">
              <li>• Enter receipts for assigned receipt books only</li>
              <li>• View own receipts and assigned books</li>
              <li>• Cannot modify system settings</li>
              <li>• Cannot access financial reports</li>
            </ul>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="bg-primary-600 hover:bg-primary-700"
        >
          {mutation.isPending ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              {user ? "Updating..." : "Creating..."}
            </>
          ) : (
            user ? "Update User" : "Create User"
          )}
        </Button>
      </div>
    </form>
  );
}
