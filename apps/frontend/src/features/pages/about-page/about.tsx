import { AboutClient } from "./about-client";

export type AboutProps = Record<string, never>;

export function About({}: AboutProps) {
  return <AboutClient />;
}

