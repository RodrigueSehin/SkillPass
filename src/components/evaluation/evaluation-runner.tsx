"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Clock, Maximize, ShieldAlert } from "lucide-react";
import { submitEvaluationAction } from "@/app/e/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { AttemptResponse, PublicQuestion } from "@/types/evaluation";
import { QUESTION_TYPE_LABELS } from "@/types/evaluation";
import type { RunnerData } from "@/services/evaluation-attempt.service";

const clock = (ms: number) => {
  const s = Math.max(Math.ceil(ms / 1000), 0);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};
const isChoice = (q: PublicQuestion) =>
  q.type === "SINGLE" || q.type === "MULTIPLE" || q.type === "TRUE_FALSE";
const answered = (q: PublicQuestion, r: AttemptResponse | undefined) =>
  isChoice(q) ? (r?.choices?.length ?? 0) > 0 : Boolean(r?.text?.trim());

function QuestionBody({
  q,
  response,
  onChange,
}: {
  q: PublicQuestion;
  response: AttemptResponse | undefined;
  onChange: (r: AttemptResponse) => void;
}) {
  const multiple = q.type === "MULTIPLE";
  const chosen = response?.choices ?? [];
  return (
    <div>
      <p className="text-muted text-xs">
        {QUESTION_TYPE_LABELS[q.type].title} · {q.points} point{q.points > 1 ? "s" : ""}
        {multiple && " · plusieurs réponses possibles"}
      </p>
      <h2 className="text-navy mt-1 text-lg font-semibold whitespace-pre-line">{q.prompt}</h2>
      {isChoice(q) ? (
        <fieldset className="mt-4 space-y-2">
          <legend className="sr-only">{q.prompt}</legend>
          {q.options.map((o) => (
            <label
              key={o.index}
              className={cn(
                "focus-within:ring-brand/40 flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm focus-within:ring-2",
                chosen.includes(o.index) ? "border-brand bg-blue-50/60" : "border-border hover:bg-slate-50",
              )}
            >
              <input
                type={multiple ? "checkbox" : "radio"}
                name={`q-${q.id}`}
                checked={chosen.includes(o.index)}
                onChange={() =>
                  onChange({
                    choices: multiple
                      ? chosen.includes(o.index)
                        ? chosen.filter((c) => c !== o.index)
                        : [...chosen, o.index]
                      : [o.index],
                  })
                }
                className="accent-brand size-4"
              />
              {o.label}
            </label>
          ))}
        </fieldset>
      ) : (
        <textarea
          aria-label="Votre réponse"
          value={response?.text ?? ""}
          maxLength={5000}
          rows={q.type === "SHORT" ? 3 : 8}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder={
            q.type === "FILE_UPLOAD"
              ? "Le dépôt de fichier n'est pas encore disponible : décrivez ou collez ici votre réponse."
              : "Écrivez votre réponse…"
          }
          className="border-border focus-visible:ring-brand/40 mt-4 w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2"
        />
      )}
    </div>
  );
}

const subscribeResize = (onChange: () => void) => {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
};
const subscribeNothing = () => () => undefined;

/** Browser-only: the saved answers and the screen width are read on the client, never on the server. */
export function EvaluationRunner(props: { token: string; data: RunnerData }) {
  const mounted = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  return mounted ? <Runner {...props} /> : <p className="text-muted p-8 text-center text-sm">Chargement…</p>;
}

