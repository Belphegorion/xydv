import { HeroSection } from '@/components/store/HeroSection';
import { FeaturedCollection } from '@/components/store/FeaturedCollection';
import { BrandStatement } from '@/components/store/BrandStatement';
import { CollectionShowcase } from '@/components/store/CollectionShowcase';
import { BestsellerGrid } from '@/components/store/BestsellerGrid';
import { SocialProof } from '@/components/store/SocialProof';
import { SocialLinksSection } from '@/components/store/SocialLinksSection';
import { NewsletterSection } from '@/components/store/NewsletterSection';

export default function HomePage() {
  return (
    <>
      <link
        rel="preload"
        as="image"
        href="/animations/hero/ezgif-frame-001.jpg"
        fetchPriority="high"
      />
      <HeroSection />
      <FeaturedCollection />
      <BrandStatement />
      <CollectionShowcase />
      <BestsellerGrid />
      <SocialProof />
      <SocialLinksSection />
      <NewsletterSection />
    </>
  );
}
