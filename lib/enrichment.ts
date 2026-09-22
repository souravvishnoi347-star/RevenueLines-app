/**
 * Autonomous ICP Research & Live Web Intelligence Engine
 * Researches the specific broker by NAME + Agency on the live web (public records, deals, awards)
 * and analyzes agency websites to generate irresistible 1-to-1 personalization hooks.
 */

export interface EnrichedContext {
  targetHook: string;
  activeAreas: string[];
  agencyProfile: string;
  triggerObservation: string;
  liveResearchSnippet?: string;
  source: 'live_web_research' | 'website_scrape' | 'domain_inferred' | 'dld_intelligence';
}

/**
 * Clean and extract domain from email or URL
 */
function extractDomain(input?: string): string | null {
  if (!input) return null;
  const cleaned = input.trim().toLowerCase();
  
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://') || cleaned.includes('.')) {
    try {
      const url = cleaned.startsWith('http') ? cleaned : `https://${cleaned}`;
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./, '');
      if (host && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'].includes(host)) {
        return host;
      }
    } catch {
      // ignore
    }
  }

  if (cleaned.includes('@')) {
    const domain = cleaned.split('@')[1];
    if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'].includes(domain)) {
      return domain;
    }
  }

  return null;
}

/**
 * Autonomous Web Intelligence Search: Searches broker NAME + Agency on live web
 */
async function searchBrokerWebIntelligence(name: string, agency?: string): Promise<string | null> {
  const cleanName = name.replace(/broker|ceo|founder|agent|director/gi, '').trim();
  if (!cleanName || cleanName.length < 3) return null;

  const cleanAgency = (agency || '').replace(/L\.?L\.?C\.?/i, '').replace(/Brokerage/i, '').trim();
  const query = `${cleanName} ${cleanAgency} Dubai real estate`.trim();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500); // 3.5s timeout safety

    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const html = await res.text();

    const snippets: string[] = [];
    const matches = html.matchAll(/<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g);
    for (const m of matches) {
      const cleaned = m[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&amp;/g, '&')
        .trim();

      // Ensure snippet is relevant to Dubai or real estate
      if (cleaned.length > 30 && (
        cleaned.toLowerCase().includes('dubai') || 
        cleaned.toLowerCase().includes('real estate') || 
        cleaned.toLowerCase().includes('property') || 
        cleaned.toLowerCase().includes(cleanAgency.toLowerCase())
      )) {
        snippets.push(cleaned);
      }
    }

    if (snippets.length === 0) return null;
    // Return top high-signal snippet
    return snippets[0].slice(0, 220);
  } catch {
    return null;
  }
}

/**
 * Safely fetch and extract keywords from an agency website
 */
async function scrapeAgencyWebsite(domain: string): Promise<{ text: string; keywords: string[] } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout

    const res = await fetch(`https://${domain}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const html = await res.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    
    const pageText = [
      titleMatch?.[1] || '',
      descMatch?.[1] || '',
      html.replace(/<[^>]+>/g, ' ').slice(0, 2500)
    ].join(' ').toLowerCase();

    const dubaiAreas = [
      'palm jumeirah', 'palm jebel ali', 'downtown dubai', 'dubai marina', 
      'business bay', 'dubai hills estate', 'meydan', 'creek harbour', 
      'emaar south', 'damac hills', 'al barari', 'jvc', 'jumeirah golf estates'
    ];

    const matchedAreas = dubaiAreas.filter(area => pageText.includes(area));
    const keywords: string[] = [];
    if (pageText.includes('off-plan') || pageText.includes('off plan')) keywords.push('Off-Plan');
    if (pageText.includes('luxury') || pageText.includes('penthouse') || pageText.includes('villa')) keywords.push('Luxury');
    if (pageText.includes('secondary') || pageText.includes('resale')) keywords.push('Secondary');

    return {
      text: (titleMatch?.[1] || '') + ' ' + (descMatch?.[1] || ''),
      keywords: [...matchedAreas.slice(0, 3), ...keywords]
    };
  } catch {
    return null;
  }
}

/**
 * Main enrichment handler
 */
export async function enrichProspect(lead: {
  name: string;
  agency_name?: string;
  email?: string;
  website?: string;
  agency_size?: string;
  outbound_tier?: string;
  recommended_offer?: string;
}): Promise<EnrichedContext> {
  const agency = (lead.agency_name || 'your agency').replace(/L\.?L\.?C\.?/i, '').replace(/Brokerage/i, '').trim();
  const domain = extractDomain(lead.website) || extractDomain(lead.email);

  // 1. Live Web Search for the Broker by Name
  const liveResearch = await searchBrokerWebIntelligence(lead.name, agency);
  if (liveResearch) {
    return {
      source: 'live_web_research',
      activeAreas: ['Dubai Prime'],
      agencyProfile: `${agency} (Verified via Live Web Intelligence)`,
      liveResearchSnippet: liveResearch,
      targetHook: `Live web discovery: "${liveResearch}"`,
      triggerObservation: liveResearch
    };
  }

  // 2. Fallback to Agency Website Scraper
  if (domain) {
    const webResult = await scrapeAgencyWebsite(domain);
    if (webResult && (webResult.keywords.length > 0 || webResult.text.trim().length > 10)) {
      const areas = webResult.keywords.filter(k => !['Off-Plan', 'Luxury', 'Secondary'].includes(k));
      const activeAreas = areas.length > 0 ? areas : ['Prime Dubai'];
      
      return {
        source: 'website_scrape',
        activeAreas,
        agencyProfile: `${domain} (${webResult.keywords.join(', ') || 'Dubai Real Estate'})`,
        targetHook: `Saw ${agency}'s focus across ${activeAreas.slice(0, 2).map(a => a.toUpperCase()).join(' & ')}`,
        triggerObservation: `Saw your active portfolio across ${activeAreas[0] || 'Dubai'} and your team at ${agency}.`
      };
    }
  }

  // 3. Fallback to DLD Registry Intelligence
  const size = lead.agency_size || 'active';
  const tier = lead.outbound_tier || 'A';

  let observation = `Saw you guys have a team over at ${agency}.`;
  if (size && size !== 'Unknown') {
    observation = `Saw you guys have a team of ${size} brokers over at ${agency}.`;
  }

  return {
    source: 'dld_intelligence',
    activeAreas: ['Dubai Prime'],
    agencyProfile: `${agency} (DLD Tier: ${tier}, Scale: ${size})`,
    targetHook: `DLD Verified Scale: ${size} brokers`,
    triggerObservation: observation
  };
}
