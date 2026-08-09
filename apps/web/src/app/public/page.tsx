import { Navbar } from "@/components/public/navbar";
import { Hero } from "@/components/public/hero";
import { BusinessStory } from "@/components/public/business-story";
import { CTA } from "@/components/public/cta";
import { Footer } from "@/components/public/footer";

export default function HomePage() {
  return (
    <div className="public-website">
      <Navbar />
      <main>
        <Hero />
        <BusinessStory />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
