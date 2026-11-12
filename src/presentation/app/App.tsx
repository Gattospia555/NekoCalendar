import { useEffect, useState } from "react";
import { CalendarService, DEFAULT_CALENDARS } from "@/application/calendarService";
import { seedDemo } from "@/application/demo";
import type { CalendarStore, Snapshot } from "@/application/store";
import { systemTimeZone, todayIn } from "@/domain/datetime";
import type { Language } from "@/domain/types";
import { MemoryStore } from "@/infrastructure/storage/memoryStore";
import { isTauri } from "@/infrastructure/tauri/environment";
import { lightenWhenMinimized } from "@/infrastructure/tauri/memory";
import { translate } from "@/presentation/i18n/i18n";
import { CalendarApp } from "./CalendarApp";

type State =
  | { status: "loading" }
  | { status: "ready"; service: CalendarService; snapshot: Snapshot }
  | { status: "error"; message: string };

/** Lingua del sistema, usata solo prima che l'utente scelga nelle impostazioni. */
function systemLanguage(): Language {
  return navigator.language.toLowerCase().startsWith("it") ? "it" : "en";
}

async function openStore(): Promise<CalendarStore> {
  if (isTauri()) {
    const { SqliteStore } = await import("@/infrastructure/tauri/sqliteStore");
    return SqliteStore.open();
  }
  return new MemoryStore(); // anteprima nel browser: niente database, dati di esempio
}

/** Apre il database, prepara il servizio e (solo nel browser) aggiunge i dati di esempio. */
async function bootstrap(language: Language): Promise<State> {
  try {
    const timeZone = systemTimeZone();
    const names = Object.fromEntries(
      DEFAULT_CALENDARS.map(({ key }) => [key, translate(language, `calendars.${key}`)]),
    ) as Record<(typeof DEFAULT_CALENDARS)[number]["key"], string>;
    const store = await openStore();
    const { service, snapshot } = await CalendarService.start(store, { timeZone }, names);
    if (!isTauri()) await seedDemo(service, snapshot, todayIn(Date.now(), timeZone));
    return { status: "ready", service, snapshot: await service.load() };
  } catch (cause) {
    return { status: "error", message: cause instanceof Error ? cause.message : String(cause) };
  }
}

/** Avvio: mostra "Apro il calendario…", poi il calendario oppure l'errore con "Riprova". */
export function App() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const language = systemLanguage();

  // Ridotta a icona, la finestra usa meno RAM (misure M0: da 230 a 151 MB).
  useEffect(() => {
    let stop: () => void = () => undefined;
    let cancelled = false;
    void lightenWhenMinimized().then((unlisten) => {
      if (cancelled) unlisten();
      else stop = unlisten;
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void bootstrap(language).then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, [language, attempt]);

  if (state.status === "ready")
    return <CalendarApp service={state.service} snapshot={state.snapshot} />;
  return (
    <main className="splash" aria-busy={state.status === "loading"}>
      {state.status === "loading" ? (
        <p>{translate(language, "app.loading")}</p>
      ) : (
        <div role="alert" className="splash-error">
          <p>{translate(language, "app.loadError", { error: state.message })}</p>
          <button
            type="button"
            className="primary-btn"
            onClick={() => {
              setState({ status: "loading" });
              setAttempt((n) => n + 1);
            }}
          >
            {translate(language, "app.retry")}
          </button>
        </div>
      )}
    </main>
  );
}
