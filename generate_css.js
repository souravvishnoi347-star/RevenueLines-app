const fs = require('fs');

const colors = {
  "tertiary-fixed": "#ffe089",
  "surface-variant": "#e1e3e4",
  "tertiary-container": "#cda725",
  "primary-fixed": "#a1eff7",
  "surface-container-highest": "#e1e3e4",
  "outline-variant": "#bec8c9",
  "error": "#ba1a1a",
  "on-background": "#191c1d",
  "on-secondary": "#ffffff",
  "on-tertiary-fixed-variant": "#574400",
  "surface-container-high": "#e7e8e9",
  "on-error-container": "#93000a",
  "primary-fixed-dim": "#85d3db",
  "secondary-fixed": "#dae2ff",
  "on-tertiary": "#ffffff",
  "on-secondary-container": "#fefcff",
  "on-primary-fixed": "#002022",
  "secondary": "#0053cf",
  "on-tertiary-container": "#4e3d00",
  "primary-container": "#006970",
  "on-secondary-fixed": "#001848",
  "inverse-primary": "#85d3db",
  "inverse-on-surface": "#f0f1f2",
  "text-primary": "#1A1C1E",
  "error-container": "#ffdad6",
  "background": "#f8f9fa",
  "outline": "#6f797a",
  "surface-dim": "#d9dadb",
  "on-primary-fixed-variant": "#004f54",
  "on-error": "#ffffff",
  "surface-container-low": "#f3f4f5",
  "primary": "#004f55",
  "surface-tint": "#006970",
  "tertiary": "#745b00",
  "surface-bright": "#f8f9fa",
  "tertiary-fixed-dim": "#ebc240",
  "secondary-container": "#306dec",
  "on-surface-variant": "#3f494a",
  "secondary-fixed-dim": "#b2c5ff",
  "electric-blue": "#0056D6",
  "on-primary-container": "#97e6ed",
  "surface-container": "#edeeef",
  "teal-accent": "#008B94",
  "surface-container-lowest": "#ffffff",
  "surface": "#f8f9fa",
  "on-surface": "#191c1d",
  "inverse-surface": "#2e3132",
  "prestige-gold": "#B38F00",
  "on-tertiary-fixed": "#241a00",
  "on-secondary-fixed-variant": "#0040a2",
  "on-primary": "#ffffff",
  "surface-gray": "#F1F3F4"
};

let css = `@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
`;

for (const [k, v] of Object.entries(colors)) {
  css += `  --color-${k}: ${v};\n`;
}

css += `
  --font-body-lg: Montserrat, sans-serif;
  --font-body-sm: Montserrat, sans-serif;
  --font-headline-lg: Montserrat, sans-serif;
  --font-body-md: Montserrat, sans-serif;
  --font-headline-lg-mobile: Montserrat, sans-serif;
  --font-label-caps: Montserrat, sans-serif;
  --font-display-lg: Montserrat, sans-serif;

  --spacing-unit: 8px;
  --spacing-container-max: 1280px;
  --spacing-gutter: 24px;
  --spacing-margin-mobile: 20px;
  --spacing-margin-desktop: 48px;
}

body {
  background: var(--color-background);
  color: var(--color-on-background);
}

.dark {
  /* Very basic inversion for dark mode just to make it not blinding */
  --color-background: #111318;
  --color-surface: #1e2024;
  --color-surface-container-lowest: #1a1c20;
  --color-surface-container: #282a2e;
  --color-surface-variant: #333539;
  --color-on-background: #e2e2e8;
  --color-on-surface: #e2e2e8;
  --color-on-surface-variant: #b9cacb;
  --color-outline-variant: #3b494b;
}

.glass-edge {
    border: 1px solid var(--color-outline-variant);
    background: var(--color-surface-container-lowest);
}
.ai-insight-edge {
    border: 1px solid var(--color-tertiary-container);
    background: var(--color-surface-container-lowest);
}
.btn-glow:hover {
    box-shadow: 0px 4px 20px rgba(0, 105, 112, 0.3);
}
`;

fs.writeFileSync('d:/Hostbolt/new me/revenueline-app/app/globals.css', css);
console.log('Updated globals.css');
