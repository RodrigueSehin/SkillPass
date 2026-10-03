"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EvidenceForm, type EvidenceFormOptions } from "./evidence-form";

export function AddEvidenceButton({ skillId, ...options }: EvidenceFormOptions & { skillId?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> Ajouter une preuve
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Ajouter une preuve">
        <EvidenceForm {...options} skillId={skillId} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
