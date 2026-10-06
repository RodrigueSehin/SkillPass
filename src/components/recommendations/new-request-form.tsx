"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  Eye,
  FileText,
  Mail,
  Search,
  Send,
  Trash2,
  UserRound,
  UserRoundCheck,
} from "lucide-react";
import { requestRecommendationAction } from "@/app/dashboard/recommendations/actions";
import { addContactAction, deleteContactAction } from "@/app/dashboard/recommendations/contact-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { initialsOf } from "@/lib/recommendation-view";
import { cn } from "@/lib/utils/cn";
import { REQUEST_ASPECTS, REQUEST_ASPECT_LABELS } from "@/schemas/verification";
import { NetworkMakesTheDifference, RequestQuote, RequestTips } from "./request-form-side";

export interface Contact {
  /** Set for address-book entries: it allows deleting them. */
  id?: string;
  name: string;
  email: string | null;
  /** Job title ("IT Manager"). */
  title: string | null;
  company: string | null;
}

const contactLine = (c: Pick<Contact, "title" | "company">) =>
  [c.title, c.company].filter(Boolean).join(" • ");

const MAX_MESSAGE = 1000;
const DEFAULT_SUBJECT = "Demande de recommandation sur SkillPass";
const RECENT_SHOWN = 4;

const DEFAULT_MESSAGE = `Bonjour [Nom],

J'espère que vous allez bien.

Je travaille actuellement sur mon profil SkillPass afin de mettre en valeur mes compétences et mon parcours professionnel. Votre retour d'expérience serait extrêmement précieux pour moi.

Accepteriez-vous de rédiger une recommandation sur mon profil ? Cela ne vous prendra que quelques minutes.

Merci beaucoup pour votre soutien !

Cordialement,
[Signature]`;

const TEMPLATES = [
  {
    title: "Modèle pour un ancien manager",
    text: `Bonjour [Nom],

J'ai eu le plaisir de travailler avec vous pendant [durée] chez [entreprise]. Votre regard sur mon travail compte beaucoup pour moi.

Seriez-vous d'accord pour rédiger une recommandation sur mon profil SkillPass ? Quelques lignes sur mes missions et mon impact suffiraient.

Merci d'avance,
[Signature]`,
  },
  {
    title: "Modèle pour un collègue",
    text: `Salut [Nom],

Nous avons collaboré sur plusieurs projets et j'ai beaucoup apprécié travailler avec toi.

Serais-tu d'accord pour écrire une courte recommandation sur mon profil SkillPass ? Ça m'aiderait beaucoup.

Merci !
[Signature]`,
  },
  {
    title: "Modèle pour un client",
    text: `Bonjour [Nom],

Merci encore pour votre confiance sur le projet [nom du projet]. Votre témoignage aurait beaucoup de valeur pour mon profil professionnel.

Pourriez-vous partager votre expérience de notre collaboration en quelques lignes sur mon profil SkillPass ?

Avec mes remerciements,
[Signature]`,
  },
];

const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? "";
const fill = (template: string, name: string, signature: string) =>
  template.replace(/\[Nom\]/g, firstName(name) || "[Nom]").replace(/\[Signature\]/g, signature);

const TABS = [
  ["search", "Rechercher un contact"],
  ["book", "Mes contacts"],
  ["recent", "Contacts récents"],
  ["manual", "Saisir manuellement"],
] as const;
type Tab = (typeof TABS)[number][0];

const inputClass =
  "border-border focus-visible:ring-brand/40 h-11 w-full rounded-xl border bg-white px-4 text-sm outline-none focus-visible:ring-2";
const cardClass = "border-border/60 shadow-soft rounded-2xl border bg-white p-6";

function SectionTitle({ icon: Icon, children }: { icon: typeof FileText; children: React.ReactNode }) {
  return (
    <h2 className="text-navy flex items-center gap-3 text-lg font-bold">
      <span className="bg-brand flex size-9 items-center justify-center rounded-lg text-white">
        <Icon className="size-5" aria-hidden />
      </span>
      {children}
    </h2>
  );
}

function CopyButton({ text, label, className }: { text: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Copiez ce texte :", text);
        }
      }}
      className={cn("text-brand rounded-md p-1.5 hover:bg-blue-50", className)}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
    </button>
  );
}

interface Props {
  /** The address book. */
  addressBook: Contact[];
  /** People already asked, most recent first. */
  contacts: Contact[];
  /** Signs the default message. */
  holderName: string;
  holderSlug: string;
  appOrigin: string;
}

