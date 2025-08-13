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
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface FinancialData {
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
  incomeByTask: Array<{
    taskId: string;
    taskName: string;
    total: number;
    receiptBookCount: number;
  }>;
}

interface PublishedReport {
  id: string;
  reportData: string;
  publishedAt: string;
  publishedBy: string;
}

export default function Reports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: financials, isLoading: financialsLoading } = useQuery<FinancialData>({
    queryKey: ["/api/financials"],
  });

  const { data: publishedReport } = useQuery<PublishedReport & FinancialData>({
    queryKey: ["/api/reports/published"],
    retry: false,
  });

  const publishMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/reports/publish", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports/published"] });
      toast({
        title: "Success",
        description: "Financial reports have been published successfully",
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const handlePublish = () => {
    if (confirm("Are you sure you want to publish the current financial data to the public page?")) {
      publishMutation.mutate();
    }
  };

  return (
    <>
      <Header
        title="Financial Reports"
        subtitle="Review and publish financial data for transparency"
        actions={
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => window.open('/public-reports', '_blank')}
              variant="outline"
            >
              <i className="fas fa-external-link-alt mr-2"></i>
              View Public Page
            </Button>
            <Button
              onClick={handlePublish}
              disabled={publishMutation.isPending}
              className="bg-islamic-600 hover:bg-islamic-700"
            >
              {publishMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Publishing...
                </>
              ) : (
                <>
                  <i className="fas fa-upload mr-2"></i>
                  Publish Reports
                </>
              )}
            </Button>
          </div>
        }
      />

      <main className="flex-1 overflow-auto p-6 space-y-6">
        {/* Current Financial Summary */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Current Financial Summary</h2>
            <p className="text-sm text-gray-500">Live data from the system</p>
          </div>
          <CardContent className="p-6">
            {financialsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="text-center">
                    <Skeleton className="h-4 w-24 mx-auto mb-2" />
                    <Skeleton className="h-8 w-32 mx-auto mb-1" />
                    <Skeleton className="h-3 w-20 mx-auto" />
                  </div>
                ))}
              </div>
            ) : financials ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-6 bg-islamic-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Income</h3>
                  <p className="text-3xl font-bold text-islamic-600">
                    {formatCurrency(financials.totalIncome)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">All donations received</p>
                </div>
                
                <div className="text-center p-6 bg-red-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Expenses</h3>
                  <p className="text-3xl font-bold text-red-600">
                    {formatCurrency(financials.totalExpenses)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Operational costs</p>
                </div>
                
                <div className="text-center p-6 bg-primary-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Balance</h3>
                  <p className={`text-3xl font-bold ${financials.currentBalance >= 0 ? 'text-primary-600' : 'text-red-600'}`}>
                    {formatCurrency(financials.currentBalance)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Available funds</p>
                </div>
              </div>
            ) : null}

            {/* Income by Task */}
            {financials && financials.incomeByTask.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Income by Category</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount Raised</TableHead>
                        <TableHead className="text-center">Receipt Books</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financials.incomeByTask.map((task) => (
                        <TableRow key={task.taskId}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-islamic-100 rounded-lg flex items-center justify-center">
                                <i className="fas fa-tasks text-islamic-600"></i>
                              </div>
                              <span className="font-medium text-gray-900">{task.taskName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-islamic-600">
                            {formatCurrency(task.total)}
                          </TableCell>
                          <TableCell className="text-center text-gray-500">
                            {task.receiptBookCount}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Published Report Status */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Published Report Status</h2>
            <p className="text-sm text-gray-500">Data currently visible on the public page</p>
          </div>
          <CardContent className="p-6">
            {publishedReport ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-green-600 font-medium">
                      <i className="fas fa-check-circle mr-1"></i>
                      Reports are published and public
                    </p>
                    <p className="text-xs text-gray-500">
                      Last published: {new Date(publishedReport.publishedAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => window.open('/public-reports', '_blank')}
                    variant="outline"
                    size="sm"
                  >
                    <i className="fas fa-external-link-alt mr-2"></i>
                    View Public Page
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Published Income</p>
                    <p className="text-xl font-bold text-islamic-600">
                      {formatCurrency(publishedReport.totalIncome)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Published Expenses</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(publishedReport.totalExpenses)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Published Balance</p>
                    <p className={`text-xl font-bold ${publishedReport.currentBalance >= 0 ? 'text-primary-600' : 'text-red-600'}`}>
                      {formatCurrency(publishedReport.currentBalance)}
                    </p>
                  </div>
                </div>

                {financials && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">
                      <i className="fas fa-exclamation-triangle mr-2"></i>
                      Data Changes Detected
                    </h4>
                    <p className="text-sm text-yellow-700 mb-3">
                      The current financial data differs from what's published. Consider publishing updated reports.
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-gray-600">Income Change: </span>
                        <span className={financials.totalIncome > publishedReport.totalIncome ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(financials.totalIncome - publishedReport.totalIncome)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Expense Change: </span>
                        <span className={financials.totalExpenses > publishedReport.totalExpenses ? 'text-red-600' : 'text-green-600'}>
                          {formatCurrency(financials.totalExpenses - publishedReport.totalExpenses)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Balance Change: </span>
                        <span className={financials.currentBalance > publishedReport.currentBalance ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(financials.currentBalance - publishedReport.currentBalance)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-exclamation-circle text-yellow-500 text-4xl mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Published</h3>
                <p className="text-gray-500 mb-4">
                  Financial data has not been published to the public page yet.
                </p>
                <Button
                  onClick={handlePublish}
                  disabled={publishMutation.isPending}
                  className="bg-islamic-600 hover:bg-islamic-700"
                >
                  {publishMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Publishing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-upload mr-2"></i>
                      Publish First Report
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
