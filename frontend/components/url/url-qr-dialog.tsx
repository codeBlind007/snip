"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check } from "lucide-react";

interface UrlQrDialogProps {
  url: string | null;
  shortCode?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UrlQrDialog({ url, shortCode, open, onOpenChange }: UrlQrDialogProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!url || !open) return;

    QRCode.toDataURL(url, {
      width: 320,
      margin: 2,
      color: {
        dark: "#f4f4f5",
        light: "#121215",
      },
    })
      .then((dataUri) => {
        setQrDataUrl(dataUri);
      })
      .catch((err) => {
        console.error("Failed to generate QR code", err);
      });
  }, [url, open]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `snip-${shortCode || "link"}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-sm text-center">
        <DialogHeader className="items-center">
          <DialogTitle>QR Code</DialogTitle>
          <DialogDescription className="truncate max-w-[280px]">
            {url}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 shadow-inner">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="h-56 w-56 rounded-lg object-contain"
              />
            ) : (
              <div className="h-56 w-56 flex items-center justify-center text-zinc-500 text-xs">
                Generating QR...
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <Button variant="secondary" size="sm" onClick={handleCopyLink} className="gap-1.5 text-xs">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy Link"}</span>
          </Button>

          <Button variant="default" size="sm" onClick={handleDownload} className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            <span>Download PNG</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