export function NewRequestForm({ addressBook, contacts, holderName, holderSlug, appOrigin }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("search");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Contact | null>(null);
  const [manual, setManual] = useState({ name: "", email: "", title: "", company: "" });
  const [saveToBook, setSaveToBook] = useState(true);
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [template, setTemplate] = useState(DEFAULT_MESSAGE);
  /** Set as soon as the user types in the message: it then stops following the recipient's name. */
  const [custom, setCustom] = useState<string | null>(null);
  const [aspects, setAspects] = useState<string[]>(["TECHNICAL", "PROFESSIONAL"]);
  const [includeLink, setIncludeLink] = useState(true);
  const [error, setError] = useState<string>();
  const [link, setLink] = useState<string>();
  const [preview, setPreview] = useState(false);
  const [pending, startTransition] = useTransition();

  const person: Contact | null =
    tab === "manual"
      ? {
          name: manual.name.trim(),
          email: manual.email.trim() || null,
          title: manual.title.trim() || null,
          company: manual.company.trim() || null,
        }
      : selected;
  const message = custom ?? fill(template, person?.name ?? "", holderName);
  const profileLink = `${appOrigin}/${holderSlug}`;

  const q = query.trim().toLowerCase();
  // Searching covers the address book first, then people already asked (without duplicates).
  const everyone = [
    ...addressBook,
    ...contacts.filter((c) => !addressBook.some((b) => b.name.toLowerCase() === c.name.toLowerCase())),
  ];
  const visible =
    tab === "recent"
      ? contacts.slice(0, RECENT_SHOWN)
      : tab === "book"
        ? addressBook
        : everyone.filter(
            (c) => !q || [c.name, c.title, c.company, c.email].some((t) => t?.toLowerCase().includes(q)),
          );

  const toggleAspect = (a: string) =>
    setAspects((list) => (list.includes(a) ? list.filter((x) => x !== a) : [...list, a]));

  function submit() {
    setError(undefined);
    if (!person || person.name.length < 2)
      return setError("Choisissez ou saisissez la personne à solliciter");
    if (!subject.trim()) return setError("Indiquez le sujet de la demande");
    if (!message.trim()) return setError("Écrivez un message");
    if (message.length > MAX_MESSAGE)
      return setError(`Message trop long (${MAX_MESSAGE} caractères maximum)`);
    startTransition(async () => {
      // A person typed by hand can join the address book for next time; a failure here must not block the request.
      if (tab === "manual" && saveToBook) {
        await addContactAction({
          name: person.name,
          email: person.email ?? "",
          title: person.title ?? "",
          company: person.company ?? "",
        });
      }
      const result = await requestRecommendationAction({
        authorName: person.name,
        authorEmail: person.email ?? "",
        authorTitle: contactLine(person),
        subject,
        message,
        aspects,
      });
      if (result.error) setError(result.error);
      else setLink(result.link);
    });
  }

  function reset() {
    setLink(undefined);
    setSelected(null);
    setManual({ name: "", email: "", title: "", company: "" });
    setCustom(null);
    setTemplate(DEFAULT_MESSAGE);
  }

  const fullMessage = includeLink && link ? `${message}\n\n${link}` : message;

  if (link) {
    return (
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-label="Demande créée" className={cn(cardClass, "space-y-5")}>
          <div role="status" className="flex items-start gap-3">
            <span className="bg-success/10 text-success flex size-10 shrink-0 items-center justify-center rounded-full">
              <UserRoundCheck className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-navy text-lg font-bold">Demande créée pour {person?.name}</h2>
              <p className="text-muted mt-1 text-sm">
                SkillPass n&apos;envoie pas de message : copiez le texte ci-dessous et envoyez-le par e-mail
                ou messagerie. Le lien est personnel, valable 30 jours et ne peut être utilisé qu&apos;une
                fois.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="created-link">Lien à envoyer</Label>
            <div className="flex items-center gap-2">
              <input
                id="created-link"
                readOnly
                value={link}
                aria-label="Lien à envoyer"
                onFocus={(e) => e.currentTarget.select()}
                className={cn(inputClass, "font-mono text-xs")}
              />
              <CopyButton text={link} label="Copier le lien" className="border-border border" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Message prêt à envoyer</p>
            <pre className="border-border max-h-72 overflow-auto rounded-xl border bg-slate-50 p-4 text-sm whitespace-pre-wrap">
              {fullMessage}
            </pre>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(fullMessage);
                } catch {
                  window.prompt("Copiez ce message :", fullMessage);
                }
              }}
            >
              <Copy /> Copier le message
            </Button>
            <Button variant="outline" onClick={reset}>
              Faire une autre demande
            </Button>
            <Link href="/dashboard/recommendations" className={buttonVariants({ variant: "outline" })}>
              Retour aux recommandations
            </Link>
          </div>
        </section>
        <aside className="grid gap-6">
          <RequestTips />
          <NetworkMakesTheDifference />
        </aside>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <section aria-label="Choisir la personne" className={cn(cardClass, "space-y-4")}>
            <SectionTitle icon={UserRound}>1. Choisir la personne</SectionTitle>
            <div role="tablist" aria-label="Source du contact" className="flex flex-wrap gap-2">
              {TABS.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={cn(
                    "h-9 rounded-lg px-3 text-xs font-semibold",
                    tab === key ? "bg-brand text-white" : "text-brand bg-blue-50 hover:bg-blue-100",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "manual" ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="manual-name">
                    Nom du recommandeur <span className="text-danger">*</span>
                  </Label>
                  <input
                    id="manual-name"
                    value={manual.name}
                    onChange={(e) => setManual((m) => ({ ...m, name: e.target.value }))}
                    placeholder="Ex : Jean-Marc Kouakou"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-email">E-mail (optionnel)</Label>
                  <input
                    id="manual-email"
                    type="email"
                    value={manual.email}
                    onChange={(e) => setManual((m) => ({ ...m, email: e.target.value }))}
                    placeholder="nom@entreprise.com"
                    className={inputClass}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="manual-title">Fonction (optionnel)</Label>
                    <input
                      id="manual-title"
                      value={manual.title}
                      onChange={(e) => setManual((m) => ({ ...m, title: e.target.value }))}
                      placeholder="Ex : IT Manager"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manual-company">Entreprise (optionnel)</Label>
                    <input
                      id="manual-company"
                      value={manual.company}
                      onChange={(e) => setManual((m) => ({ ...m, company: e.target.value }))}
                      placeholder="Ex : SEHIN GROUP"
                      className={inputClass}
                    />
                  </div>
                </div>
                <label className="text-navy flex cursor-pointer items-center gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={saveToBook}
                    onChange={(e) => setSaveToBook(e.target.checked)}
                    className="accent-brand size-4"
                  />
                  Enregistrer dans mes contacts
                </label>
              </div>
            ) : (
              <>
                {tab === "search" && (
                  <div className="relative">
                    <Search
                      className="text-muted pointer-events-none absolute top-3.5 left-3.5 size-4"
                      aria-hidden
                    />
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      aria-label="Rechercher un contact"
                      placeholder="Rechercher par nom, entreprise, poste…"
                      className={cn(inputClass, "pl-10")}
                    />
                  </div>
                )}
                {visible.length === 0 ? (
                  <p className="text-muted rounded-xl bg-slate-50 px-4 py-6 text-center text-sm">
                    {tab === "book"
                      ? "Votre carnet d'adresses est vide. Utilisez « Saisir manuellement » et cochez « Enregistrer dans mes contacts »."
                      : tab === "recent" || everyone.length === 0
                        ? "Aucun contact pour l'instant : les personnes que vous sollicitez apparaîtront ici. Utilisez « Saisir manuellement »."
                        : "Aucun contact ne correspond à votre recherche."}
                  </p>
                ) : (
                  <ul className="divide-border divide-y">
                    {visible.map((c) => {
                      const on =
                        selected?.name === c.name && selected.email === c.email && selected.id === c.id;
                      return (
                        <li key={`${c.name}|${c.email}`} className="flex items-center gap-3 py-3">
                          <span
                            aria-hidden
                            className="bg-brand flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                          >
                            {initialsOf(c.name)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-navy truncate font-semibold">{c.name}</p>
                            {contactLine(c) && (
                              <p className="text-muted truncate text-xs">{contactLine(c)}</p>
                            )}
                          </div>
                          {tab === "book" && c.id && (
                            <button
                              type="button"
                              aria-label={`Supprimer ${c.name} de mes contacts`}
                              onClick={() =>
                                startTransition(async () => {
                                  if (selected?.id === c.id) setSelected(null);
                                  await deleteContactAction(c.id!);
                                  router.refresh();
                                })
                              }
                              className="text-muted hover:text-danger rounded-md p-1.5"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant={on ? "primary" : "outline"}
                            aria-pressed={on}
                            onClick={() => setSelected(on ? null : c)}
                          >
                            {on ? <Check /> : null} {on ? "Sélectionné" : "Sélectionner"}
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {tab === "recent" && contacts.length > RECENT_SHOWN && (
                  <button
                    type="button"
                    onClick={() => setTab("search")}
                    className="text-brand ml-auto flex items-center gap-1.5 text-sm font-semibold hover:underline"
                  >
                    Voir plus de contacts <ArrowRight className="size-4" aria-hidden />
                  </button>
                )}
              </>
            )}
          </section>

          <section aria-label="Type de recommandation" className={cn(cardClass, "space-y-3")}>
            <SectionTitle icon={FileText}>3. Quel type de recommandation ?</SectionTitle>
            <p className="text-muted text-sm">
              Vous pouvez suggérer les aspects sur lesquels la personne peut se concentrer.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {REQUEST_ASPECTS.map((a) => {
                const on = aspects.includes(a);
                return (
                  <label
                    key={a}
                    className={cn(
                      "focus-within:ring-brand/40 flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-3 text-sm focus-within:ring-2",
                      on ? "border-brand text-brand bg-blue-50 font-medium" : "border-border text-navy",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleAspect(a)}
                      className="accent-brand size-4"
                    />
                    {REQUEST_ASPECT_LABELS[a]}
                  </label>
                );
              })}
            </div>
          </section>
        </div>

        <section aria-label="Personnaliser votre demande" className={cn(cardClass, "space-y-4")}>
          <SectionTitle icon={Mail}>2. Personnaliser votre demande</SectionTitle>
          <div className="space-y-2">
            <Label htmlFor="request-subject">
              Sujet de la demande <span className="text-danger">*</span>
            </Label>
            <input
              id="request-subject"
              value={subject}
              maxLength={120}
              onChange={(e) => setSubject(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="request-message">
              Message personnalisé <span className="text-danger">*</span>
            </Label>
            <div className="relative">
              <textarea
                id="request-message"
                rows={14}
                value={message}
                onChange={(e) => setCustom(e.target.value)}
                aria-invalid={message.length > MAX_MESSAGE}
                className="border-border focus-visible:ring-brand/40 aria-[invalid=true]:border-danger w-full resize-y rounded-xl border bg-white px-4 py-3 pb-8 text-sm outline-none focus-visible:ring-2"
              />
              <span
                className={cn(
                  "absolute right-3 bottom-2 text-xs",
                  message.length > MAX_MESSAGE ? "text-danger" : "text-muted",
                )}
              >
                {message.length}/{MAX_MESSAGE}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <label className="text-navy flex cursor-pointer items-center gap-2.5 text-sm font-medium">
              <input
                type="checkbox"
                checked={includeLink}
                onChange={(e) => setIncludeLink(e.target.checked)}
                className="accent-brand size-4"
              />
              Ajouter le lien de la demande au message à copier
            </label>
            <p className="text-muted mt-1 pl-6 text-xs">
              Le lien personnel est généré à la création de la demande. Votre profil public :{" "}
              <span className="font-mono">{profileLink}</span>
            </p>
          </div>

          {error && (
            <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
              {error}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setPreview(true)}>
              <Eye /> Aperçu
            </Button>
            <Button type="button" onClick={submit} disabled={pending}>
              <Send /> {pending ? "Création…" : "Créer la demande"}
            </Button>
          </div>
        </section>
      </div>

      <aside className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-1">
        <RequestTips />
        <RequestQuote />
        <section
          aria-labelledby="examples-title"
          className="border-border/60 shadow-soft rounded-2xl border bg-white p-5 md:col-span-2 xl:col-span-1"
        >
          <h2 id="examples-title" className="text-navy flex items-center gap-2 font-bold">
            <FileText className="text-brand size-5" aria-hidden /> Exemples de messages
          </h2>
          <ul className="mt-4 space-y-3">
            {TEMPLATES.map((t) => (
              <li key={t.title} className="border-border/60 rounded-xl border bg-slate-50/60 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-navy text-sm font-semibold">{t.title}</p>
                  <button
                    type="button"
                    aria-label={`Utiliser le ${t.title.toLowerCase()}`}
                    title="Utiliser ce modèle"
                    onClick={() => {
                      setTemplate(t.text);
                      setCustom(null);
                    }}
                    className="text-brand rounded-md p-1.5 hover:bg-blue-100"
                  >
                    <Copy className="size-4" />
                  </button>
                </div>
                <p className="text-muted mt-1 line-clamp-3 text-xs whitespace-pre-line">{t.text}</p>
              </li>
            ))}
          </ul>
        </section>
        <div className="md:col-span-2 xl:col-span-1">
          <NetworkMakesTheDifference />
        </div>
      </aside>

      <Modal open={preview} onClose={() => setPreview(false)} title="Aperçu de votre demande">
        <div className="space-y-3 text-sm">
          <p className="text-muted">Voici ce que {person?.name || "votre contact"} verra sur son lien :</p>
          <p className="text-navy text-lg font-bold">Recommander {holderName}</p>
          <blockquote className="border-brand/40 border-l-2 bg-blue-50/60 px-4 py-3 whitespace-pre-line">
            {message}
          </blockquote>
          {aspects.length > 0 && (
            <div>
              <p className="font-medium">Points à aborder</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {aspects.map((a) => (
                  <li key={a} className="text-brand rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium">
                    {(REQUEST_ASPECT_LABELS as Record<string, string>)[a]}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button onClick={() => setPreview(false)}>Fermer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
