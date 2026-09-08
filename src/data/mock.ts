// Mock data used across the prototype. Backend integration will replace these.

export interface License {
  id: string;
  name: string;
  agency: string;
  industry: string;
  location: string;
  fee: string;
  validity: string;
  processing: string;
  status: "Published" | "Draft" | "In Review" | "Unpublished";
  description: string;
  keywords: string[];
}

export const licenses: License[] = [
  { id: "L-001", name: "General Trading Licence", agency: "Lusaka City Council", industry: "Trade & Commerce", location: "Lusaka", fee: "ZMW 1,200", validity: "12 months", processing: "5 working days", status: "Published", description: "Required for any business engaged in retail or wholesale trade within municipal boundaries.", keywords: ["retail", "wholesale", "trading"] },
  { id: "L-002", name: "Tour Operator Licence", agency: "Zambia Tourism Agency", industry: "Tourism & Hospitality", location: "National", fee: "ZMW 5,500", validity: "24 months", processing: "14 working days", status: "Published", description: "For entities organizing tours, safaris and travel itineraries.", keywords: ["tourism", "safari", "travel"] },
  { id: "L-003", name: "Small-Scale Mining Right", agency: "Ministry of Mines & Minerals Development", industry: "Mining & Extraction", location: "National", fee: "ZMW 12,000", validity: "5 years", processing: "30 working days", status: "Published", description: "Authorizes prospecting and small-scale mineral extraction operations.", keywords: ["mining", "minerals", "exploration"] },
  { id: "L-004", name: "Fish Farming Permit", agency: "Department of Fisheries", industry: "Agriculture & Farming", location: "National", fee: "ZMW 850", validity: "12 months", processing: "10 working days", status: "Published", description: "Permits commercial aquaculture operations including fingerling production.", keywords: ["aquaculture", "fisheries"] },
  { id: "L-005", name: "Pharmacy Operating Licence", agency: "Zambia Medicines Regulatory Authority", industry: "Health & Pharmaceuticals", location: "National", fee: "ZMW 3,200", validity: "12 months", processing: "21 working days", status: "Published", description: "Required to operate a retail pharmacy or pharmaceutical wholesale outlet.", keywords: ["pharmacy", "medicine", "health"] },
  { id: "L-006", name: "Lodge & Guest House Permit", agency: "Zambia Tourism Agency", industry: "Tourism & Hospitality", location: "Southern Province", fee: "ZMW 2,400", validity: "24 months", processing: "10 working days", status: "Published", description: "For accommodation establishments with up to 30 rooms.", keywords: ["lodge", "accommodation"] },
  { id: "L-007", name: "Environmental Impact Assessment Certificate", agency: "Zambia Environmental Management Agency", industry: "Mining & Extraction", location: "National", fee: "ZMW 8,000", validity: "Project lifetime", processing: "60 working days", status: "Published", description: "Mandatory environmental clearance for prescribed projects.", keywords: ["environment", "EIA"] },
  { id: "L-008", name: "Cross-Border Freight Permit", agency: "Road Transport & Safety Agency", industry: "Logistics & Transport", location: "National", fee: "ZMW 1,800", validity: "12 months", processing: "7 working days", status: "Published", description: "Authorizes commercial freight movement across COMESA borders.", keywords: ["freight", "transport", "logistics"] },
];

export const agencies = [
  { id: "A-01", slug: "lusaka-city-council", name: "Lusaka City Council", licenses: 142, contact: "info@lcc.gov.zm" },
  { id: "A-02", slug: "zambia-tourism-agency", name: "Zambia Tourism Agency", licenses: 38, contact: "info@zta.org.zm" },
  { id: "A-03", slug: "ministry-mines", name: "Ministry of Mines & Minerals Development", licenses: 67, contact: "info@mmmd.gov.zm" },
  { id: "A-04", slug: "zema", name: "Zambia Environmental Management Agency", licenses: 24, contact: "info@zema.org.zm" },
  { id: "A-05", slug: "rtsa", name: "Road Transport & Safety Agency", licenses: 31, contact: "info@rtsa.org.zm" },
  { id: "A-06", slug: "zamra", name: "Zambia Medicines Regulatory Authority", licenses: 19, contact: "info@zamra.co.zm" },
];

export const locations = [
  { id: "loc-1", name: "Lusaka Province", licenses: 4192 },
  { id: "loc-2", name: "Copperbelt Province", licenses: 847 },
  { id: "loc-3", name: "Southern Province", licenses: 1204 },
  { id: "loc-4", name: "Northern Province", licenses: 633 },
  { id: "loc-5", name: "Eastern Province", licenses: 521 },
  { id: "loc-6", name: "Western Province", licenses: 412 },
  { id: "loc-7", name: "Central Province", licenses: 689 },
  { id: "loc-8", name: "Muchinga Province", licenses: 298 },
  { id: "loc-9", name: "North-Western Province", licenses: 387 },
  { id: "loc-10", name: "Luapula Province", licenses: 256 },
];

