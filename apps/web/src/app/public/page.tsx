import { Navbar } from "@/components/public/navbar";
import { Hero } from "@/components/public/hero";
import { BusinessStory } from "@/components/public/business-story";
import { BulkOrdering } from "@/components/public/bulk-ordering";
import { ShopkeeperExperience } from "@/components/public/shopkeeper-experience";
import { DistributionNetwork } from "@/components/public/distribution-network";
import { ProductPreview } from "@/components/public/product-preview";
import { FeaturesOverview } from "@/components/public/features-overview";
import { InventoryVisual } from "@/components/public/inventory-visual";
import { AnalyticsSection } from "@/components/public/analytics-section";
import { ImageGrid } from "@/components/public/image-grid";
import { WhyEvalona } from "@/components/public/why-evalona";
import { TrustSection } from "@/components/public/trust-section";
import { CTA } from "@/components/public/cta";
import { Footer } from "@/components/public/footer";

export default function HomePage() {
  return (
    <div className="public-website">
      <Navbar />
      <main>
        <Hero />
        <BusinessStory />
        <BulkOrdering />
        <ShopkeeperExperience />
        <DistributionNetwork />
        <ProductPreview />
        <FeaturesOverview />
        <InventoryVisual />
        <AnalyticsSection />
        <ImageGrid />
        <WhyEvalona />
        <TrustSection />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}