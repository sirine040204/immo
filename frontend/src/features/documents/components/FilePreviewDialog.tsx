import React from "react";
import { Download } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

interface FilePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string | null;
  fileName?: string;
}

export function FilePreviewDialog({
  isOpen,
  onClose,
  fileUrl,
  fileName,
}: FilePreviewDialogProps) {
  if (!fileUrl) return null;

  const safeUrl = fileUrl.replace('localhost', '127.0.0.1');

  const handleDownload = async () => {
    if (!fileUrl) return;
    try {
      // Create a link with download attribute.
      // We fetch it as blob to ensure browser downloads it rather than opening if it's on same origin or CORS allows.
      const response = await fetch(safeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file", error);
      // Fallback
      window.open(safeUrl, "_blank");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[90vw] w-[1000px] h-[90vh] flex flex-col p-4">
        <DialogHeader className="mb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-slate-900 truncate pr-4">
              {fileName || "Aperçu du fichier"}
            </DialogTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDownload}
              className="text-slate-600 hover:text-brand-green hover:bg-brand-green-light shrink-0 mr-8"
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 w-full bg-slate-100 rounded-lg overflow-hidden relative">
          <iframe
            src={safeUrl}
            className="w-full h-full border-0"
            title={fileName || "Aperçu"}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
