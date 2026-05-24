import type { ChunkResult, SubmissionDetails, SanitizationInfo } from "@/types";

// ─── Mock Submission Details ───────────────────────────────────────────────

export const mockSubmissionDetails: SubmissionDetails = {
  submissionId: "2610566161",
  dateTime: "23-May-2026 02:35PM (UTC+0530)",
  fileName: "Research_Analysis_Paper.docx",
  fileExtension: "docx",
  fileSize: "21.16K",
  pageCount: 3,
  wordCount: 1113,
  characterCount: 6723,
  userName: "User",
};

// ─── Mock Sanitization Info ────────────────────────────────────────────────

export const mockSanitization: SanitizationInfo = {
  unicode_normalized: true,
  zero_width_chars_removed: 3,
  whitespace_normalized: true,
  total_chars: 6723,
};

// ─── Mock Document Text (Simulated Research Paper) ─────────────────────────

const mockDocumentChunks: ChunkResult[] = [
  {
    chunk_index: 0,
    total_chunks: 6,
    text: "The management case study analyzed the situation after assessing that continuing in the same direction was not feasible without implementing a strategic change.",
    full_text:
      "The management case study analyzed the situation after assessing that continuing in the same direction was not feasible without implementing a strategic change. Several potential strategies were taken into consideration, including cost reduction measures and market expansion initiatives. The research methodology employed both qualitative and quantitative approaches to ensure comprehensive analysis.",
    ai_probability: 0.06,
    ai_label: "Human-Written",
    is_plagiarized: false,
    max_similarity: 0.32,
    matches: [],
    is_quote: false,
    is_bibliography: false,
    sanitization: mockSanitization,
  },
  {
    chunk_index: 1,
    total_chunks: 6,
    text: "Competing on price: Price competition involves lowering firms to attract higher-cost conscious clients and concentrating on growing by building volume to make up for declining profit margins.",
    full_text:
      "Competing on price: Price competition involves lowering firms to attract higher-cost conscious clients and concentrating on growing by building volume to make up for declining profit margins. A pricing war with rivals, however, would reduce profitability and make it more difficult to sustain operations. The economic implications of this approach were studied extensively across multiple industry sectors, revealing consistent patterns of diminishing returns.",
    ai_probability: 0.12,
    ai_label: "Human-Written",
    is_plagiarized: true,
    max_similarity: 0.82,
    matches: [
      {
        title: "Strategic Pricing in Competitive Markets: A Meta-Analysis",
        doi: "10.1016/j.jbusres.2024.03.041",
        doi_url: "https://doi.org/10.1016/j.jbusres.2024.03.041",
        source: "OpenAlex",
        similarity: 0.82,
      },
      {
        title: "Market Competition and Firm Profitability",
        doi: "10.1108/CR-03-2023-0045",
        doi_url: "https://doi.org/10.1108/CR-03-2023-0045",
        source: "Crossref",
        similarity: 0.76,
      },
    ],
    is_quote: false,
    is_bibliography: false,
    sanitization: null,
  },
  {
    chunk_index: 2,
    total_chunks: 6,
    text: "Customer Loyalty & Retention Programs: To promote recurring business and fortify brand loyalty, subscription plans, membership discounts, and referral bonuses are being introduced.",
    full_text:
      "Customer Loyalty & Retention Programs: To promote recurring business and fortify brand loyalty, subscription plans, membership discounts, and referral bonuses are being introduced. Although careful execution would be necessary to secure long-term success, this could aid in developing a sturdy clientele. The implementation framework draws from established consumer behavior theories and empirical studies on retention economics.",
    ai_probability: 0.87,
    ai_label: "AI-Generated",
    is_plagiarized: false,
    max_similarity: 0.41,
    matches: [],
    is_quote: false,
    is_bibliography: false,
    sanitization: null,
  },
  {
    chunk_index: 3,
    total_chunks: 6,
    text: "Expanding into Corporate Travel: Getting into the corporate travel market by focusing on bulk travel arrangements and business class accommodation would diversify the revenue streams.",
    full_text:
      "Expanding into Corporate Travel: Getting into the corporate travel market by focusing on bulk travel arrangements and business class accommodation would diversify the revenue streams. Financial stability might result from this, but building relationships and trust in a market already dominated by established rivals would take time and significant investment in marketing and partnership development.",
    ai_probability: 0.94,
    ai_label: "AI-Generated",
    is_plagiarized: true,
    max_similarity: 0.78,
    matches: [
      {
        title: "Corporate Travel Management: Strategies for Market Entry",
        doi: "10.1177/00472875241234567",
        doi_url: "https://doi.org/10.1177/00472875241234567",
        source: "CORE",
        similarity: 0.78,
      },
    ],
    is_quote: false,
    is_bibliography: false,
    sanitization: null,
  },
  {
    chunk_index: 4,
    total_chunks: 6,
    text: "Focusing on Niche Market Segments: The business might redefine itself as a premium travel provider with a focus on exclusive chauffeur-driven services, wedding transportation, and luxury travel experiences.",
    full_text:
      "Focusing on Niche Market Segments: The business might redefine itself as a premium travel provider with a focus on exclusive chauffeur-driven services, wedding transportation, and luxury travel experiences rather than competing on price. Although it might challenge the current market position, this approach allows differentiation and reduced direct competition with budget operators.",
    ai_probability: 0.03,
    ai_label: "Human-Written",
    is_plagiarized: false,
    max_similarity: 0.28,
    matches: [],
    is_quote: false,
    is_bibliography: false,
    sanitization: null,
  },
  {
    chunk_index: 5,
    total_chunks: 6,
    text: "Many independent operators and local travel agencies are competing for market share in this rapidly evolving transportation landscape.",
    full_text:
      "Many independent operators and local travel agencies are competing for market share in this rapidly evolving transportation landscape. The emergence of ride-hailing applications and digital booking platforms has fundamentally altered consumer expectations and purchasing behaviors. Traditional business models must adapt to survive in this increasingly technology-driven marketplace.",
    ai_probability: 0.45,
    ai_label: "Human-Written",
    is_plagiarized: true,
    max_similarity: 0.91,
    matches: [
      {
        title: "Digital Disruption in the Transportation Industry",
        doi: "10.1016/j.techfore.2025.01.089",
        doi_url: "https://doi.org/10.1016/j.techfore.2025.01.089",
        source: "OpenAlex",
        similarity: 0.91,
      },
      {
        title: "Ride-Hailing Platforms and Market Competition",
        doi: "10.1287/isre.2024.0567",
        doi_url: "https://doi.org/10.1287/isre.2024.0567",
        source: "Crossref",
        similarity: 0.84,
      },
      {
        title: "Evolution of Transportation Business Models",
        doi: null,
        doi_url: null,
        source: "CORE",
        similarity: 0.77,
      },
    ],
    is_quote: false,
    is_bibliography: false,
    sanitization: null,
  },
];

