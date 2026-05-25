export type ClaimCategory =
  | "STATISTIC"
  | "DATE"
  | "FINANCIAL"
  | "TECHNICAL"
  | "SCIENTIFIC"
  | "GENERAL";

export type VerificationStatus =
  | "VERIFIED"
  | "FALSE"
  | "OUTDATED"
  | "PARTIALLY_TRUE"
  | "NO_EVIDENCE";

export interface ExtractedClaim {
  claim: string;
  category: ClaimCategory;
  confidence: number;
  context?: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: "tavily" | "brave" | "exa";
  publishedAt?: string;
  relevanceScore: number;
}

export interface VerificationOutput {
  status: VerificationStatus;
  confidence: number;
  reasoning: string;
  correction?: string;
  searchQueries: string[];
  evidence: SearchResult[];
}

export interface GeoAnalysisResult {
  visibilityScore: number;
  aiMentionRankings: {
    platform: string;
    rank: number;
    mentionFrequency: number;
    sentiment: string;
  }[];
  competitorAnalysis: {
    name: string;
    visibilityScore: number;
    strengths: string[];
    weaknesses: string[];
  }[];
  geoRecommendations: string[];
  seoSuggestions: string[];
  threeMonthStrategy: string[];
  oneYearRoadmap: string[];
  discoverabilityScore: number;
  summary: string;
}

export interface FactCheckReportContent {
  documentId: string;
  fileName: string;
  totalClaims: number;
  verifiedCount: number;
  falseCount: number;
  outdatedCount: number;
  partialCount: number;
  noEvidenceCount: number;
  overallConfidence: number;
  claims: Array<{
    id: string;
    claim: string;
    category: ClaimCategory;
    status: VerificationStatus;
    confidence: number;
    reasoning: string;
    correction?: string;
    evidence: SearchResult[];
  }>;
  executiveSummary: string;
}
