import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/card";

interface QRCodeCardProps {
  url: string;
  label?: string;
}

export function QRCodeCard({ url, label = "Scannez pour vérifier" }: QRCodeCardProps) {
  return (
    <Card className="inline-flex flex-col items-center gap-2 p-4">
      <QRCodeSVG value={url} size={96} fgColor="#011E50" level="M" title={`QR code vers ${url}`} />
      <p className="text-muted text-xs">{label}</p>
    </Card>
  );
}
