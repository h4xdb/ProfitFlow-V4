import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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

export default function Dashboard() {
  const { user, isAdminOrManager } = useAuth();
  const { toast } = useToast();

  const { data: financials, isLoading } = useQuery<FinancialData>({
    queryKey: ["/api/financials"],
    enabled: !!user,
  });

  const handlePublishReports = async () => {
    try {
      await apiRequest("POST", "/api/reports/publish", {});
      toast({
        title: "Success",
        description: "Financial reports have been published successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to publish reports",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  if (isLoading || !financials) {
    return (
      <>
        <Header 
          title="Dashboard" 
          subtitle="Financial overview and recent activities" 
        />
        <main className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 sm:p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </>
    );
  }

  const actions = isAdminOrManager ? (
    <>
      <Button 
        onClick={handlePublishReports}
        className="bg-islamic-600 hover:bg-islamic-700"
      >
        <i className="fas fa-upload mr-2"></i>
        Publish Reports
      </Button>
      <Button 
        onClick={() => window.open('/backup', '_blank')}
        className="bg-primary-600 hover:bg-primary-700"
      >
        <i className="fas fa-download mr-2"></i>
        Backup Data
      </Button>
    </>
  ) : null;

  return (
    <>
      <Header 
        title="Dashboard" 
        subtitle="Financial overview and recent activities" 
        actions={actions}
      />
      
      <main className="flex-1 overflow-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Income</p>
                  <p className="text-2xl sm:text-3xl font-bold text-islamic-600">
                    {formatCurrency(financials.totalIncome)}
                  </p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <i className="fas fa-arrow-up text-xs mr-1"></i>
                    Active donations
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-islamic-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-hand-holding-usd text-islamic-600 text-lg sm:text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  <p className="text-2xl sm:text-3xl font-bold text-red-600">
                    {formatCurrency(financials.totalExpenses)}
                  </p>
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <i className="fas fa-minus text-xs mr-1"></i>
                    Operational costs
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-credit-card text-red-600 text-lg sm:text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Balance</p>
                  <p className={`text-3xl font-bold ${financials.currentBalance >= 0 ? 'text-primary-600' : 'text-red-600'}`}>
                    {formatCurrency(financials.currentBalance)}
                  </p>
                  <p className={`text-sm flex items-center mt-1 ${financials.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <i className={`fas ${financials.currentBalance >= 0 ? 'fa-check' : 'fa-exclamation-triangle'} text-xs mr-1`}></i>
                    {financials.currentBalance >= 0 ? 'Healthy position' : 'Needs attention'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-wallet text-primary-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {financials.incomeByTask.length}
                  </p>
                  <p className="text-sm text-blue-600 flex items-center mt-1">
                    <i className="fas fa-tasks text-xs mr-1"></i>
                    Income categories
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-tasks text-blue-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task Overview */}
        {financials.incomeByTask.length > 0 && (
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Task Overview</h3>
            </div>
            <CardContent className="p-6 space-y-4">
              {financials.incomeByTask.map((task) => (
                <div key={task.taskId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-islamic-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-tasks text-islamic-600"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{task.taskName}</p>
                      <p className="text-sm text-gray-500">
                        {task.receiptBookCount} receipt books • {formatCurrency(task.total)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/receipts"
              className="flex flex-col items-center space-y-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-islamic-300 hover:bg-islamic-50 transition-colors"
            >
              <div className="w-12 h-12 bg-islamic-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-receipt text-islamic-600 text-xl"></i>
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900">Add Receipt</p>
                <p className="text-xs text-gray-500">Enter new donation</p>
              </div>
            </a>

            {isAdminOrManager && (
              <a
                href="/expenses"
                className="flex flex-col items-center space-y-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors"
              >
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-credit-card text-red-600 text-xl"></i>
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">Add Expense</p>
                  <p className="text-xs text-gray-500">Record expenditure</p>
                </div>
              </a>
            )}

            {isAdminOrManager && (
              <a
                href="/receipt-books"
                className="flex flex-col items-center space-y-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-book text-blue-600 text-xl"></i>
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">New Receipt Book</p>
                  <p className="text-xs text-gray-500">Create & assign</p>
                </div>
              </a>
            )}

            {isAdminOrManager && (
              <a
                href="/reports"
                className="flex flex-col items-center space-y-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-bar text-primary-600 text-xl"></i>
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">View Reports</p>
                  <p className="text-xs text-gray-500">Financial analytics</p>
                </div>
              </a>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
