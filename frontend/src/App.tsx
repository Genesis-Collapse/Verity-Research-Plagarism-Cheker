import { Routes, Route } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";
import PreScanConfig from "@/pages/PreScanConfig";
import FeedbackStudio from "@/pages/FeedbackStudio";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/configure" element={<PreScanConfig />} />
      <Route path="/studio" element={<FeedbackStudio />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
    </Routes>
  );
}
