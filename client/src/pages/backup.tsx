import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Backup() {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadBackup = async (format: 'sql' | 'csv') => {
    setIsDownloading(format);
    try {
      const response = await fetch(`/api/backup/${format}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download backup');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `masjid_backup_${new Date().toISOString().split('T')[0]}.${format === 'sql' ? 'sql' : 'json'}`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: `${format.toUpperCase()} backup downloaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download backup",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(null);
    }
  };

  const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast({
        title: "Error",
        description: "Please select a valid JSON backup file",
        variant: "destructive",
      });
      return;
    }

    setIsRestoring(true);
    try {
      const fileContent = await file.text();
      const backupData = JSON.parse(fileContent);

      const response = await apiRequest("POST", "/api/restore", backupData);
      
      toast({
        title: "Success",
        description: "Data restored successfully. Please refresh the page.",
      });

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Suggest page refresh
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to restore data",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <>
      <Header
        title="Data Backup"
        subtitle="Download complete backup of all system data"
      />

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Backup Instructions */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Backup Information</h2>
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <i className="fas fa-info-circle text-blue-600 mt-1"></i>
                    <div>
                      <h3 className="font-medium text-blue-900">About Data Backup</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Regular backups ensure your Masjid's financial data is safe and can be restored if needed. 
                        We recommend creating backups before major updates or at least weekly.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">What's Included</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li><i className="fas fa-check text-green-600 mr-2"></i>All user accounts and roles</li>
                      <li><i className="fas fa-check text-green-600 mr-2"></i>Tasks and categories</li>
                      <li><i className="fas fa-check text-green-600 mr-2"></i>Receipt books and assignments</li>
                      <li><i className="fas fa-check text-green-600 mr-2"></i>All donation receipts</li>
                      <li><i className="fas fa-check text-green-600 mr-2"></i>Expense records and types</li>
                      <li><i className="fas fa-check text-green-600 mr-2"></i>Published financial reports</li>
                    </ul>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Security Notice</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li><i className="fas fa-shield-alt text-blue-600 mr-2"></i>Passwords are included (encrypted)</li>
                      <li><i className="fas fa-shield-alt text-blue-600 mr-2"></i>Store backups securely</li>
                      <li><i className="fas fa-shield-alt text-blue-600 mr-2"></i>Limit access to authorized personnel</li>
                      <li><i className="fas fa-shield-alt text-blue-600 mr-2"></i>Delete old backups after archiving</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Backup Options */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Download Backup</h2>
              <p className="text-sm text-gray-500">Choose your preferred backup format</p>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SQL Backup */}
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-database text-blue-600 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">SQL Database Export</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Complete database backup in SQL format. Can be restored using database tools or the original system.
                    </p>
                    <ul className="text-xs text-gray-500 mb-6 space-y-1">
                      <li>• Preserves all relationships</li>
                      <li>• Direct database restoration</li>
                      <li>• Professional format</li>
                      <li>• Includes structure and data</li>
                    </ul>
                    <Button
                      onClick={() => handleDownloadBackup('sql')}
                      disabled={isDownloading !== null}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isDownloading === 'sql' ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Generating SQL...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-download mr-2"></i>
                          Download SQL Backup
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* JSON Backup */}
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-green-400 hover:bg-green-50 transition-colors">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-file-code text-green-600 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">JSON Data Export</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Human-readable backup in JSON format. Easy to view, analyze, and process with scripts.
                    </p>
                    <ul className="text-xs text-gray-500 mb-6 space-y-1">
                      <li>• Human readable format</li>
                      <li>• Easy to parse and analyze</li>
                      <li>• Lightweight file size</li>
                      <li>• Universal compatibility</li>
                    </ul>
                    <Button
                      onClick={() => handleDownloadBackup('csv')}
                      disabled={isDownloading !== null}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {isDownloading === 'csv' ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Generating JSON...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-download mr-2"></i>
                          Download JSON Backup
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Backup Schedule Recommendation */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Backup Schedule Recommendations</h2>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <i className="fas fa-calendar-day text-yellow-600 text-2xl mb-2"></i>
                  <h3 className="font-medium text-yellow-900">Daily</h3>
                  <p className="text-sm text-yellow-700">For high-activity periods like Ramadan or major fundraising</p>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <i className="fas fa-calendar-week text-blue-600 text-2xl mb-2"></i>
                  <h3 className="font-medium text-blue-900">Weekly</h3>
                  <p className="text-sm text-blue-700">Regular backup schedule for ongoing operations</p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <i className="fas fa-calendar-alt text-green-600 text-2xl mb-2"></i>
                  <h3 className="font-medium text-green-900">Before Changes</h3>
                  <p className="text-sm text-green-700">Always backup before system updates or major changes</p>
                </div>
              </div>

              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
                  Best Practices
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Store backups in multiple secure locations</li>
                  <li>• Test backup restoration periodically</li>
                  <li>• Keep at least 3 recent backups available</li>
                  <li>• Document backup procedures for staff</li>
                  <li>• Encrypt backups if storing on external services</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Restore Section */}
          <Card>
            <div className="px-4 sm:px-6 py-4 border-b border-red-200 bg-red-50">
              <h2 className="text-lg sm:text-xl font-semibold text-red-900">Data Restoration</h2>
              <p className="text-sm text-red-700">⚠️ Administrator only - Complete data replacement</p>
            </div>
            <CardContent className="p-4 sm:p-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4 mb-6">
                <div className="flex items-start">
                  <i className="fas fa-exclamation-triangle text-orange-600 text-lg mr-3 mt-1 flex-shrink-0"></i>
                  <div>
                    <p className="text-orange-800 font-semibold text-sm sm:text-base">Critical Warning</p>
                    <p className="text-orange-700 text-xs sm:text-sm mt-1">
                      Data restoration permanently replaces all current system data with the backup file. 
                      This action cannot be undone. Create a current backup before proceeding.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="restore-file" className="block text-sm font-medium text-gray-700 mb-2">
                    Select JSON Backup File
                  </label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    id="restore-file"
                    accept=".json"
                    onChange={handleRestoreBackup}
                    disabled={isRestoring}
                    className="w-full cursor-pointer text-sm file:mr-4 file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-islamic-50 file:text-islamic-700 hover:file:bg-islamic-100"
                    data-testid="input-restore-file"
                  />
                </div>

                {isRestoring && (
                  <div className="flex flex-col sm:flex-row items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <i className="fas fa-spinner fa-spin text-blue-600 mr-0 sm:mr-3 mb-2 sm:mb-0"></i>
                    <span className="text-blue-700 font-medium text-sm text-center">
                      Restoring data... This may take a few minutes.
                    </span>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Restoration Requirements:</h4>
                  <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                    <li>• Only JSON backup files from this system are supported</li>
                    <li>• Administrator privileges required</li>
                    <li>• All users will need to log in again after restoration</li>
                    <li>• Page will refresh automatically when complete</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
