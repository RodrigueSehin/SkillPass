"use client";

import { createContext, useContext, useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteCertificationAction } from "@/app/dashboard/certifications/actions";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { RESOURCE_CONFIGS } from "@/components/resources/configs";
import { ResourceForm, type ItemView } from "@/components/resources/resource-manager";

interface Editor {
  openNew: () => void;
  openEdit: (item: ItemView) => void;
  openDelete: (item: ItemView) => void;
}

const EditorContext = createContext<Editor | null>(null);

function useEditor() {
  const editor = useContext(EditorContext);
  if (!editor) throw new Error("Certification editor controls must be rendered inside <CertificationEditor>");
  return editor;
}

/**
 * Owns the add / edit / delete dialogs so that server-rendered cards, hero and empty state can
 * all open them through small client buttons.
 */
export function CertificationEditor({ children }: { children: React.ReactNode }) {
  const config = RESOURCE_CONFIGS.certification;
  const [editing, setEditing] = useState<ItemView | "new" | null>(null);
  const [deleting, setDeleting] = useState<ItemView | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    startTransition(async () => {
      const result = await deleteCertificationAction(target.id);
      setError(result.error);
      setDeleting(null);
    });
  }

  return (
    <EditorContext.Provider
      value={{ openNew: () => setEditing("new"), openEdit: setEditing, openDelete: setDeleting }}
    >
      {children}
      {error && (
        <p role="alert" className="text-danger mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm">
          {error}
        </p>
      )}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" || editing === null ? config.addLabel : `Modifier ${editing.title}`}
      >
        {editing !== null && (
          <ResourceForm
            resource="certification"
            item={editing === "new" ? undefined : editing}
            skillOptions={[]}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>
      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Supprimer cette certification ?"
      >
        <p className="text-muted text-sm">
          « {deleting?.title} » sera définitivement retirée de votre SkillPass.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleting(null)}>
            Annuler
          </Button>
          <Button className="bg-danger hover:bg-red-700" onClick={confirmDelete} disabled={pending}>
            {pending ? "Suppression…" : "Supprimer"}
          </Button>
        </div>
      </Modal>
    </EditorContext.Provider>
  );
}

export function AddCertificationButton({ variant, className }: Pick<ButtonProps, "variant" | "className">) {
  const { openNew } = useEditor();
  return (
    <Button variant={variant} className={className} onClick={openNew}>
      <Plus /> Ajouter une certification
    </Button>
  );
}

export function CertificationCardActions({ item }: { item: ItemView }) {
  const { openEdit, openDelete } = useEditor();
  return (
    <div className="flex shrink-0 gap-0.5">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label={`Modifier ${item.title}`}
        onClick={() => openEdit(item)}
      >
        <Pencil />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label={`Supprimer ${item.title}`}
        onClick={() => openDelete(item)}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
