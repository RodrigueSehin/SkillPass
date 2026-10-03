import Image from "next/image";
import Link from "next/link";
import { BarChart3, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { AUTH_NAV_LINKS, AUTH_STATS } from "@/config/marketing";
import logoOnDark from "@/assets/auth/logo-on-dark.png";
import officePhoto from "@/assets/auth/login-office.png";
import { CountUp } from "@/components/marketing/count-up";
import { cn } from "@/lib/utils/cn";

const BENEFITS = [
  {
    icon: UserRound,
    tile: "bg-orange-500/90",
    title: "Recrutez plus vite",
    text: "Trouvez des talents qualifiés et vérifiés sur la base de compétences réelles.",
  },
  {
    icon: ShieldCheck,
    tile: "bg-blue-600",
    title: "Réduisez les risques",
    text: "Accédez à des preuves vérifiables : certifications, projets, évaluations, expériences.",
  },
  {
    icon: BarChart3,
    tile: "bg-amber-600/90",
    title: "Prenez de meilleures décisions",
    text: "Des données fiables pour un recrutement plus objectif et plus juste.",
  },
  {
    icon: UsersRound,
    tile: "bg-indigo-600",
    title: "Construisez des équipes d'exception",
    text: "Attirez, évaluez et développez les meilleurs talents.",
  },
] as const;

/** Left, dark half of the sign-in pages (desktop). Phones get the compact banner below. */
export function AuthShowcase() {
  return (
    <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#08173d] via-[#0b2459] to-[#0f3a85] text-white lg:flex lg:flex-col">
      {/* Photo, shown as in the mockup: bottom right, melting into the blue. */}
      <div aria-hidden className="absolute right-0 bottom-0 h-[72%] w-[78%]">
        <Image
          src={officePhoto}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 0px"
          className="object-cover object-[60%_30%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b2459] via-[#0b2459]/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-[#0a1f4f]" />
        <div className="absolute inset-0 bg-[#0f3a85]/20 mix-blend-multiply" />
      </div>

      {/* Faint words behind the photo */}
      <ul
        aria-hidden
        className="pointer-events-none absolute top-[29%] right-[4%] -rotate-12 space-y-1 text-lg font-semibold tracking-widest text-white/15 uppercase select-none"
      >
        {["Talent", "Compétences", "Confiance", "Opportunités"].map((word, i) => (
          <li key={word} style={{ marginLeft: `${i * 0.6}rem` }}>
            {word}
          </li>
        ))}
      </ul>

      <div className="relative z-10 flex flex-1 flex-col px-10 pt-7 pb-6 xl:px-14">
        <div className="flex items-start justify-between gap-6">
          <Link href="/" aria-label="SkillPass — accueil">
            <Image
              src={logoOnDark}
              alt="SkillPass, le passeport numérique de vos compétences"
              priority
              className="h-20 w-auto xl:h-[5.5rem]"
            />
          </Link>
          <nav
            aria-label="Navigation du site"
            className="mt-3 hidden items-center gap-7 text-sm font-medium xl:flex"
          >
            {AUTH_NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-white/90 hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-9 max-w-[50rem] xl:mt-10">
          <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight xl:text-[3.4rem]">
            Des talents vérifiés.
            <span className="block text-orange-400">Des équipes performantes.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-blue-50/90 xl:text-lg">
            SkillPass connecte les talents, les entreprises et les organismes de formation autour d&apos;une
            même mission : valoriser les compétences réelles.
          </p>

          <ul className="mt-6 space-y-4 xl:mt-7">
            {BENEFITS.map(({ icon: Icon, tile, title, text }) => (
              <li key={title} className="flex max-w-md items-start gap-4">
                <span
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-xl shadow-lg",
                    tile,
                  )}
                >
                  <Icon className="size-6" aria-hidden />
                </span>
                <div>
                  <h2 className="font-bold">{title}</h2>
                  <p className="text-sm leading-snug text-blue-100/90">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto pt-6">
          <p
            className="mb-4 max-w-md -rotate-3 text-2xl leading-tight text-white xl:text-3xl"
            style={{ fontFamily: "var(--font-script), cursive" }}
          >
            Les compétences d&apos;aujourd&apos;hui pour les opportunités de demain.
            <svg viewBox="0 0 280 12" className="mt-1 w-64 text-orange-400" fill="none" aria-hidden>
              <path d="M2 9C60 2 180 2 278 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </p>

          <dl className="grid max-w-2xl grid-cols-4 divide-x divide-white/15 rounded-xl bg-[#0a1b45]/85 py-4 backdrop-blur">
            {AUTH_STATS.map((stat) => (
              <div key={stat.label} className="px-3 text-center">
                <dd className="text-xl font-bold">
                  <CountUp value={stat.value} />
                </dd>
                <dt className="mt-0.5 text-xs text-blue-100/80">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div
        aria-hidden
        className="absolute right-0 bottom-28 z-10 w-36 rounded-l-xl bg-[#0a1b45]/95 py-5 pr-4 pl-5 shadow-lg"
      >
        <p className="text-base leading-snug font-semibold">
          Build
          <br />a better
          <br />
          tomorrow
        </p>
        <span className="mt-3 block h-1 w-10 rounded-full bg-orange-400" />
      </div>
    </aside>
  );
}

/** Compact version for phones and tablets, above the form. */
export function AuthBanner() {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-[#08173d] via-[#0b2459] to-[#0f3a85] px-5 pt-6 pb-8 text-white lg:hidden">
      <Link href="/" aria-label="SkillPass — accueil" className="inline-block">
        <Image src={logoOnDark} alt="SkillPass" priority className="h-16 w-auto" />
      </Link>
      <p className="mt-5 text-3xl leading-tight font-extrabold tracking-tight">
        Des talents vérifiés.
        <span className="block text-orange-400">Des équipes performantes.</span>
      </p>
      <p className="mt-3 max-w-md text-sm text-blue-100/90">
        Connectez les talents, les entreprises et les organismes de formation autour des compétences réelles.
      </p>
    </header>
  );
}
