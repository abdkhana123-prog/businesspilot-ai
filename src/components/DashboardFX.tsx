"use client";

import { useEffect } from "react";

export default function DashboardFX() {
  useEffect(() => {
    const scope = document.querySelector("main");
    if (!scope) return;

    scope.classList.add("dashboard-fx-enabled");

    // Existing dashboard panels only: no new dots, particles, symbols or markup.
    const cards = Array.from(
      scope.querySelectorAll<HTMLElement>(
        "section > div, section > a, section > article, section > button",
      ),
    ).filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 180 && rect.height > 80;
    });

    const listeners = new Map<HTMLElement, { move: (event: PointerEvent) => void; leave: () => void }>();

    cards.forEach((card, index) => {
      card.classList.add("fx-sequence-card", "fx-3d-hover");
      card.style.setProperty("--fx-index", String(index));
      card.style.setProperty("--fx-delay", `${Math.min(index % 5, 4) * 90}ms`);
      card.style.setProperty("--fx-entry-y", index % 2 === 0 ? "-34deg" : "34deg");
      card.style.setProperty("--fx-entry-z", index % 2 === 0 ? "-2deg" : "2deg");

      const move = (event: PointerEvent) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--fx-rotate-x", `${y * -9}deg`);
        card.style.setProperty("--fx-rotate-y", `${x * 12}deg`);
        card.style.setProperty("--fx-hover-scale", "1.075");
        card.style.setProperty("--fx-hover-z", "28px");
      };

      const leave = () => {
        card.style.setProperty("--fx-rotate-x", "0deg");
        card.style.setProperty("--fx-rotate-y", "0deg");
        card.style.setProperty("--fx-hover-scale", "1");
        card.style.setProperty("--fx-hover-z", "0px");
      };

      card.addEventListener("pointermove", move);
      card.addEventListener("pointerleave", leave);
      listeners.set(card, { move, leave });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("fx-card-visible");
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -9% 0px" },
    );

    cards.forEach((card) => observer.observe(card));

    return () => {
      observer.disconnect();
      listeners.forEach(({ move, leave }, card) => {
        card.removeEventListener("pointermove", move);
        card.removeEventListener("pointerleave", leave);
        card.classList.remove("fx-sequence-card", "fx-3d-hover", "fx-card-visible");
        ["--fx-index", "--fx-delay", "--fx-entry-y", "--fx-entry-z", "--fx-rotate-x", "--fx-rotate-y", "--fx-hover-scale", "--fx-hover-z"].forEach((property) => card.style.removeProperty(property));
      });
      scope.classList.remove("dashboard-fx-enabled");
    };
  }, []);

  // Intentionally renders nothing: this prevents the old dots/particle symbols.
  return null;
}
