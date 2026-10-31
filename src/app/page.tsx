import { Contact } from "@/components/sections/contact";
import { Faq } from "@/components/sections/faq";
import { Hero } from "@/components/sections/hero";
import { HowItWorks, Services } from "@/components/sections/services";
import { TheatrePreview } from "@/components/sections/theatre-preview";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Services />
      <HowItWorks />
      <TheatrePreview />
      <Faq />
      <Contact />
    </>
  );
}
