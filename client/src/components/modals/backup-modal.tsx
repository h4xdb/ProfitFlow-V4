import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface BackupModalProps {
  children: React.ReactNode;
}

export default function BackupModal({ children }: BackupModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const { toast } = useToast();

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Data Backup Options</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <button
            onClick={() => handleDownloadBackup('sql')}
            disabled={isDownloading !== null}
            className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-database text-blue-600"></i>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">MySQL Database Export</p>
                <p className="text-sm text-gray-500">Complete database backup (.sql)</p>
              </div>
            </div>
            {isDownloading === 'sql' ? (
              <i className="fas fa-spinner fa-spin text-gray-400"></i>
            ) : (
              <i className="fas fa-download text-gray-400"></i>
            )}
          </button>

          <button
            onClick={() => handleDownloadBackup('csv')}
            disabled={isDownloading !== null}
            className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-file-code text-green-600"></i>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">JSON Export</p>
                <p className="text-sm text-gray-500">All tables as JSON data</p>
              </div>
            </div>
            {isDownloading === 'csv' ? (
              <i className="fas fa-spinner fa-spin text-gray-400"></i>
            ) : (
              <i className="fas fa-download text-gray-400"></i>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
