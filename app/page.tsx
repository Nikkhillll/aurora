import "@/components/landing/landing.css";
import LandingNav from "@/components/landing/LandingNav";
import Hero from "@/components/landing/Hero";
import ProblemSolution from "@/components/landing/ProblemSolution";
import LoopStrip from "@/components/landing/LoopStrip";
import DomainGrid from "@/components/landing/DomainGrid";
import CtaFooter from "@/components/landing/CtaFooter";

export default function LandingPage() {
  return (
    <div className="flex-1">
      <LandingNav />
      <Hero />
      <ProblemSolution />
      <LoopStrip />
      <DomainGrid />
      <CtaFooter />
    </div>
  );
}