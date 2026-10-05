"use client";

import { createContext, useContext, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteExperienceAction } from "@/app/dashboard/experiences/actions";
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
  if (!editor) throw new Error("Experience controls must be rendered inside <ExperienceEditor>");
  return editor;
}

/**
 * Owns the add / edit / delete dialogs so that server-rendered cards, hero and side panels
 * can all open them through small client buttons.
 */
export function ExperienceEditor({
  skillOptions,
  children,
}: {
  skillOptions: string[];
  children: React.ReactNode;
}) {
  const config = RESOURCE_CONFIGS.experience;
  const [editing, setEditing] = useState<ItemView | null>(null);
  const [deleting, setDeleting] = useState<ItemView | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    startTransition(async () => {
      const result = await deleteExperienceAction(target.id);
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
            resource="experience"
            item={editing}
            skillOptions={skillOptions}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>
      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Supprimer cette expérience ?">
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

/** Adding happens on its own page; only editing stays in a dialog. */
export function AddExperienceButton({
  variant,
  className,
  children = "Ajouter une expérience",
}: Pick<ButtonProps, "variant" | "className" | "children">) {
  return (
    <Link href="/dashboard/experiences/new" className={cn(buttonVariants({ variant }), className)}>
      <Plus /> {children}
    </Link>
  );
}

export function ExperienceCardActions({ item }: { item: ItemView }) {
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

export function ExperienceDetailsButton({ item }: { item: ItemView }) {
  const { openEdit } = useEditor();
  return (
    <button
      type="button"
      onClick={() => openEdit(item)}
      aria-label={`Voir les détails de ${item.title}`}
      className="text-brand inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
    >
      Voir les détails <ArrowRight className="size-3.5" aria-hidden />
    </button>
  );
}
