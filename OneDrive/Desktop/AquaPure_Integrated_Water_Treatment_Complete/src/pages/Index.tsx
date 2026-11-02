import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import ProcessFlow from "@/components/ProcessFlow";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Features />
      <ProcessFlow />
      <CTA />
      <Footer />
    </main>
  );
};

export default Index;
