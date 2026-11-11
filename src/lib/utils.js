/* eslint-disable unicorn/prevent-abbreviations */
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 *
 */
export const cn = (...inputs) => twMerge(clsx(inputs));

const isScrollable = (element) => {
  const { overflowY } = window.getComputedStyle(element);
  return (
    (overflowY === "auto" || overflowY === "scroll") &&
    element.scrollHeight > element.clientHeight
  );
};

/**
 * Scrolls an element into view inside its nearest scrollable ancestor only.
 * Unlike `Element.scrollIntoView`, it never scrolls the page itself, so
 * stacked mobile layouts don't jump away from the board when a panel updates.
 * @param {Element | null | undefined} element - Element to reveal
 * @param {{ align?: "end" | "nearest", behavior?: ScrollBehavior }} [options] - Alignment and scroll behavior
 */
export const scrollIntoViewWithin = (
  element,
  { align = "end", behavior = "smooth" } = {},
) => {
  if (!element) return;
  let container = element.parentElement;
  while (container && !isScrollable(container)) {
    container = container.parentElement;
  }
  if (!container || container === document.documentElement) return;

  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  let delta = 0;
  if (align === "end") {
    delta = elementRect.bottom - containerRect.bottom;
  } else if (elementRect.top < containerRect.top) {
    delta = elementRect.top - containerRect.top;
  } else if (elementRect.bottom > containerRect.bottom) {
    delta = elementRect.bottom - containerRect.bottom;
  }
  if (delta !== 0) {
    container.scrollBy({ top: delta, behavior });
  }
};
