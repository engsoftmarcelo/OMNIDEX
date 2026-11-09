import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/space-grotesk/latin-500.css";
import "@fontsource/space-grotesk/latin-600.css";
import "@fontsource/space-grotesk/latin-700.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import App from "./App.jsx";
import "./css/base.css";
import "./css/catalog.css";
import "./css/details.css";
import "./css/wow.css";
import "./css/themes.css";
import "./css/omnitrix.css";
import "./css/comic.css";
import "./css/intro.css";
import "./css/universe.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
