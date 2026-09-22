/**
 * Autonomous ICP Research & Enrichment Engine
 * Analyzes broker & agency websites, email domains, and DLD intelligence to extract
 * personalized triggers, active focus areas, and high-converting icebreakers.
 */

export interface EnrichedContext {
  targetHook: string;
  activeAreas: string[];
  agencyProfile: string;
  triggerObservation: string;
  source: 'website_scrape' | 'domain_inferred' | 'dld_intelligence';
}

/**
 * Clean and extract domain from email or URL
 */
function extractDomain(input?: string): string | null {
  if (!input) return null;
  const cleaned = input.trim().toLowerCase();
  
  // From URL
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

  // From Email
  if (cleaned.includes('@')) {
    const domain = cleaned.split('@')[1];
    if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'].includes(domain)) {
      return domain;
    }
  }

  return null;
}

/**
 * Safely fetch and extract keywords from an agency website
 */
async function scrapeAgencyWebsite(domain: string): Promise<{ text: string; keywords: string[] } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500); // 3.5s max timeout

    const res = await fetch(`https://${domain}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const html = await res.text();

    // Quick regex extraction of title, description, and keywords
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    
    const pageText = [
      titleMatch?.[1] || '',
      descMatch?.[1] || '',
      html.replace(/<[^>]+>/g, ' ').slice(0, 3000)
    ].join(' ').toLowerCase();

    // Common Dubai Real Estate Hotspots & Focus
    const dubaiAreas = [
      'palm jumeirah', 'palm jebel ali', 'downtown dubai', 'dubai marina', 
      'business bay', 'dubai hills estate', 'meydan', 'creek harbour', 
      'emaar south', 'damac hills', 'al barari', 'jvc', 'jumeirah golf estates'
    ];

    const matchedAreas = dubaiAreas.filter(area => pageText.includes(area));
    const keywords: string[] = [];
    if (pageText.includes('off-plan') || pageText.includes('off plan')) keywords.push('Off-Plan Projects');
    if (pageText.includes('luxury') || pageText.includes('penthouse') || pageText.includes('villa')) keywords.push('Luxury Properties');
    if (pageText.includes('commercial') || pageText.includes('retail')) keywords.push('Commercial');
    if (pageText.includes('secondary') || pageText.includes('resale')) keywords.push('Secondary Market');

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
  const domain = extractDomain(lead.website) || extractDomain(lead.email);

  if (domain) {
    const webResult = await scrapeAgencyWebsite(domain);
    if (webResult && (webResult.keywords.length > 0 || webResult.text.trim().length > 10)) {
      const areas = webResult.keywords.filter(k => !k.includes('Properties') && !k.includes('Off-Plan'));
      const activeAreas = areas.length > 0 ? areas : ['Prime Dubai'];
      
      return {
        source: 'website_scrape',
        activeAreas,
        agencyProfile: `${domain} (${webResult.keywords.join(', ') || 'Dubai Real Estate'})`,
        targetHook: `Saw ${lead.agency_name || domain}'s focus across ${activeAreas.slice(0, 2).map(a => a.toUpperCase()).join(' & ')}`,
        triggerObservation: `Noticed your portfolio in ${activeAreas[0] || 'Dubai'} and current team presence.`
      };
    }
  }

  // High-fidelity fallback based on DLD Data & Agency Name
  const agency = lead.agency_name || 'your agency';
  const size = lead.agency_size || 'active';
  const tier = lead.outbound_tier || 'A';

  let observation = `Saw ${agency}'s presence as a licensed DLD brokerage.`;
  if (size && size !== 'Unknown') {
    observation = `Noticed ${agency} has an established team of ${size} brokers registered on DLD.`;
  }

  return {
    source: 'dld_intelligence',
    activeAreas: ['Dubai Prime'],
    agencyProfile: `${agency} (DLD Tier: ${tier}, Scale: ${size})`,
    targetHook: `Noticed ${agency}'s team scale on the DLD registry`,
    triggerObservation: observation
  };
}
