// src/examples.ts

export type HtmlDiffExample = {
    id: string;
    label: string;
    original: string;
    modified: string;
};

export const examples: HtmlDiffExample[] = [
    {
        id: "safety-equipment",
        label: "Safety equipment list",
        original: `
<p>Safety equipment required:</p>
<ul>
  <li>Hard hat (Class G)</li>
  <li>Safety goggles</li>
  <li>Steel-toed boots</li>
</ul>
`,
        modified: `
<p>Safety equipment required:</p>
<ul>
  <li>Hard hat (Class E or G)</li>
  <li>Safety goggles (Anti-fog)</li>
</ul>
`,
    },
    {
        id: "fire-exit",
        label: "Fire exit procedure",
        original: `
<h2>Fire exit procedure</h2>
<ol>
  <li>Stay calm and do not run.</li>
  <li>Use the nearest exit.</li>
  <li>Do not use the elevators.</li>
</ol>
`,
        modified: `
<h2>Fire exit procedure</h2>
<ol>
  <li>Stay calm and walk quickly.</li>
  <li>Use the nearest marked exit.</li>
  <li>Do not use the elevators.</li>
  <li>Gather at the assembly point.</li>
</ol>
`,
    },
    {
        id: "concrete-mix",
        label: "Concrete mix specification",
        original: `
<p>Concrete mix specification:</p>
<ul>
  <li>Cement: C25/30</li>
  <li>Aggregate size: 10mm</li>
  <li>Slump: 80mm</li>
</ul>
`,
        modified: `
<p>Concrete mix specification:</p>
<ul>
  <li>Cement: C30/37</li>
  <li>Aggregate size: 10–14mm</li>
  <li>Slump: 80mm ± 20mm</li>
  <li>Admixture: Plasticizer (as per supplier recommendations)</li>
</ul>
`,
    },
];