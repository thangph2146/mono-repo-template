import { HomeClient } from "./home-client";

export type HomeProps = Record<string, never>;

export async function Home({}: HomeProps) {
  return <HomeClient />;
}
