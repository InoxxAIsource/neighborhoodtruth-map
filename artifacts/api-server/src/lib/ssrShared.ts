/**
 * Shared HTML shell for all SSR pages
 * Base template with consistent header, footer, and branding
 */

const FONT_URL = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";

const GLOBAL_SCHEMA = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://placelabels.com/#website",
      "url": "https://placelabels.com",
      "name": "PlaceLabels",
      "description": "Crowd-sourced global neighborhood map — real insights from locals on safety, cost, and vibe.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://placelabels.com/?q={search_term_string}" },
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "Organization",
      "@id": "https://placelabels.com/#organization",
      "name": "PlaceLabels",
      "url": "https://placelabels.com",
      "logo": { "@type": "ImageObject", "url": "https://placelabels.com/og-image.png" },
      "sameAs": []
    }
  ]
});

export interface SSRPageOptions {
  title: string;
  description: string;
  canonical: string;
  bodyHtml: string;
  ogImage?: string;
  breadcrumbs?: Array<{ label: string; url?: string }>;
  schemaJson?: object;
  schemaJsons?: object[];
}

function headerHtml(): string {
  return `
    <header class="bg-white border-b shadow-sm sticky top-0 z-50">
      <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <a href="/" class="flex items-center gap-2 text-teal-700 hover:text-teal-900 font-bold text-lg">
            <span>🌍</span>
            PlaceLabels
          </a>
        </div>
        <a href="/" class="flex items-center gap-1.5 text-sm text-teal-700 border border-teal-200 rounded-lg px-3 py-1.5 hover:bg-teal-50">
          <span>🗺️</span>
          <span>Open Map</span>
        </a>
      </div>
    </header>
  `;
}

function footerHtml(): string {
  return `
    <footer class="border-t bg-white mt-16">
      <div class="max-w-5xl mx-auto px-4 py-8">
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 mb-8 pb-8 border-b">
          <div>
            <p class="font-semibold text-gray-900 text-sm mb-3">Americas</p>
            <ul class="space-y-2 text-xs text-gray-600">
              <li><a href="/new-york" class="hover:text-teal-600">New York</a></li>
              <li><a href="/san-francisco" class="hover:text-teal-600">San Francisco</a></li>
              <li><a href="/los-angeles" class="hover:text-teal-600">Los Angeles</a></li>
              <li><a href="/toronto" class="hover:text-teal-600">Toronto</a></li>
              <li><a href="/mexico-city" class="hover:text-teal-600">Mexico City</a></li>
              <li><a href="/buenos-aires" class="hover:text-teal-600">Buenos Aires</a></li>
            </ul>
          </div>
          <div>
            <p class="font-semibold text-gray-900 text-sm mb-3">Europe &amp; Middle East</p>
            <ul class="space-y-2 text-xs text-gray-600">
              <li><a href="/london" class="hover:text-teal-600">London</a></li>
              <li><a href="/amsterdam" class="hover:text-teal-600">Amsterdam</a></li>
              <li><a href="/rome" class="hover:text-teal-600">Rome</a></li>
              <li><a href="/istanbul" class="hover:text-teal-600">Istanbul</a></li>
              <li><a href="/tel-aviv" class="hover:text-teal-600">Tel Aviv</a></li>
              <li><a href="/jerusalem" class="hover:text-teal-600">Jerusalem</a></li>
              <li><a href="/tehran" class="hover:text-teal-600">Tehran</a></li>
              <li><a href="/cairo" class="hover:text-teal-600">Cairo</a></li>
            </ul>
          </div>
          <div>
            <p class="font-semibold text-gray-900 text-sm mb-3">East &amp; SE Asia</p>
            <ul class="space-y-2 text-xs text-gray-600">
              <li><a href="/tokyo" class="hover:text-teal-600">Tokyo</a></li>
              <li><a href="/seoul" class="hover:text-teal-600">Seoul</a></li>
              <li><a href="/hong-kong" class="hover:text-teal-600">Hong Kong</a></li>
              <li><a href="/bali" class="hover:text-teal-600">Bali</a></li>
              <li><a href="/cape-town" class="hover:text-teal-600">Cape Town</a></li>
              <li><a href="/karachi" class="hover:text-teal-600">Karachi</a></li>
              <li><a href="/lahore" class="hover:text-teal-600">Lahore</a></li>
            </ul>
          </div>
          <div>
            <p class="font-semibold text-gray-900 text-sm mb-3">India</p>
            <ul class="space-y-2 text-xs text-gray-600">
              <li><a href="/mumbai" class="hover:text-teal-600">Mumbai</a></li>
              <li><a href="/delhi" class="hover:text-teal-600">Delhi</a></li>
              <li><a href="/bangalore" class="hover:text-teal-600">Bangalore</a></li>
              <li><a href="/hyderabad" class="hover:text-teal-600">Hyderabad</a></li>
              <li><a href="/pune" class="hover:text-teal-600">Pune</a></li>
              <li><a href="/chennai" class="hover:text-teal-600">Chennai</a></li>
              <li><a href="/kolkata" class="hover:text-teal-600">Kolkata</a></li>
              <li><a href="/ahmedabad" class="hover:text-teal-600">Ahmedabad</a></li>
              <li><a href="/jaipur" class="hover:text-teal-600">Jaipur</a></li>
              <li><a href="/lucknow" class="hover:text-teal-600">Lucknow</a></li>
              <li><a href="/chandigarh" class="hover:text-teal-600">Chandigarh</a></li>
              <li><a href="/goa" class="hover:text-teal-600">Goa</a></li>
              <li><a href="/indore" class="hover:text-teal-600">Indore</a></li>
            </ul>
          </div>
          <div>
            <p class="font-semibold text-gray-900 text-sm mb-3">Browse by Category</p>
            <ul class="space-y-2 text-xs text-gray-600">
              <li><a href="/new-york/safe-neighborhoods" class="hover:text-teal-600">🛡️ Safe Neighborhoods</a></li>
              <li><a href="/new-york/cheap-rent" class="hover:text-teal-600">🏠 Cheap Rent</a></li>
              <li><a href="/new-york/cost-of-living" class="hover:text-teal-600">📊 Cost of Living</a></li>
              <li><a href="/new-york/transit-friendly" class="hover:text-teal-600">🚇 Transit-Friendly</a></li>
              <li><a href="/new-york/expat-neighborhoods" class="hover:text-teal-600">🌍 Expat-Friendly</a></li>
              <li><a href="/new-york/family-friendly" class="hover:text-teal-600">👨‍👩‍👧 Family Areas</a></li>
              <li><a href="/new-york/luxury-real-estate" class="hover:text-teal-600">🏙️ Luxury Real Estate</a></li>
              <li><a href="/new-york/nightlife-areas" class="hover:text-teal-600">🎉 Nightlife</a></li>
            </ul>
          </div>
        </div>
        <div class="text-center text-sm text-gray-400">
          <p>© ${new Date().getFullYear()} PlaceLabels — Crowd-sourced neighborhood intelligence</p>
          <p class="mt-1">Real insights from locals and visitors across 31 cities worldwide.</p>
        </div>
      </div>
    </footer>
  `;
}

