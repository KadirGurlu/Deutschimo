"use client";

import type { MouseEvent } from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

function resolveMain() {
  return document.querySelector<HTMLElement>("main, [role='main']");
}

export function AccessibilityRuntime() {
  const pathname = usePathname();

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
    <a className="v45-skip-link" href="#main-content" onClick={skipToMain}>
      Ana içeriğe geç
    </a>
  );
}
