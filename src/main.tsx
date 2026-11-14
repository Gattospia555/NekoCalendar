import React from "react";
import ReactDOM from "react-dom/client";
// Plus Jakarta Sans, lo stesso font di NekoTune (famiglia Neko), incluso nell'app.
import "@fontsource-variable/plus-jakarta-sans";
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
