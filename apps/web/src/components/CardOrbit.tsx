"use client";

import type { CardProduct } from "@cardfit/engine";
import { useEffect, useMemo, useState } from "react";
import { assetUrl, cardFacts } from "../lib/card-facts";
import { Icon } from "./icons";

const INTERVAL_MS = 3600;

function mod(value: number, n: number) {
  return ((value % n) + n) % n;
}

export function CardOrbit({ cards }: { cards: CardProduct[] }) {
  const n = cards.length;
  const step = 360 / n;
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const paused = hovering || userPaused || reduced;

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setActive((value) => value + 1), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const index = mod(active, n);
  const current = cards[index];
  const facts = useMemo(() => cardFacts(current), [current]);

  function goTo(target: number) {
    let delta = mod(target - index, n);
    if (delta > n / 2) delta -= n;
    setActive(active + delta);
  }

  return (
    <div
      className="on-blue select-none"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHovering(false);
      }}
    >
      <div
        className="orbit-stage relative mx-auto h-[200px] w-full max-w-[1200px] [--r:470px] md:h-[250px] md:[--r:740px]"
        style={{ maskImage: "linear-gradient(to right, transparent, black 18%, black 82%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 18%, black 82%, transparent)" }}
        role="group"
        aria-roledescription="carousel"
        aria-label="RBC cards in this comparison"
      >
        <div className="orbit-ring absolute inset-0" style={{ transform: `translateZ(calc(-1 * var(--r))) rotateY(${-active * step}deg)` }}>
          {cards.map((card, position) => {
            const isActive = position === index;
            return (
              <button
                key={card.id}
                type="button"
                tabIndex={-1}
                aria-hidden={!isActive}
                aria-label={isActive ? `${card.name}, showing` : `Show ${card.name}`}
                onClick={() => goTo(position)}
                className="orbit-card aspect-[1.586/1] w-[200px] overflow-hidden rounded-xl md:w-[280px]"
                style={{
                  transform: `rotateY(${position * step}deg) translateZ(var(--r))`,
                  filter: isActive ? "none" : "brightness(0.55) saturate(0.6)",
                  boxShadow: isActive ? "0 30px 50px -20px rgba(0,0,0,0.65)" : "0 10px 30px -18px rgba(0,0,0,0.5)",
                  cursor: isActive ? "default" : "pointer",
                }}
              >
                {card.image ? (
                  <img src={assetUrl(card.image)} alt={card.name} className="h-full w-full object-cover" draggable={false} />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-deep p-4 text-center text-sm font-semibold text-white">{card.name}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto mt-2 flex max-w-xl flex-col items-center px-5 text-center">
        <div key={current.id} className="fade-swap min-h-[112px]">
          <p className="text-xl font-semibold leading-tight text-white md:text-2xl">{current.name}</p>
          <p className="mt-1 text-[15px] text-white/80">
            {facts.family} <span aria-hidden className="mx-1.5 text-gold">•</span> {facts.fee}
          </p>
          <p className="mt-2 text-base font-medium text-white">{facts.earn}</p>
          {facts.secondary ? <p className="text-sm text-white/75">{facts.secondary}</p> : null}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button type="button" aria-label="Previous card" onClick={() => goTo(index - 1)} className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white">
            <Icon.ChevronLeft size={22} />
          </button>
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Choose a card">
            {cards.map((card, position) => (
              <button
                key={card.id}
                type="button"
                role="tab"
                aria-selected={position === index}
                aria-label={card.name}
                onClick={() => goTo(position)}
                className={`h-2 rounded-full transition-all duration-300 ${position === index ? "w-6 bg-gold" : "w-2 bg-white/40 hover:bg-white/70"}`}
              />
            ))}
          </div>
          <button type="button" aria-label="Next card" onClick={() => goTo(index + 1)} className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white">
            <Icon.ChevronRight size={22} />
          </button>
          <button
            type="button"
            aria-pressed={userPaused}
            aria-label={userPaused ? "Resume the carousel" : "Pause the carousel"}
            onClick={() => setUserPaused((value) => !value)}
            className="ml-1 rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            {userPaused ? <Icon.Play size={18} /> : <Icon.Pause size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
