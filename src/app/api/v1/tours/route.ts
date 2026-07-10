import { NextResponse } from "next/server";

const TOURS = [
  {
    id: "platform-overview",
    name: "📚 Platform Overview Tour",
    description: "Learn the core capabilities of the TruthBomb verification engine.",
    path: "/",
    steps: [
      {
        selector: "header a[href='/']",
        title: "Welcome to TruthBomb",
        content: "TruthBomb is an AI-powered verification platform designed to verify digital content and analyze search discoverability in real time.",
        placement: "bottom"
      },
      {
        selector: "main h1, main h2",
        title: "Combat Misinformation",
        content: "Our mission is to help you check facts, track claims, and monitor how generative AI search platforms represent information.",
        placement: "bottom"
      },
      {
        selector: "header a[href='/dashboard']",
        title: "Go to Dashboard",
        content: "Use the Dashboard link to access your workspaces, upload files, and check past reports.",
        placement: "bottom"
      }
    ]
  },
  {
    id: "dashboard-tour",
    name: "🚀 Dashboard Workspace",
    description: "Explore the elements of your personal workspace.",
    path: "/dashboard",
    steps: [
      {
        selector: "h1.editorial-heading",
        title: "Workspace Overview",
        content: "This is your central control dashboard where you can monitor your active documents, brand analyses, and reports.",
        placement: "right"
      },
      {
        selector: ".mt-10.grid.gap-4.sm\\:grid-cols-3",
        title: "Live Stats",
        content: "Track your usage statistics, including total uploaded documents, analyzed brands, and verified reports.",
        placement: "top"
      },
      {
        selector: "a[href='/fact-check']",
        title: "Verify New PDF",
        content: "Launch the PDF Fact-Check pipeline here to extract claims and verify them against live search data.",
        placement: "bottom"
      },
      {
        selector: "a[href='/geo']",
        title: "GEO visibility analysis",
        content: "Check how visible your website or brand is in search generative engines (SGE) like ChatGPT, Gemini, and Claude.",
        placement: "bottom"
      }
    ]
  },
  {
    id: "fact-check-tour",
    name: "🔍 Fact-Check Setup",
    description: "Learn how to start a live claims verification pipeline.",
    path: "/fact-check",
    steps: [
      {
        selector: "h1.editorial-heading",
        title: "Fact-Check Pipeline",
        content: "This module uses deep learning to extract verifiable claims from any PDF, research them on the web, and rank sources.",
        placement: "bottom"
      },
      {
        selector: "#pdf-upload-zone",
        title: "Upload Dropzone",
        content: "Drag and drop your PDF here (up to 10MB). Text-based PDFs will provide the most accurate claim extraction results.",
        placement: "top"
      }
    ]
  },
  {
    id: "geo-tour",
    name: "🗺️ GEO Analysis Walkthrough",
    description: "Discover how to configure Brand Search Visibility.",
    path: "/geo",
    steps: [
      {
        selector: "h1.editorial-heading",
        title: "GEO Analytics",
        content: "Generative Engine Optimization (GEO) tracks your brand's footprint in generative responses to help optimize your SEO strategy.",
        placement: "bottom"
      },
      {
        selector: "input#brand",
        title: "Brand Name",
        content: "Enter your official brand name as it appears in public discourse and web articles.",
        placement: "bottom"
      },
      {
        selector: "input#url",
        title: "Official URL",
        content: "Add your brand's official domain name to check mapping and discoverability.",
        placement: "bottom"
      },
      {
        selector: "input#competitors",
        title: "Competitors",
        content: "Provide a comma-separated list of competitor names to generate comparative visibility score charts.",
        placement: "bottom"
      }
    ]
  }
];

const FAQS = [
  {
    question: "What is TruthBomb?",
    answer: "TruthBomb is a web application that extracts factual claims from PDF documents, performs live searches using Tavily Search API, ranks the relevance of sources, and uses AI to verify those claims."
  },
  {
    question: "What is GEO Analytics?",
    answer: "GEO (Generative Engine Optimization) is the practice of increasing brand visibility in AI-powered search engines. This analytics dashboard provides visibility rankings and recommendations for ChatGPT, Claude, and Gemini."
  },
  {
    question: "Can I verify scan-only PDFs?",
    answer: "TruthBomb works best on text-based PDFs. Clean text allows the AI models to parse exact sentences for claim classification."
  }
];

export async function GET() {
  return NextResponse.json({ tours: TOURS, faqs: FAQS });
}
