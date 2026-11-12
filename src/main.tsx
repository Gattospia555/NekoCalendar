import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/fraunces";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "./theme/tokens.css";
import "./theme/base.css";
import { LabApp } from "./app/LabApp";
import { CountdownWidget } from "./widget/CountdownWidget";
import { currentWindowLabel } from "./platform/widgetWindow";

// Ogni finestra Tauri carica la stessa pagina: l'etichetta decide cosa mostrare.
// Fuori da Tauri (anteprima nel browser) si può forzare il widget con ?view=widget.
const label = currentWindowLabel();
const isWidget =
  label?.startsWith("widget-") ??
  new URLSearchParams(window.location.search).get("view") === "widget";

document.documentElement.dataset.view = isWidget ? "widget" : "app";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>{isWidget ? <CountdownWidget /> : <LabApp />}</React.StrictMode>,
);
