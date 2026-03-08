import { SearchHero } from '@/components/search-hero';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col">
        <SearchHero />
      </main>
      <Footer />
    </div>
  );
}
