import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { open } from "@tauri-apps/plugin-shell";
import App from "./App";
import "./globals.css";

// Open external links (http/https) in system browser
document.addEventListener("click", (e) => {
  const anchor = (e.target as HTMLElement).closest("a");
  if (!anchor) return;

  const href = anchor.getAttribute("href");
  if (href?.startsWith("http://") || href?.startsWith("https://")) {
    e.preventDefault();
    open(href);
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
