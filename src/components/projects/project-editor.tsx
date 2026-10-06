"use client";

import { createContext, useContext, useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteProjectAction } from "@/app/dashboard/projects/actions";
import { RESOURCE_CONFIGS } from "@/components/resources/configs";
import { ResourceForm, type ItemView } from "@/components/resources/resource-manager";
import { Button, buttonVariants, type ButtonProps } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils/cn";

interface Editor {
  openEdit: (item: ItemView) => void;
  openDelete: (item: ItemView) => void;
}

const EditorContext = createContext<Editor | null>(null);

function useEditor() {
  const editor = useContext(EditorContext);
  if (!editor) throw new Error("Project controls must be rendered inside <ProjectEditor>");
  return editor;
}

/** Owns the add / edit / delete dialogs so server-rendered cards and side panels can open them. */
export function ProjectEditor({
  skillOptions,
  children,
}: {
  skillOptions: string[];
  children: React.ReactNode;
}) {
  const config = RESOURCE_CONFIGS.project;
  const [editing, setEditing] = useState<ItemView | null>(null);
  const [deleting, setDeleting] = useState<ItemView | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    startTransition(async () => {
      const result = await deleteProjectAction(target.id);
      setError(result.error);
      setDeleting(null);
    });
  }

  return (
    <EditorContext.Provider value={{ openEdit: setEditing, openDelete: setDeleting }}>
      {children}
      {error && (
        <p role="alert" className="text-danger mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm">
          {error}
        </p>
      )}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Modifier ${editing.title}` : config.addLabel}
      >
        {editing !== null && (
          <ResourceForm
            resource="project"
            item={editing}
            skillOptions={skillOptions}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>
      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Supprimer ce projet ?">
        <p className="text-muted text-sm">
          « {deleting?.title} » sera définitivement retiré de votre SkillPass.
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

/** Adding happens on its own page; only editing stays in a dialog. */
export function AddProjectButton({ variant, className }: Pick<ButtonProps, "variant" | "className">) {
  return (
    <Link href="/dashboard/projects/new" className={cn(buttonVariants({ variant }), className)}>
      <Plus /> Ajouter un projet
    </Link>
  );
}

export function ProjectCardActions({ item }: { item: ItemView }) {
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
