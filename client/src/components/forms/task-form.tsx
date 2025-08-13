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
import type { Task } from "@shared/schema";

const taskFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(["active", "inactive", "completed"]).default("active"),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  task?: Task | null;
  onSuccess?: () => void;
}

export default function TaskForm({ task, onSuccess }: TaskFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: task?.name || "",
      description: task?.description || "",
      status: task?.status || "active",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: TaskFormData) => {
      if (task) {
        return apiRequest("PUT", `/api/tasks/${task.id}`, data);
      } else {
        return apiRequest("POST", "/api/tasks", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Success",
        description: task ? "Task updated successfully" : "Task created successfully",
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

  const onSubmit = (data: TaskFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Task Name</Label>
        <Input
          id="name"
          {...form.register("name")}
          placeholder="e.g., Construction, Charity, Education"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...form.register("description")}
          placeholder="Brief description of this task category"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select
          value={form.watch("status")}
          onValueChange={(value) => form.setValue("status", value as "active" | "inactive" | "completed")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
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
          disabled={mutation.isPending}
          className="bg-islamic-600 hover:bg-islamic-700"
        >
          {mutation.isPending ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              {task ? "Updating..." : "Creating..."}
            </>
          ) : (
            task ? "Update Task" : "Create Task"
          )}
        </Button>
      </div>
    </form>
  );
}
