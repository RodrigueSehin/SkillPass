"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    // Native share sheet on mobile; clipboard everywhere else.
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Cancelled or unsupported: fall back to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copiez ce lien :", url);
    }
  }

  return (
    <Button variant="outline" onClick={share}>
      {copied ? <Check /> : <Share2 />}
      {copied ? "Lien copié" : "Partager"}
    </Button>
  );
}
