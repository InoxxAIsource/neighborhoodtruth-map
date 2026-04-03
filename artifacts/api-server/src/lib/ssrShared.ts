/**
 * Shared HTML shell for all SSR pages
 * Base template with consistent header, footer, and branding
 */

export interface SSRPageOptions {
  title: string;
  description: string;
  canonical: string;
  bodyHtml: string;
  ogImage?: string;
  breadcrumbs?: Array<{ label: string; url?: string }>;
  schemaJson?: object;
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
            <p class="font-semibold text-gray-900 text-sm mb-3">Browse Cities</p>
            <ul class="space-y-2 text-xs text-gray-600">
              <li><a href="/new-york" class="hover:text-teal-600">New York</a></li>
              <li><a href="/san-francisco" class="hover:text-teal-600">San Francisco</a></li>
              <li><a href="/los-angeles" class="hover:text-teal-600">Los Angeles</a></li>
              <li><a href="/london" class="hover:text-teal-600">London</a></li>
            </ul>
          </div>
          <div>
            <p class="font-semibold text-gray-900 text-sm mb-3">Asia</p>
            <ul class="space-y-2 text-xs text-gray-600">
              <li><a href="/mumbai" class="hover:text-teal-600">Mumbai</a></li>
              <li><a href="/delhi" class="hover:text-teal-600">Delhi</a></li>
              <li><a href="/bangalore" class="hover:text-teal-600">Bangalore</a></li>
              <li><a href="/tokyo" class="hover:text-teal-600">Tokyo</a></li>
            </ul>
          </div>
          <div>
            <p class="font-semibold text-gray-900 text-sm mb-3">More Cities</p>
            <ul class="space-y-2 text-xs text-gray-600">
              <li><a href="/hong-kong" class="hover:text-teal-600">Hong Kong</a></li>
              <li><a href="/seoul" class="hover:text-teal-600">Seoul</a></li>
              <li><a href="/istanbul" class="hover:text-teal-600">Istanbul</a></li>
              <li><a href="/mexico-city" class="hover:text-teal-600">Mexico City</a></li>
            </ul>
          </div>
          <div>
            <p class="font-semibold text-gray-900 text-sm mb-3">About</p>
            <ul class="space-y-2 text-xs text-gray-600">
              <li><a href="/" class="hover:text-teal-600">Home</a></li>
              <li><a href="https://placelabels.com" class="hover:text-teal-600">Back to Map</a></li>
            </ul>
          </div>
        </div>
        <div class="text-center text-sm text-gray-400">
          <p>© ${new Date().getFullYear()} PlaceLabels — Crowd-sourced neighborhood intelligence</p>
          <p class="mt-1">Data powered by real locals and visitors worldwide.</p>
        </div>
      </div>
    </footer>
  `;
}

export function ssrHtmlShell(opts: SSRPageOptions): string {
  const ogImage = opts.ogImage || "https://placelabels.com/og-default.jpg";
  const schemaTag = opts.schemaJson ? `<script type="application/ld+json">${JSON.stringify(opts.schemaJson)}</script>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(opts.title)}</title>
  <meta name="description" content="${escapeHtml(opts.description)}" />
  <meta property="og:title" content="${escapeHtml(opts.title)}" />
  <meta property="og:description" content="${escapeHtml(opts.description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="${escapeHtml(ogImage)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(opts.title)}" />
  <meta name="twitter:description" content="${escapeHtml(opts.description)}" />
  <link rel="canonical" href="${escapeHtml(opts.canonical)}" />
  ${schemaTag}
  
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
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