export { mockDocumentChunks };

// ─── Aggregate Stats Helper ────────────────────────────────────────────────

export function computeMockStats(chunks: ChunkResult[]) {
  const totalChunks = chunks.length;
  if (totalChunks === 0) {
    return {
      totalChunks: 0,
      plagiarizedCount: 0,
      aiCount: 0,
      avgSimilarity: 0,
      avgAiProb: 0,
      similarityScore: 0,
      overallSimilarityPercent: 0,
      overallAiPercent: 0,
    };
  }

  const plagiarizedCount = chunks.filter((r) => r.is_plagiarized).length;
  const aiCount = chunks.filter((r) => r.ai_probability > 0.5).length;

  // Weighted scoring: only count plagiarized chunks' similarity, not all chunks
  const plagiarizedChunks = chunks.filter((r) => r.is_plagiarized);
  const avgSimilarity =
    plagiarizedChunks.length > 0
      ? plagiarizedChunks.reduce((sum, r) => sum + r.max_similarity, 0) / plagiarizedChunks.length
      : 0;

  // AI probability: use median-like scoring with outlier dampening
  const sortedAiProbs = chunks.map((r) => r.ai_probability).sort((a, b) => a - b);
  // Trim top/bottom 10% outliers if enough chunks
  const trimCount = totalChunks >= 10 ? Math.floor(totalChunks * 0.1) : 0;
  const trimmedProbs = sortedAiProbs.slice(trimCount, sortedAiProbs.length - trimCount);
  const avgAiProb =
    trimmedProbs.length > 0
      ? trimmedProbs.reduce((sum, p) => sum + p, 0) / trimmedProbs.length
      : 0;

  // Overall similarity score = weighted percentage of flagged content
  const overallSimilarityPercent = Math.round(
    (plagiarizedCount / totalChunks) * 100 * avgSimilarity
  );

  return {
    totalChunks,
    plagiarizedCount,
    aiCount,
    avgSimilarity,
    avgAiProb,
    similarityScore: Math.min(overallSimilarityPercent, 100),
    overallSimilarityPercent: Math.min(overallSimilarityPercent, 100),
    overallAiPercent: Math.round(avgAiProb * 100),
  };
}
