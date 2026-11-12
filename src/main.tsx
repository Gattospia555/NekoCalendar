import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return <h1>NekoCalendar</h1>;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