function Runner({ token, data }: { token: string; data: RunnerData }) {
  const router = useRouter();
  const { questions, settings } = data;
  const storageKey = `evaluation:${data.attemptId}`;
  const [responses, setResponses] = useState<Record<string, AttemptResponse>>(() => {
    // Answers survive an accidental refresh: they are only sent on submit.
    try {
      const raw = sessionStorage.getItem(storageKey);
      return raw ? { ...data.saved, ...JSON.parse(raw) } : data.saved;
    } catch {
      return data.saved;
    }
  });
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(!settings.fullscreen);
  const [now, setNow] = useState(() => Date.now());
  const [questionEndsAt, setQuestionEndsAt] = useState<number | null>(() =>
    settings.timePerQuestion !== null && !settings.fullscreen
      ? Date.now() + settings.timePerQuestion * 1000
      : null,
  );
  const width = useSyncExternalStore(
    subscribeResize,
    () => window.innerWidth,
    () => 1024,
  );
  const narrow = width < 768 && !settings.devices.mobile;
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const submitted = useRef(false);
  const remaining = Date.parse(data.endsAt) - now;
  const questionLeft = questionEndsAt === null ? null : Math.ceil((questionEndsAt - now) / 1000);
  const restartQuestionTimer = useCallback(
    () =>
      setQuestionEndsAt(
        settings.timePerQuestion === null ? null : Date.now() + settings.timePerQuestion * 1000,
      ),
    [settings.timePerQuestion],
  );

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(responses));
    } catch {
      /* storage unavailable */
    }
  }, [responses, storageKey]);

  const submit = useCallback(() => {
    if (submitted.current) return;
    submitted.current = true;
    startTransition(async () => {
      const result = await submitEvaluationAction(data.attemptId, responses);
      if (result.error) {
        submitted.current = false;
        setError(result.error);
        return;
      }
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        /* nothing to clear */
      }
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
      router.replace(`/e/${token}`);
    });
  }, [data.attemptId, responses, router, storageKey, token]);

  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [ready]);
  useEffect(() => {
    if (ready && remaining <= 0) submit();
  }, [remaining, ready, submit]);

  const oneByOne = settings.display === "ONE_BY_ONE";
  const last = index === questions.length - 1;
  const next = useCallback(() => {
    if (index < questions.length - 1) {
      setIndex((i) => i + 1);
      restartQuestionTimer();
    } else setConfirming(true);
  }, [index, questions.length, restartQuestionTimer]);

  // Per-question timer: when it runs out the test moves on.
  useEffect(() => {
    if (!ready || !oneByOne || questionEndsAt === null || confirming) return;
    const id = setTimeout(next, Math.max(questionEndsAt - Date.now(), 0));
    return () => clearTimeout(id);
  }, [ready, oneByOne, questionEndsAt, confirming, next]);

  const unanswered = useMemo(
    () => questions.filter((q) => !answered(q, responses[q.id])).length,
    [questions, responses],
  );
  const set = (id: string) => (r: AttemptResponse) => setResponses((prev) => ({ ...prev, [id]: r }));

  const guard = settings.limitCopyPaste
    ? {
        onCopy: (e: React.ClipboardEvent) => e.preventDefault(),
        onCut: (e: React.ClipboardEvent) => e.preventDefault(),
        onPaste: (e: React.ClipboardEvent) => e.preventDefault(),
        onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
      }
    : {};

  if (narrow) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <ShieldAlert className="mx-auto size-10 text-amber-500" aria-hidden />
        <h1 className="text-navy mt-3 text-lg font-bold">Appareil non autorisé</h1>
        <p className="text-muted mt-2 text-sm">
          Cette évaluation ne se passe pas sur mobile. Ouvrez-la sur un ordinateur ou une tablette.
        </p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <Maximize className="text-brand mx-auto size-10" aria-hidden />
        <h1 className="text-navy mt-3 text-lg font-bold">Évaluation en plein écran</h1>
        <p className="text-muted mt-2 text-sm">
          Pour limiter les distractions, le test s&apos;affiche en plein écran. Le temps ({clock(remaining)})
          continue de s&apos;écouler.
        </p>
        <Button
          className="mt-5"
          onClick={() => {
            void document.documentElement.requestFullscreen?.().catch(() => undefined);
            setReady(true);
            setNow(Date.now());
            restartQuestionTimer();
          }}
        >
          Continuer
        </Button>
      </div>
    );
  }

  return (
    <div {...guard} className={cn("mx-auto max-w-3xl px-4 py-6", settings.limitCopyPaste && "select-none")}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-navy font-bold">{data.title}</h1>
        <div className="flex items-center gap-4 text-sm">
          {oneByOne && settings.timePerQuestion !== null && questionLeft !== null && (
            <span className={cn("font-medium", questionLeft <= 10 ? "text-danger" : "text-muted")}>
              Question : {Math.max(questionLeft, 0)} s
            </span>
          )}
          <span
            role="timer"
            aria-label="Temps restant"
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold",
              remaining < 5 * 60_000 ? "bg-red-50 text-red-600" : "text-brand bg-blue-50",
            )}
          >
            <Clock className="size-4" aria-hidden /> {clock(remaining)}
          </span>
        </div>
      </div>

      {oneByOne ? (
        <>
          <p className="text-muted mb-2 text-xs">
            Question {index + 1} sur {questions.length}
          </p>
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-200" aria-hidden>
            <div
              className="bg-brand h-full rounded-full transition-all"
              style={{ width: `${((index + 1) / questions.length) * 100}%` }}
            />
          </div>
          <div className="border-border/70 shadow-soft rounded-2xl border bg-white p-6">
            <QuestionBody
              key={questions[index]!.id}
              q={questions[index]!}
              response={responses[questions[index]!.id]}
              onChange={set(questions[index]!.id)}
            />
          </div>
          <div className="mt-5 flex items-center justify-between">
            {settings.navigation === "FREE" ? (
              <Button
                variant="outline"
                disabled={index === 0}
                onClick={() => {
                  setIndex((i) => i - 1);
                  restartQuestionTimer();
                }}
              >
                <ChevronLeft /> Précédent
              </Button>
            ) : (
              <span />
            )}
            <Button onClick={next}>
              {last ? "Terminer" : "Suivant"} {!last && <ChevronRight />}
            </Button>
          </div>
        </>
      ) : (
        <>
          <ol className="space-y-5">
            {questions.map((q, i) => (
              <li key={q.id} className="border-border/70 shadow-soft rounded-2xl border bg-white p-6">
                <p className="text-brand mb-1 text-xs font-semibold">Question {i + 1}</p>
                <QuestionBody q={q} response={responses[q.id]} onChange={set(q.id)} />
              </li>
            ))}
          </ol>
          <div className="mt-5 text-right">
            <Button onClick={() => setConfirming(true)}>Terminer</Button>
          </div>
        </>
      )}

      {confirming && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="confirm-title" className="text-navy font-bold">
              Terminer l&apos;évaluation ?
            </h2>
            <p className="text-muted mt-2 text-sm">
              {unanswered > 0 ? `${unanswered} question${unanswered > 1 ? "s" : ""} sans réponse. ` : ""}
              Une fois envoyées, vos réponses ne peuvent plus être modifiées.
            </p>
            {error && (
              <p role="alert" className="text-danger mt-3 text-sm">
                {error}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirming(false)}>
                Continuer le test
              </Button>
              <Button disabled={pending} onClick={submit}>
                {pending ? "Envoi…" : "Envoyer mes réponses"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
