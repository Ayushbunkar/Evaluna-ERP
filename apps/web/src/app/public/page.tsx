import { BusinessStory } from "@/components/public/business-story";
import { CTA } from "@/components/public/cta";
import { Footer } from "@/components/public/footer";
import { Hero } from "@/components/public/hero";
import { Navbar } from "@/components/public/navbar";

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
