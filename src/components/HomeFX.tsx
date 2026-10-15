"use client";

import { useEffect } from "react";

const CARD_SELECTOR = [
  "main section div[class*='rounded-[2rem]']",
  "main section div[class*='rounded-2xl']",
  "main section button",
  "main section form > div",
].join(",");

export default function HomeFX() {
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;

    main.classList.add("home-fx-enabled");

    const scrollRoot = main.querySelector<HTMLElement>(".overflow-y-auto") || null;
    const cards = Array.from(main.querySelectorAll<HTMLElement>(CARD_SELECTOR)).filter((element) => {
      const rect = element.getBoundingClientRect();
      const text = element.textContent?.trim() || "";
      const isTinyControl = rect.width < 100 || rect.height < 42;
      const isMessageDot = rect.width < 70 && rect.height < 70;
      return rect.width > 170 && rect.height > 70 && !isTinyControl && !isMessageDot && text.length > 0;
    });

    const uniqueCards = Array.from(new Set(cards));
    const listeners = new Map<HTMLElement, { move: (event: PointerEvent) => void; leave: () => void }>();

    uniqueCards.forEach((card, index) => {
      card.classList.add("home-fx-card");
      card.style.setProperty("--home-fx-index", `${index}`);
      card.style.setProperty("--home-fx-delay", `${Math.min(index % 6, 5) * 85}ms`);
      card.style.setProperty("--home-fx-entry-y", index % 2 === 0 ? "-34deg" : "34deg");
      card.style.setProperty("--home-fx-entry-z", index % 2 === 0 ? "-2deg" : "2deg");

      const move = (event: PointerEvent) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5;
        const y = (event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5;
        card.style.setProperty("--home-fx-rx", `${y * -8}deg`);
        card.style.setProperty("--home-fx-ry", `${x * 11}deg`);
        card.style.setProperty("--home-fx-scale", "1.065");
        card.style.setProperty("--home-fx-z", "34px");
        card.style.setProperty("--home-fx-light-x", `${(x + 0.5) * 100}%`);
        card.style.setProperty("--home-fx-light-y", `${(y + 0.5) * 100}%`);
      };

      const leave = () => {
        card.style.setProperty("--home-fx-rx", "0deg");
        card.style.setProperty("--home-fx-ry", "0deg");
        card.style.setProperty("--home-fx-scale", "1");
        card.style.setProperty("--home-fx-z", "0px");
      };

      card.addEventListener("pointermove", move);
      card.addEventListener("pointerleave", leave);
      listeners.set(card, { move, leave });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("home-fx-visible");
        });
      },
      { root: scrollRoot, threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    uniqueCards.forEach((card) => observer.observe(card));

    return () => {
      observer.disconnect();
      listeners.forEach(({ move, leave }, card) => {
        card.removeEventListener("pointermove", move);
        card.removeEventListener("pointerleave", leave);
        card.classList.remove("home-fx-card", "home-fx-visible");
        [
          "--home-fx-index",
          "--home-fx-delay",
          "--home-fx-entry-y",
          "--home-fx-entry-z",
          "--home-fx-rx",
          "--home-fx-ry",
          "--home-fx-scale",
          "--home-fx-z",
          "--home-fx-light-x",
          "--home-fx-light-y",
        ].forEach((property) => card.style.removeProperty(property));
      });
      main.classList.remove("home-fx-enabled");
    };
  }, []);

  return null;
}
