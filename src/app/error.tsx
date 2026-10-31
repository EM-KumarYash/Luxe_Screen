"use client";

import { useEffect } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-xs font-semibold tracking-[0.25em] text-gold-400 uppercase">Intermission</p>
      <h1 className="mt-3 font-display text-4xl text-white">Something went wrong</h1>
      <p className="mt-4 max-w-md text-zinc-400">
        We couldn&apos;t load this page. Please try again. If it keeps happening, contact us and we&apos;ll
        help you book.
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={() => retry()}>Try again</Button>
        <ButtonLink href="/" variant="secondary">
          Go home
        </ButtonLink>
      </div>
    </Container>
  );
}
