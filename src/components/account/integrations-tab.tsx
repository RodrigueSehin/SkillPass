import { Award, Briefcase, CalendarDays, Code2, Link2, Mail, Plug, type LucideIcon } from "lucide-react";
import { SoonBadge } from "@/components/business/settings/rows";
import { Panel } from "@/components/business/ui";

const GROUPS: { title: string; items: { name: string; text: string; icon: LucideIcon }[] }[] = [
  {
    title: "Importer mon profil",
    items: [
      { name: "LinkedIn", text: "Importez votre parcours et vos expériences.", icon: Briefcase },
      { name: "GitHub", text: "Ajoutez vos dépôts comme projets et preuves.", icon: Code2 },
    ],
  },
  {
    title: "Certifications",
    items: [
      { name: "Microsoft Learn", text: "Récupérez vos certifications Microsoft.", icon: Award },
      { name: "Credly", text: "Importez vos badges numériques.", icon: Award },
    ],
  },
  {
    title: "Calendrier et messagerie",
    items: [
      { name: "Google Agenda", text: "Ajoutez les dates limites de vos offres.", icon: CalendarDays },
      { name: "Outlook", text: "Recevez les rappels dans votre messagerie.", icon: Mail },
    ],
  },
];

/** Nothing here connects yet: each card is shown disabled and marked "Bientôt". */
export function IntegrationsTab() {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        <Panel className="flex items-start gap-4 bg-blue-50/60 p-5">
          <Plug className="text-brand mt-0.5 size-8 shrink-0" aria-hidden />
          <div>
            <h2 className="text-brand text-lg font-bold">Connectez vos outils préférés</h2>
            <p className="text-navy/80 text-sm">
              Les connexions arrivent bientôt. Elles permettront d&apos;importer votre parcours et vos
              certifications sans tout ressaisir.
            </p>
          </div>
        </Panel>

        {GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="text-navy mb-3 font-bold">{group.title}</h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {group.items.map(({ name, text, icon: Icon }) => (
                <li key={name}>
                  <Panel className="flex h-full flex-col p-5">
                    <div className="flex items-center gap-3">
                      <span className="text-brand flex size-10 items-center justify-center rounded-xl bg-blue-50">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <div>
                        <p className="text-navy font-bold">{name}</p>
                        <SoonBadge />
                      </div>
                    </div>
                    <p className="text-muted mt-3 flex-1 text-sm">{text}</p>
                    <button
                      type="button"
                      disabled
                      className="border-brand/40 text-brand mt-4 flex h-10 items-center justify-center gap-2 rounded-xl border bg-white text-sm font-semibold opacity-50"
                    >
                      <Link2 className="size-4" aria-hidden /> Connecter
                    </button>
                  </Panel>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <aside className="space-y-6">
        <Panel className="p-5">
          <h2 className="text-navy flex items-center gap-2 font-bold">
            Clés API <SoonBadge />
          </h2>
          <p className="text-muted mt-1 text-sm">
            Accédez à vos données SkillPass depuis vos propres outils.
          </p>
          <button
            type="button"
            disabled
            className="border-brand/40 text-brand mt-4 h-10 w-full rounded-xl border bg-white text-sm font-semibold opacity-50"
          >
            Gérer mes clés API
          </button>
        </Panel>
      </aside>
    </div>
  );
}
