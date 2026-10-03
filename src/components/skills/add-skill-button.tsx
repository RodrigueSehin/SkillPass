"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { SkillForm } from "./skill-form";
import { addSkillAction } from "@/app/dashboard/skills/actions";

export function AddSkillButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> Ajouter une compétence
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Ajouter une compétence">
        <SkillForm submitLabel="Ajouter" onSubmit={addSkillAction} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
