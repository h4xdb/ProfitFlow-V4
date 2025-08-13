import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Eye, BookOpen, Receipt } from "lucide-react";

interface PublicReportData {
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
  incomeByTask: Array<{
    taskId: string;
    taskName: string;
    total: number;
    receiptBookCount: number;
  }>;
  publishedAt: string;
}

interface PublicTask {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
}

interface PublicReceiptBook {
  id: string;
  bookNumber: string;
  startingReceiptNumber: number;
  endingReceiptNumber: number;
  totalReceipts: number;
  createdAt: string;
}

interface PublicReceipt {
  id: string;
  receiptNumber: number;
  amount: string;
  createdAt: string;
  giverName: string; // Privacy protected
}

interface PublicExpense {
  id: string;
  amount: string;
  description: string;
  expenseDate: string;
  expenseTypeName: string;
  createdAt: string;
}

export default function PublicReports() {
  const [selectedTask, setSelectedTask] = useState<PublicTask | null>(null);
  const [selectedReceiptBook, setSelectedReceiptBook] = useState<PublicReceiptBook | null>(null);
  const [showExpenses, setShowExpenses] = useState(false);

  const { data: reportData, isLoading, error } = useQuery<PublicReportData>({
    queryKey: ["/api/reports/published"],
    retry: false,
  });

  const { data: tasks } = useQuery<PublicTask[]>({
    queryKey: ["/api/public/tasks"],
    enabled: !!reportData,
  });

  const { data: receiptBooks } = useQuery<PublicReceiptBook[]>({
    queryKey: ["/api/public/tasks", selectedTask?.id, "receipt-books"],
    enabled: !!selectedTask,
  });

  const { data: receipts } = useQuery<PublicReceipt[]>({
    queryKey: ["/api/public/receipt-books", selectedReceiptBook?.id, "receipts"],
    enabled: !!selectedReceiptBook,
  });

  const { data: expenses } = useQuery<PublicExpense[]>({
    queryKey: ["/api/public/expenses"],
    enabled: showExpenses,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-islamic-600 rounded-2xl flex items-center justify-center mr-4">
                <i className="fas fa-mosque text-white text-2xl"></i>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Masjid Financial Transparency</h1>
                <p className="mt-2 text-gray-600">Public financial reports and donation tracking</p>
              </div>
            </div>
            {reportData && (
              <p className="text-sm text-gray-500">
                Last updated: {new Date(reportData.publishedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <i className="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Financial Reports Available</h2>
              <p className="text-gray-600 mb-4">
                Financial reports have not been published yet. Please check back later.
              </p>
              <p className="text-sm text-gray-500">
                The administration team will publish transparency reports regularly to keep the community informed 
                about the Masjid's financial status and donation usage.
              </p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <>
            {/* Loading Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6 text-center">
                    <Skeleton className="h-6 w-32 mx-auto mb-2" />
                    <Skeleton className="h-10 w-24 mx-auto mb-1" />
                    <Skeleton className="h-4 w-28 mx-auto" />
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* Loading Table */}
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : reportData ? (
          <>
            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Donations Received</h3>
                  <p className="text-4xl font-bold text-islamic-600 mb-2">
                    {formatCurrency(reportData.totalIncome)}
                  </p>
                  <p className="text-sm text-gray-500">All donation categories combined</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Expenses</h3>
                  <p className="text-4xl font-bold text-red-600 mb-2">
                    {formatCurrency(reportData.totalExpenses)}
                  </p>
                  <p className="text-sm text-gray-500">Operational and project costs</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Balance</h3>
                  <p className={`text-4xl font-bold mb-2 ${reportData.currentBalance >= 0 ? 'text-primary-600' : 'text-red-600'}`}>
                    {formatCurrency(reportData.currentBalance)}
                  </p>
                  <p className="text-sm text-gray-500">Available for future projects</p>
                </CardContent>
              </Card>
            </div>

            {/* Interactive Donation Categories */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Donation Categories</h2>
                <p className="text-sm text-gray-500">Click on any category to explore receipt books and individual donations</p>
              </div>
              <CardContent className="p-6">
                {reportData.incomeByTask.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-info-circle text-gray-400 text-3xl mb-3"></i>
                    <p className="text-gray-600">No donation categories to display yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Amount Raised</TableHead>
                          <TableHead className="text-center">Receipt Books</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.incomeByTask.map((task) => {
                          const taskDetail = tasks?.find(t => t.id === task.taskId);
                          return (
                            <TableRow key={task.taskId} className="hover:bg-gray-50">
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-islamic-100 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-tasks text-islamic-600"></i>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-900">{task.taskName}</span>
                                    {taskDetail?.description && (
                                      <p className="text-sm text-gray-500">{taskDetail.description}</p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-semibold text-islamic-600">
                                {formatCurrency(task.total)}
                              </TableCell>
                              <TableCell className="text-center text-gray-500">
                                {task.receiptBookCount}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-green-100 text-green-800">
                                  Active
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedTask(taskDetail || null)}
                                  className="flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expenses Summary */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Expenses Transparency</h2>
                  <p className="text-sm text-gray-500">View detailed breakdown of all expenditures</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowExpenses(true)}
                  className="flex items-center gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  View All Expenses
                </Button>
              </div>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Receipt className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Expenses</h3>
                  <p className="text-3xl font-bold text-red-600 mb-2">
                    {formatCurrency(reportData.totalExpenses)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Click "View All Expenses" to see detailed breakdown by category and date
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Transparency Statement */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Our Commitment to Transparency</h2>
              </div>
              <CardContent className="p-6">
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 mb-4">
                    As trustees of the community's generous donations, we believe in complete financial transparency. 
                    This public report provides real-time visibility into how your contributions are being managed and utilized 
                    for the betterment of our Masjid and community.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-islamic-50 rounded-lg p-4">
                      <h4 className="font-medium text-islamic-900 mb-2 flex items-center">
                        <i className="fas fa-shield-alt mr-2"></i>
                        Financial Integrity
                      </h4>
                      <p className="text-sm text-islamic-700">
                        Every donation is carefully tracked and allocated according to the donor's intention and 
                        Islamic principles of financial stewardship.
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                        <i className="fas fa-users mr-2"></i>
                        Community Oversight
                      </h4>
                      <p className="text-sm text-blue-700">
                        Our financial management follows Islamic guidelines and is overseen by trusted community members 
                        and qualified administrators.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Questions or Concerns?</h4>
                    <p className="text-sm text-gray-600">
                      If you have any questions about our financial practices or would like additional information, 
                      please contact the Masjid administration. We are committed to addressing any concerns and 
                      maintaining the highest standards of financial accountability.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>This is a public transparency report generated by the Masjid ERP Financial Management System.</p>
            <p className="mt-1">
              Reports are published regularly to ensure community trust and financial accountability.
            </p>
          </div>
        </div>
      </footer>

      {/* Task Details Modal */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {selectedTask?.name} - Receipt Books
            </DialogTitle>
            <DialogDescription>
              Explore all receipt books and individual donations for this category
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {receiptBooks && receiptBooks.length > 0 ? (
              <div className="grid gap-4">
                {receiptBooks.map((book) => (
                  <Card key={book.id} className="border hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-lg">Receipt Book #{book.bookNumber}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            Receipt Numbers: {book.startingReceiptNumber} - {book.endingReceiptNumber}
                          </p>
                          <p className="text-sm text-gray-500">
                            Total Receipts: {book.totalReceipts}
                          </p>
                          <p className="text-sm text-gray-500">
                            Created: {new Date(book.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReceiptBook(book)}
                          className="flex items-center gap-2"
                        >
                          <Receipt className="w-4 h-4" />
                          View Receipts
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No receipt books found for this category.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Details Modal */}
      <Dialog open={!!selectedReceiptBook} onOpenChange={() => setSelectedReceiptBook(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedReceiptBook(null);
                  // Keep task modal open
                }}
                className="p-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Receipt Book #{selectedReceiptBook?.bookNumber} - Individual Donations
                </DialogTitle>
                <DialogDescription>
                  All donations recorded in this receipt book with complete donor information
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            {receipts && receipts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Donor</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipts.map((receipt) => (
                      <TableRow key={receipt.id}>
                        <TableCell className="font-medium">
                          #{receipt.receiptNumber}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {receipt.giverName}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-islamic-600">
                          {formatCurrency(Number(receipt.amount))}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(receipt.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No receipts found in this book.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Expenses Modal */}
      <Dialog open={showExpenses} onOpenChange={setShowExpenses}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              All Expenses Breakdown
            </DialogTitle>
            <DialogDescription>
              Complete transparency of all organizational expenditures
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {expenses && expenses.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          <Badge variant="outline">{expense.expenseTypeName}</Badge>
                        </TableCell>
                        <TableCell>{expense.description || 'No description'}</TableCell>
                        <TableCell className="text-right font-semibold text-red-600">
                          {formatCurrency(Number(expense.amount))}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(expense.expenseDate).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No expenses recorded yet.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
