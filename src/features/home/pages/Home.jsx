import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import AboutSection from "../components/AboutSection";
import FeaturesSection from "../components/FeaturesSection";
import RolesSection from "../components/RolesSection";
import PlansSection from "../components/PlansSection";
import TrustStatsSection from "../components/TrustStatsSection";
import CtaSection from "../components/CtaSection";
import Footer from "../components/Footer";
import useLandingPage from "../hooks/useLandingPage";
import {
  HeroSkeleton,
  AboutSkeleton,
  FeaturesSkeleton,
  RolesSkeleton,
  PlansSkeleton,
  StatsSkeleton,
  CtaSkeleton,
  FooterSkeleton,
} from "../components/LandingSkeletons";

export default function Home() {
  // data = null on error -> every section falls back to its i18n texts
  const { data, loading } = useLandingPage();

  return (
    <div className="min-h-screen bg-[#F5F7F8] text-[#202B33]">
      <Navbar />

      <main>
        {loading ? <HeroSkeleton /> : <HeroSection data={data?.hero} />}
        {loading ? (
          <AboutSkeleton />
        ) : (
          <AboutSection data={data?.about} tickerTags={data?.hero?.ticker_tags} />
        )}
        {loading ? <FeaturesSkeleton /> : <FeaturesSection data={data?.features} />}
        {loading ? (
          <RolesSkeleton />
        ) : (
          <RolesSection roles={data?.roles} aiInsights={data?.ai_insights} />
        )}
        {loading ? <PlansSkeleton /> : <PlansSection plans={data?.plans} />}
        {loading ? <StatsSkeleton /> : <TrustStatsSection data={data?.global_stats} />}
        {loading ? <CtaSkeleton /> : <CtaSection data={data?.cta} />}
      </main>

      {loading ? <FooterSkeleton /> : <Footer data={data?.footer} />}
    </div>
  );
}