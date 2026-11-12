import { Component, type ErrorInfo, type ReactNode } from "react";
import type { Language } from "@/domain/types";
import { translate } from "@/presentation/i18n/i18n";

interface Props {
  language: Language;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Rete di sicurezza: se un componente si rompe, al posto di una finestra vuota
 * compare un messaggio con "Riprova". I dati sono già salvati nel database.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Nessun dato del calendario nei log: solo il messaggio e la posizione nel codice.
    console.error("NekoCalendar: errore dell'interfaccia", error.message, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const { language } = this.props;
    return (
      <main className="splash">
        <div role="alert" className="splash-error">
          <p>{translate(language, "app.loadError", { error: this.state.error.message })}</p>
          <button
            type="button"
            className="primary-btn"
            onClick={() => this.setState({ error: null })}
          >
            {translate(language, "app.retry")}
          </button>
        </div>
      </main>
    );
  }
}
