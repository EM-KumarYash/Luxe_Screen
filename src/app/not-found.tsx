import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-display text-7xl text-gold-400">404</p>
      <h1 className="mt-4 font-display text-3xl text-white">This scene was cut</h1>
      <p className="mt-3 max-w-md text-zinc-400">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/">Back to home</ButtonLink>
        <ButtonLink href="/gallery" variant="secondary">
          Browse theatres
        </ButtonLink>
      </div>
    </Container>
  );
}
