import { createFileRoute } from "@tanstack/react-router";
import { KaleidoBreak } from "@/components/kaleido-break";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <KaleidoBreak />;
}
