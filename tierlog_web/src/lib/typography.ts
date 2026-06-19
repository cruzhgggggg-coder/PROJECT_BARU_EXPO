export const typography = {
  // Display — Hero text, large headings
  display: "text-5xl md:text-7xl font-black tracking-tight text-tier-text-primary",
  
  // H1 — Page titles
  h1: "text-3xl md:text-4xl font-bold tracking-tight text-tier-text-primary",
  
  // H2 — Section titles
  h2: "text-2xl md:text-3xl font-bold tracking-tight text-tier-text-primary",
  
  // H3 — Card titles, subsections
  h3: "text-xl font-semibold text-tier-text-primary",
  
  // H4 — Small headings
  h4: "text-lg font-semibold text-tier-text-primary",
  
  // Body — Main reading text
  body: "text-base font-medium leading-relaxed text-tier-text-secondary",
  
  // Body Large — Emphasized body text
  bodyLarge: "text-lg font-medium leading-relaxed text-tier-text-secondary",
  
  // Small — Supporting text
  small: "text-sm font-medium text-tier-text-secondary",
  
  // Caption — Timestamps, metadata
  caption: "text-xs font-medium text-tier-text-tertiary",
  
  // Label — Section labels, badge text
  label: "text-xs font-bold uppercase tracking-widest text-tier-text-tertiary",
  
  // Gradient Text — Hero emphasis
  gradient: "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-rose-400",
} as const;