export function ssrHtmlShell(opts: SSRPageOptions): string {
  const ogImage = opts.ogImage || "https://placelabels.com/og-image.png";

  const allSchemas: object[] = [JSON.parse(GLOBAL_SCHEMA)];
  if (opts.schemaJson) allSchemas.push(opts.schemaJson);
  if (opts.schemaJsons) allSchemas.push(...opts.schemaJsons);
  const schemaTags = allSchemas
    .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join("\n  ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#0d9488" />
  <title>${escapeHtml(opts.title)}</title>
  <meta name="description" content="${escapeHtml(opts.description)}" />
  <link rel="canonical" href="${escapeHtml(opts.canonical)}" />

  <meta property="og:title" content="${escapeHtml(opts.title)}" />
  <meta property="og:description" content="${escapeHtml(opts.description)}" />
  <meta property="og:url" content="${escapeHtml(opts.canonical)}" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="${escapeHtml(ogImage)}" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:site_name" content="PlaceLabels" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@placelabels" />
  <meta name="twitter:title" content="${escapeHtml(opts.title)}" />
  <meta name="twitter:description" content="${escapeHtml(opts.description)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImage)}" />

  ${schemaTags}

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="preload" as="style" href="${FONT_URL}" />
  <link rel="stylesheet" href="${FONT_URL}" media="print" onload="this.media='all'" />
  <noscript><link rel="stylesheet" href="${FONT_URL}" /></noscript>

  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { font-family: 'Inter', sans-serif; }
    body { background-color: #f9fafb; }
    a { color: #0d9488; }
    a:hover { color: #0f766e; }
  </style>
</head>
<body>
  ${headerHtml()}
  <main class="max-w-5xl mx-auto px-4 py-8">
    ${opts.bodyHtml}
  </main>
  ${footerHtml()}
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
