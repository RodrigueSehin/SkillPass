"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { RESOURCE_CONFIGS, type FieldDef, type ResourceKey } from "./configs";

type FormValues = Record<string, string | string[]>;

/** Serializable view model built on the server: the client never sees domain objects. */
export interface ItemView {
  id: string;
  title: string;
  subtitle?: string;
  lines: string[];
  badges: { label: string; tone?: BadgeProps["tone"] }[];
  links: { label: string; href: string }[];
  values: FormValues;
}

interface ResourceManagerProps {
  resource: ResourceKey;
  items: ItemView[];
  /** Options for multiselect fields (the user's skills). */
  skillOptions?: string[];
}

export function ResourceManager({ resource, items, skillOptions = [] }: ResourceManagerProps) {
  const config = RESOURCE_CONFIGS[resource];
  const [editing, setEditing] = useState<ItemView | "new" | null>(null);
  const [deleting, setDeleting] = useState<ItemView | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    startTransition(async () => {
      const result = await config.remove(target.id);
      setError(result.error);
      setDeleting(null);
    });
  }

  const addButton = (
    <Button onClick={() => setEditing("new")}>
      <Plus /> {config.addLabel}
    </Button>
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-muted">
          {items.length} {config.singular}
          {items.length > 1 ? "s" : ""}
        </p>
        {addButton}
      </div>

      {error && (
        <p role="alert" className="text-danger mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={config.icon}
          title={config.emptyTitle}
          description={config.emptyDescription}
          action={addButton}
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <Card className="h-full p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold">{item.title}</h2>
                    {item.subtitle && <p className="text-muted text-sm">{item.subtitle}</p>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Modifier ${item.title}`}
                      onClick={() => setEditing(item)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Supprimer ${item.title}`}
                      onClick={() => setDeleting(item)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                {item.lines.map((line) => (
                  <p key={line} className="text-muted mt-2 text-sm">
                    {line}
                  </p>
                ))}
                {item.badges.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.badges.map((b) => (
                      <Badge key={b.label} tone={b.tone ?? "brand"}>
                        {b.label}
                      </Badge>
                    ))}
                  </div>
                )}
                {item.links.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-4">
                    {item.links.map((l) => (
                      <a
                        key={l.href}
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand inline-flex items-center gap-1 text-sm font-medium hover:underline"
                      >
                        {l.label} <ExternalLink className="size-3.5" aria-hidden />
                      </a>
                    ))}
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" || editing === null ? config.addLabel : `Modifier ${editing.title}`}
      >
        {editing !== null && (
          <ResourceForm
            resource={resource}
            item={editing === "new" ? undefined : editing}
            skillOptions={skillOptions}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={`Supprimer ce ${config.singular} ?`}
      >
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
    </>
  );
}

function emptyValues(fields: FieldDef[]): FormValues {
  return Object.fromEntries(fields.map((f) => [f.name, f.type === "multiselect" ? [] : ""]));
}

export function ResourceForm({
  resource,
  item,
  skillOptions,
  onDone,
}: {
  resource: ResourceKey;
  item?: ItemView;
  skillOptions: string[];
  onDone: () => void;
}) {
  const config = RESOURCE_CONFIGS[resource];
  const [values, setValues] = useState<FormValues>({ ...emptyValues(config.fields), ...item?.values });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const set = (name: string, value: string | string[]) => setValues((v) => ({ ...v, [name]: value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(undefined);
    const parsed = config.schema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = item ? await config.update(item.id, values) : await config.add(values);
      if (result.error) setServerError(result.error);
      else onDone();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
      {config.fields.map((field) => {
        const id = `field-${field.name}`;
        const error = errors[field.name];
        return (
          <div key={field.name} className="space-y-2">
            {field.type === "multiselect" ? (
              <fieldset>
                <legend className="mb-2 text-sm font-medium">{field.label}</legend>
                {skillOptions.length === 0 ? (
                  <p className="text-muted text-sm">
                    Ajoutez d&apos;abord des compétences pour pouvoir les relier.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {skillOptions.map((name) => {
                      const selected = (values[field.name] as string[]).includes(name);
                      return (
                        <label
                          key={name}
                          className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${selected ? "border-brand text-brand bg-blue-50" : "border-border"}`}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={selected}
                            onChange={() =>
                              set(
                                field.name,
                                selected
                                  ? (values[field.name] as string[]).filter((n) => n !== name)
                                  : [...(values[field.name] as string[]), name],
                              )
                            }
                          />
                          {name}
                        </label>
                      );
                    })}
                  </div>
                )}
              </fieldset>
            ) : (
              <>
                <Label htmlFor={id}>
                  {field.label}
                  {field.required && <span aria-hidden> *</span>}
                </Label>
                {field.type === "textarea" ? (
                  <textarea
                    id={id}
                    rows={3}
                    value={values[field.name] as string}
                    onChange={(e) => set(field.name, e.target.value)}
                    aria-invalid={Boolean(error)}
                    className="border-border bg-surface w-full rounded-xl border px-4 py-3 text-sm"
                  />
                ) : field.type === "select" ? (
                  <select
                    id={id}
                    value={values[field.name] as string}
                    onChange={(e) => set(field.name, e.target.value)}
                    className="border-border bg-surface h-11 w-full rounded-xl border px-4 text-sm"
                  >
                    <option value="">Non précisé</option>
                    {field.options?.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id={id}
                    type={field.type === "date" ? "date" : field.type === "url" ? "url" : "text"}
                    placeholder={field.placeholder}
                    value={values[field.name] as string}
                    onChange={(e) => set(field.name, e.target.value)}
                    aria-invalid={Boolean(error)}
                  />
                )}
              </>
            )}
            {error && (
              <p role="alert" className="text-danger text-sm">
                {error}
              </p>
            )}
          </div>
        );
      })}
      {serverError && (
        <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
          {serverError}
        </p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Annuler
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : item ? "Enregistrer" : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}
