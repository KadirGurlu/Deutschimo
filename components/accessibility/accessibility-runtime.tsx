"use client";

import type { MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

function resolveMain() {
  return document.querySelector<HTMLElement>("main, [role='main']");
}

function routeAnnouncement(main: HTMLElement | null) {
  const heading = main?.querySelector<HTMLElement>("h1");
  const headingText = heading?.textContent?.trim();
  if (headingText) return `${headingText} sayfası açıldı.`;

  const title = document.title.split("|")[0]?.trim();
  return title ? `${title} sayfası açıldı.` : "Yeni sayfa açıldı.";
}

export function AccessibilityRuntime() {
  const pathname = usePathname();
  const firstRender = useRef(true);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const main = resolveMain();
    if (main) {
      if (!main.id) main.id = "main-content";
      if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
    }

    document
      .querySelectorAll<HTMLButtonElement>("button[title]:not([aria-label])")
      .forEach((button) => {
        if (!button.textContent?.trim() && button.title.trim()) {
          button.setAttribute("aria-label", button.title.trim());
        }
      });

    document
      .querySelectorAll<SVGElement>(
        "button svg:not([aria-label]):not([role]), a[href] svg:not([aria-label]):not([role])",
      )
      .forEach((icon) => icon.setAttribute("aria-hidden", "true"));

    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    // SPA route changes are announced without forcibly moving the user's focus.
    // The skip link remains available when a keyboard user wants to jump to main.
    setAnnouncement("");
    const timer = window.setTimeout(() => {
      setAnnouncement(routeAnnouncement(main));
    }, 40);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  function skipToMain(event: MouseEvent<HTMLAnchorElement>) {
    const main = resolveMain();
    if (!main) return;

    event.preventDefault();
    if (!main.id) main.id = "main-content";
    if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
    main.focus({ preventScroll: true });
    main.scrollIntoView({ block: "start", behavior: "auto" });
    window.history.replaceState(null, "", `#${main.id}`);
  }

  return (
    <>
      <a className="v45-skip-link" href="#main-content" onClick={skipToMain}>
        Ana içeriğe geç
      </a>
      <p
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-v46-10-route-announcer
      >
        {announcement}
      </p>
    </>
  );
}
