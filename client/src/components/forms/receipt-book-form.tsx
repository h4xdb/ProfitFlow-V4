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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ReceiptBook, Task, User } from "@shared/schema";

const receiptBookFormSchema = z.object({
  bookNumber: z.string().min(1, "Book number is required"),
  taskId: z.string().min(1, "Task is required"),
  assignedTo: z.string().optional(),
  startingReceiptNumber: z.coerce.number().min(1, "Must be at least 1"),
  endingReceiptNumber: z.coerce.number().min(1, "Must be at least 1"),
  status: z.enum(["active", "assigned", "completed"]).default("active"),
}).refine((data) => data.endingReceiptNumber > data.startingReceiptNumber, {
  message: "Ending number must be greater than starting number",
  path: ["endingReceiptNumber"],
});

type ReceiptBookFormData = z.infer<typeof receiptBookFormSchema>;

interface ReceiptBookFormProps {
  receiptBook?: ReceiptBook | null;
  tasks: Task[];
  users: User[];
  onSuccess?: () => void;
}

export default function ReceiptBookForm({ receiptBook, tasks, users, onSuccess }: ReceiptBookFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ReceiptBookFormData>({
    resolver: zodResolver(receiptBookFormSchema),
    defaultValues: {
      bookNumber: receiptBook?.bookNumber || "",
      taskId: receiptBook?.taskId || "",
      assignedTo: receiptBook?.assignedTo || "",
      startingReceiptNumber: receiptBook?.startingReceiptNumber || 1,
      endingReceiptNumber: receiptBook?.endingReceiptNumber || 50,
      status: receiptBook?.status || "active",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: ReceiptBookFormData) => {
      if (receiptBook) {
        return apiRequest("PUT", `/api/receipt-books/${receiptBook.id}`, data);
      } else {
        return apiRequest("POST", "/api/receipt-books", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/receipt-books"] });
      toast({
        title: "Success",
        description: receiptBook ? "Receipt book updated successfully" : "Receipt book created successfully",
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

  const onSubmit = (data: ReceiptBookFormData) => {
    mutation.mutate(data);
  };

  const cashCollectors = users.filter(user => user.role === "cash_collector" && user.isActive);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bookNumber">Book Number</Label>
          <Input
            id="bookNumber"
            {...form.register("bookNumber")}
            placeholder="e.g., RB-001, BOOK-2024-01"
          />
          {form.formState.errors.bookNumber && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.bookNumber.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="taskId">Task Category</Label>
          <Select
            value={form.watch("taskId")}
            onValueChange={(value) => form.setValue("taskId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a task" />
            </SelectTrigger>
            <SelectContent>
              {tasks.filter(task => task.status === "active").map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.taskId && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.taskId.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startingReceiptNumber">Starting Receipt Number</Label>
          <Input
            id="startingReceiptNumber"
            type="number"
            {...form.register("startingReceiptNumber")}
            placeholder="1"
          />
          {form.formState.errors.startingReceiptNumber && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.startingReceiptNumber.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="endingReceiptNumber">Ending Receipt Number</Label>
          <Input
            id="endingReceiptNumber"
            type="number"
            {...form.register("endingReceiptNumber")}
            placeholder="50"
          />
          {form.formState.errors.endingReceiptNumber && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.endingReceiptNumber.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="assignedTo">Assign to Cash Collector</Label>
          <Select
            value={form.watch("assignedTo") || "unassigned"}
            onValueChange={(value) => form.setValue("assignedTo", value === "unassigned" ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select collector (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {cashCollectors.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.fullName} ({user.username})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={form.watch("status")}
            onValueChange={(value) => form.setValue("status", value as "active" | "assigned" | "completed")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Receipt Range:</span>
            <span className="ml-2 font-medium">
              {form.watch("startingReceiptNumber")} - {form.watch("endingReceiptNumber")}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Total Receipts:</span>
            <span className="ml-2 font-medium">
              {Math.max(0, (form.watch("endingReceiptNumber") || 0) - (form.watch("startingReceiptNumber") || 0) + 1)}
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
          disabled={mutation.isPending}
          className="bg-islamic-600 hover:bg-islamic-700"
        >
          {mutation.isPending ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              {receiptBook ? "Updating..." : "Creating..."}
            </>
          ) : (
            receiptBook ? "Update Receipt Book" : "Create Receipt Book"
          )}
        </Button>
      </div>
    </form>
  );
}
