import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Expense, ExpenseType } from "@shared/schema";

const expenseFormSchema = z.object({
  expenseTypeId: z.string().min(1, "Expense type is required"),
  amount: z.string().min(1, "Amount is required").refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be a valid number greater than 0"),
  description: z.string().optional(),
  expenseDate: z.string().min(1, "Expense date is required"),
});

const expenseTypeFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

type ExpenseFormData = z.infer<typeof expenseFormSchema>;
type ExpenseTypeFormData = z.infer<typeof expenseTypeFormSchema>;

interface ExpenseFormProps {
  expense?: Expense | null;
  expenseType?: ExpenseType | null;
  expenseTypes?: ExpenseType[];
  isTypeForm?: boolean;
  onSuccess?: () => void;
}

export default function ExpenseForm({ 
  expense, 
  expenseType, 
  expenseTypes = [], 
  isTypeForm = false, 
  onSuccess 
}: ExpenseFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const expenseForm = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      expenseTypeId: expense?.expenseTypeId || "",
      amount: expense ? expense.amount.toString() : "",
      description: expense?.description || "",
      expenseDate: expense ? new Date(expense.expenseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    },
  });

  const typeForm = useForm<ExpenseTypeFormData>({
    resolver: zodResolver(expenseTypeFormSchema),
    defaultValues: {
      name: expenseType?.name || "",
      description: expenseType?.description || "",
      status: expenseType?.status || "active",
    },
  });

  const expenseMutation = useMutation({
    mutationFn: (data: ExpenseFormData) => {
      // Send data as-is since backend schema will handle the date transformation
      if (expense) {
        return apiRequest("PUT", `/api/expenses/${expense.id}`, data);
      } else {
        return apiRequest("POST", "/api/expenses", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financials"] });
      toast({
        title: "Success",
        description: expense ? "Expense updated successfully" : "Expense created successfully",
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

  const typeMutation = useMutation({
    mutationFn: (data: ExpenseTypeFormData) => {
      if (expenseType) {
        return apiRequest("PUT", `/api/expense-types/${expenseType.id}`, data);
      } else {
        return apiRequest("POST", "/api/expense-types", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-types"] });
      toast({
        title: "Success",
        description: expenseType ? "Expense type updated successfully" : "Expense type created successfully",
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

  const onSubmitExpense = (data: ExpenseFormData) => {
    expenseMutation.mutate({
      ...data,
      expenseDate: new Date(data.expenseDate).toISOString(),
    });
  };

  const onSubmitType = (data: ExpenseTypeFormData) => {
    typeMutation.mutate(data);
  };

  if (isTypeForm) {
    return (
      <form onSubmit={typeForm.handleSubmit(onSubmitType)} className="space-y-4">
        <div>
          <Label htmlFor="name">Expense Type Name</Label>
          <Input
            id="name"
            {...typeForm.register("name")}
            placeholder="e.g., Electricity Bill, Salary, Maintenance"
          />
          {typeForm.formState.errors.name && (
            <p className="text-sm text-red-600 mt-1">
              {typeForm.formState.errors.name.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...typeForm.register("description")}
            placeholder="Brief description of this expense type"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={typeForm.watch("status")}
            onValueChange={(value) => typeForm.setValue("status", value as "active" | "inactive")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
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
            disabled={typeMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {typeMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                {expenseType ? "Updating..." : "Creating..."}
              </>
            ) : (
              expenseType ? "Update Type" : "Create Type"
            )}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={expenseForm.handleSubmit(onSubmitExpense)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="expenseTypeId">Expense Type</Label>
          <Select
            value={expenseForm.watch("expenseTypeId")}
            onValueChange={(value) => expenseForm.setValue("expenseTypeId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select expense type" />
            </SelectTrigger>
            <SelectContent>
              {expenseTypes.filter(type => type.status === "active").map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {expenseForm.formState.errors.expenseTypeId && (
            <p className="text-sm text-red-600 mt-1">
              {expenseForm.formState.errors.expenseTypeId.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            {...expenseForm.register("amount")}
            placeholder="0.00"
          />
          {expenseForm.formState.errors.amount && (
            <p className="text-sm text-red-600 mt-1">
              {expenseForm.formState.errors.amount.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="expenseDate">Expense Date</Label>
        <Input
          id="expenseDate"
          type="date"
          {...expenseForm.register("expenseDate")}
        />
        {expenseForm.formState.errors.expenseDate && (
          <p className="text-sm text-red-600 mt-1">
            {expenseForm.formState.errors.expenseDate.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description / Notes</Label>
        <Textarea
          id="description"
          {...expenseForm.register("description")}
          placeholder="Additional details about this expense (optional)"
          rows={3}
        />
      </div>

      <div className="bg-red-50 rounded-lg p-4">
        <h4 className="font-medium text-red-900 mb-2">Expense Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Type:</span>
            <span className="ml-2 font-medium">
              {expenseTypes.find(t => t.id === expenseForm.watch("expenseTypeId"))?.name || "Not selected"}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Amount:</span>
            <span className="ml-2 font-medium">
              ₹{expenseForm.watch("amount") ? Number(expenseForm.watch("amount")).toFixed(2) : "0.00"}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Date:</span>
            <span className="ml-2 font-medium">
              {expenseForm.watch("expenseDate") ? 
                new Date(expenseForm.watch("expenseDate")).toLocaleDateString() : 
                "Not set"
              }
            </span>
          </div>
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
          disabled={expenseMutation.isPending}
          className="bg-red-600 hover:bg-red-700"
        >
          {expenseMutation.isPending ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              {expense ? "Updating..." : "Creating..."}
            </>
          ) : (
            expense ? "Update Expense" : "Create Expense"
          )}
        </Button>
      </div>
    </form>
  );
}
