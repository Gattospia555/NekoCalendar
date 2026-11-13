import React from "react";
import ReactDOM from "react-dom/client";
// Fraunces con l'asse "SOFT" (lettere più morbide) e Nunito, tondo e accogliente.
import "@fontsource-variable/fraunces/soft.css";
import "@fontsource-variable/nunito";
import "@/presentation/theme/tokens.css";
import "@/presentation/theme/base.css";
import { App } from "@/presentation/app/App";
import { CountdownWidget } from "@/presentation/widget/CountdownWidget";
import { currentWindowLabel } from "@/infrastructure/tauri/widgetWindow";

// Ogni finestra Tauri carica la stessa pagina: l'etichetta decide cosa mostrare.
// Fuori da Tauri (anteprima nel browser) si può forzare il widget con ?view=widget.
const label = currentWindowLabel();
const isWidget =
  label?.startsWith("widget-") ??
  new URLSearchParams(window.location.search).get("view") === "widget";

document.documentElement.dataset.view = isWidget ? "widget" : "app";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>{isWidget ? <CountdownWidget /> : <App />}</React.StrictMode>,
);