export const industries = [
  { id: "ind-1", name: "Agriculture & Farming", count: 142 },
  { id: "ind-2", name: "Mining & Extraction", count: 87 },
  { id: "ind-3", name: "Trade & Commerce", count: 315 },
  { id: "ind-4", name: "Tourism & Hospitality", count: 94 },
  { id: "ind-5", name: "Manufacturing", count: 121 },
  { id: "ind-6", name: "Logistics & Transport", count: 78 },
  { id: "ind-7", name: "Health & Pharmaceuticals", count: 56 },
  { id: "ind-8", name: "Financial Services", count: 41 },
  { id: "ind-9", name: "Energy & Utilities", count: 33 },
  { id: "ind-10", name: "Telecommunications", count: 22 },
];

export const businessTypes = [
  { id: "bt-1", name: "Sole Proprietorship", count: 220 },
  { id: "bt-2", name: "Limited Liability Company", count: 410 },
  { id: "bt-3", name: "Partnership", count: 88 },
  { id: "bt-4", name: "Cooperative", count: 56 },
  { id: "bt-5", name: "NGO / Non-Profit", count: 34 },
  { id: "bt-6", name: "Public Limited Company", count: 42 },
];

export const activities = [
  { id: "act-1", name: "Retail trade of goods", count: 215 },
  { id: "act-2", name: "Wholesale distribution", count: 112 },
  { id: "act-3", name: "Crop production", count: 88 },
  { id: "act-4", name: "Mineral exploration", count: 41 },
  { id: "act-5", name: "Tour operations", count: 67 },
  { id: "act-6", name: "Accommodation services", count: 73 },
  { id: "act-7", name: "Freight transport", count: 51 },
  { id: "act-8", name: "Pharmaceutical retail", count: 34 },
];

export interface Regulation {
  id: string;
  title: string;
  agency: string;
  closingDate: string;
  daysLeft: number;
  status: "Open" | "Closed" | "Pending";
  description: string;
  comments: number;
}

export const regulations: Regulation[] = [
  { id: "reg-001", title: "Draft E-Commerce Trading Regulations 2026", agency: "Ministry of Commerce, Trade and Industry", closingDate: "12 May 2026", daysLeft: 12, status: "Open", description: "Proposed framework for digital storefronts operating within national borders.", comments: 47 },
  { id: "reg-002", title: "Revision to Industrial Waste Tariff Schedules", agency: "Zambia Environmental Management Agency", closingDate: "28 May 2026", daysLeft: 28, status: "Open", description: "Adjustments to fee structure for Category B industrial runoff.", comments: 23 },
  { id: "reg-003", title: "Tourism Operator Capital Requirements (Amendment)", agency: "Zambia Tourism Agency", closingDate: "06 May 2026", daysLeft: 6, status: "Open", description: "Reduces minimum capital requirements for entrants into the eco-tourism segment.", comments: 89 },
  { id: "reg-004", title: "Cross-Border Freight Levy Reform", agency: "Road Transport & Safety Agency", closingDate: "20 Jun 2026", daysLeft: 51, status: "Open", description: "Reform of the levy structure for international freight movements within COMESA.", comments: 12 },
];

export const newsArticles = [
  { id: 1, tag: "System Update", date: "12 Apr 2026", title: "PACRA integration unlocks single-window business registration", excerpt: "Entrepreneurs can now complete name reservation, tax registration and trading license in one workflow.", body: "The Patents and Companies Registration Agency (PACRA) has joined the eRegistry network..." },
  { id: 2, tag: "Policy", date: "02 Apr 2026", title: "New fast-track protocols for SEZ-based exporters", excerpt: "Streamlined registration for businesses operating within Special Economic Zones aiming for COMESA export status.", body: "Special Economic Zones in Lusaka South and Chambishi will benefit from a new 14-day clearance window..." },
  { id: 3, tag: "Notice", date: "27 Mar 2026", title: "Annual returns filing window opens", excerpt: "All registered entities must submit their annual compliance returns before the 30th of June.", body: "The annual returns portal is now live..." },
  { id: 4, tag: "Workshop", date: "15 Mar 2026", title: "Free workshop: Navigating the eRegistry as a first-time founder", excerpt: "Join our team for a virtual walkthrough of the entire licensing journey from concept to operation.", body: "Hosted on the second Thursday of every month..." },
];

export const faqs = [
  { id: 1, q: "How do I search for a business licence?", a: "Use the search bar on the homepage or browse by industry, location or agency from the Browse menu." },
  { id: 2, q: "What documents do I need to apply for a trading licence?", a: "Typically you need a certificate of incorporation, TPIN, proof of premises and ID copies of directors. Specific licences may have additional requirements listed on their detail page." },
  { id: 3, q: "How long does processing take?", a: "Processing times vary by licence type. Each licence detail page shows the standard processing time set by the issuing agency." },
  { id: 4, q: "Can I apply on behalf of a company?", a: "Yes — register a user account, link your company profile and you can submit applications on the entity's behalf." },
  { id: 5, q: "How do I submit feedback on proposed regulations?", a: "Visit the Notice & Comment section, open the regulation and use the comment form. Comments are moderated before publication." },
];
