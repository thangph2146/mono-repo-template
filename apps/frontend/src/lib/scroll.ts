"use client";

const getHeaderElement = () => document.querySelector("header");

export const getHeaderHeight = () => {
  const headerElement = getHeaderElement();
  return headerElement instanceof HTMLElement ? headerElement.offsetHeight : 0;
};

export const scrollToYWithHeaderOffset = (
  targetTop: number,
  behavior: ScrollBehavior = "smooth"
) => {
  const headerHeight = getHeaderHeight();
  const nextTop = Math.max(targetTop - headerHeight, 0);

  window.scrollTo({
    top: nextTop,
    left: 0,
    behavior,
  });
};
