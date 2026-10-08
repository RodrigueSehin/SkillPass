"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, LayoutPanelTop, Palette, RotateCcw, Save, Type, Building2 } from "lucide-react";
import { saveBrandingAction } from "@/app/business/parametres/actions";
import { brandingSchema } from "@/schemas/org-settings";
import { cn } from "@/lib/utils/cn";
import { DEFAULT_BRANDING, type BrandingSettings } from "@/types/org-settings";
import { Panel } from "../ui";
import { Switch } from "./controls";
import { SettingRow, SoonBadge } from "./rows";

const field =
  "border-border focus-visible:ring-brand/40 h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none focus-visible:ring-2 disabled:bg-slate-50";
const MAX_WELCOME = 200;

function ColorField({
  id,
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} (sélecteur)`}
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="border-border size-11 shrink-0 cursor-pointer rounded-xl border bg-white p-1 disabled:cursor-not-allowed"
        />
        <input
          id={id}
          value={value}
          disabled={disabled}
          maxLength={7}
          onChange={(e) => onChange(e.target.value)}
          className={cn(field, "font-mono uppercase")}
        />
      </div>
      <p className="text-muted text-[11px]">{hint}</p>
    </div>
  );
}

export function BrandingTab({
  initial,
  organizationName,
  logo,
  canEdit,
}: {
  initial: BrandingSettings;
  organizationName: string;
  logo: React.ReactNode;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof BrandingSettings>(key: K, v: BrandingSettings[K]) => {
    setSaved(false);
    setValue((p) => ({ ...p, [key]: v }));
  };

  function save() {
    setError(undefined);
    const parsed = brandingSchema.safeParse(value);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Valeurs invalides");
    startTransition(async () => {
      const result = await saveBrandingAction(parsed.data);
      if (result.error) setError(result.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        <Panel className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-navy text-lg font-bold">Identité visuelle</h2>
              <p className="text-muted text-sm">Personnalisez les éléments visuels de votre organisation.</p>
            </div>
            {canEdit && (
              <button
                type="button"
                disabled={pending}
                onClick={save}
                className="bg-brand flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <Save className="size-4" aria-hidden />{" "}
                {pending ? "Enregistrement…" : "Enregistrer les modifications"}
              </button>
            )}
          </div>
          <div className="mt-5">
            <p className="text-sm font-semibold">Logo de l&apos;organisation</p>
            <div className="mt-2">{logo}</div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <ColorField
              id="brand-primary"
              label="Couleur primaire"
              hint="Menu et titres"
              value={value.primary}
              onChange={(v) => set("primary", v)}
              disabled={!canEdit}
            />
            <ColorField
              id="brand-secondary"
              label="Couleur secondaire"
              hint="Éléments mis en avant"
              value={value.secondary}
              onChange={(v) => set("secondary", v)}
              disabled={!canEdit}
            />
            <ColorField
              id="brand-accent"
              label="Couleur d'accent"
              hint="Boutons et liens"
              value={value.accent}
              onChange={(v) => set("accent", v)}
              disabled={!canEdit}
            />
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() =>
                setValue((p) => ({
                  ...p,
                  primary: DEFAULT_BRANDING.primary,
                  secondary: DEFAULT_BRANDING.secondary,
                  accent: DEFAULT_BRANDING.accent,
                }))
              }
              className="text-brand mt-3 flex items-center gap-1.5 text-xs font-semibold hover:underline"
            >
              <RotateCcw className="size-3.5" aria-hidden /> Revenir aux couleurs SkillPass
            </button>
          )}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-navy flex items-center gap-2 text-sm font-semibold">
                Favicon <SoonBadge />
              </p>
              <p className="text-muted text-xs">Format : ICO, PNG. Taille : 32x32 ou 16x16 px.</p>
            </div>
            <fieldset>
              <legend className="text-sm font-semibold">Thème d&apos;interface</legend>
              <div className="mt-2 space-y-1.5 text-sm">
                <label className="flex items-center gap-2">
                  <input type="radio" checked readOnly className="accent-brand size-4" /> Clair
                </label>
                <label className="text-muted flex items-center gap-2">
                  <input type="radio" disabled className="size-4" /> Sombre <SoonBadge />
                </label>
                <label className="text-muted flex items-center gap-2">
                  <input type="radio" disabled className="size-4" /> Système <SoonBadge />
                </label>
              </div>
            </fieldset>
          </div>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-navy text-lg font-bold">Personnalisation de l&apos;expérience</h2>
          <p className="text-muted text-sm">Adaptez certains textes et éléments à votre contexte.</p>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="brand-welcome" className="text-sm font-medium">
                Texte de bienvenue
              </label>
              <div className="relative">
                <textarea
                  id="brand-welcome"
                  rows={2}
                  maxLength={MAX_WELCOME}
                  value={value.welcomeText}
                  disabled={!canEdit}
                  onChange={(e) => set("welcomeText", e.target.value)}
                  className="border-border focus-visible:ring-brand/40 w-full resize-none rounded-xl border bg-white px-3 py-2.5 pb-6 text-sm outline-none focus-visible:ring-2 disabled:bg-slate-50"
                />
                <span className="text-muted absolute right-3 bottom-1.5 text-xs">
                  {value.welcomeText.length}/{MAX_WELCOME}
                </span>
              </div>
              <p className="text-muted text-[11px]">
                Affiché sous le nom de l&apos;organisation sur le tableau de bord.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {["Nom affiché de la plateforme", "Lien de support"].map((label) => (
                <div key={label} className="space-y-1.5">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {label} <SoonBadge />
                  </p>
                  <input disabled aria-label={label} className={field} />
                </div>
              ))}
            </div>
            <p className="text-muted text-xs">
              Le message de la page de connexion et la personnalisation des e-mails arriveront avec
              l&apos;envoi des e-mails.
            </p>
          </div>
        </Panel>

        {error && (
          <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            Personnalisation enregistrée.
          </p>
        )}
      </div>

      <aside className="space-y-6">
        <Panel className="p-5">
          <h2 className="text-navy font-bold">Aperçu</h2>
          <p className="text-muted text-sm">Découvrez un aperçu de votre marque sur l&apos;interface.</p>
          <div className="border-border/70 mt-4 overflow-hidden rounded-xl border">
            <div
              className="flex items-center gap-3 px-3 py-2.5 text-white"
              style={{ background: value.primary }}
            >
              {value.showLogo && (
                <span className="flex size-7 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                  {organizationName.slice(0, 2).toUpperCase()}
                </span>
              )}
              {value.showName && <span className="truncate text-xs font-semibold">{organizationName}</span>}
              <span className="ml-auto h-1.5 w-8 rounded-full" style={{ background: value.secondary }} />
            </div>
            <div className="space-y-3 p-4">
              <p className="text-sm font-bold" style={{ color: value.primary }}>
                Trouvez les bons talents
              </p>
              <p className="text-muted text-xs">{value.welcomeText || "—"}</p>
              <span
                className="inline-block rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                style={{ background: value.accent }}
              >
                Publier une offre
              </span>
              <span
                className="ml-2 inline-block rounded-lg px-3 py-1.5 text-xs font-semibold"
                style={{ background: value.secondary, color: value.primary }}
              >
                En avant
              </span>
            </div>
          </div>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-navy font-bold">Éléments d&apos;interface</h2>
          <p className="text-muted text-sm">Choisissez les éléments à afficher pour vos utilisateurs.</p>
          <div className="mt-2 divide-y divide-slate-100">
            <SettingRow icon={ImageIcon} title="Afficher le logo" text="Dans la barre de navigation">
              <Switch
                checked={value.showLogo}
                onChange={(on) => set("showLogo", on)}
                label="Afficher le logo dans la barre de navigation"
                disabled={!canEdit}
              />
            </SettingRow>
            <SettingRow
              icon={Building2}
              title="Afficher le nom de l'organisation"
              text="Dans la barre de navigation"
            >
              <Switch
                checked={value.showName}
                onChange={(on) => set("showName", on)}
                label="Afficher le nom de l'organisation"
                disabled={!canEdit}
              />
            </SettingRow>
            <SettingRow icon={LayoutPanelTop} title="Image de couverture" text="Sur le tableau de bord">
              <Switch
                checked={value.showCover}
                onChange={(on) => set("showCover", on)}
                label="Afficher l'image de couverture sur le tableau de bord"
                disabled={!canEdit}
              />
            </SettingRow>
            <SettingRow icon={Palette} title="Couleurs des graphiques" text="Suivre vos couleurs" soon>
              <Switch checked={false} label="Personnaliser les couleurs des graphiques" disabled />
            </SettingRow>
            <SettingRow icon={Type} title="Nom de la plateforme" text="Remplacer « SkillPass Business »" soon>
              <Switch checked={false} label="Nom de la plateforme" disabled />
            </SettingRow>
          </div>
        </Panel>

        <div className="rounded-2xl bg-blue-50 p-5 text-sm">
          <p className="text-brand font-bold">Bon à savoir</p>
          <p className="text-muted mt-1">
            Une identité visuelle cohérente renforce la confiance de vos utilisateurs et améliore
            l&apos;adoption de la plateforme.
          </p>
        </div>
      </aside>
    </div>
  );
}
