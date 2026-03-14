# 100 Critical Choices — HAP 340B Dashboard

**Purpose:** Prioritized list of decisions to make the dashboard more effective for advocates in Harrisburg and D.C., reduce clutter, and position it as a must-use, shareable asset for HAP members.

---

## Policy Impact Simulator (1–20)

1. **Headline** — Use a question: "What happens if we protect the discount—or don't?" (Done.)
2. **Sub copy** — Plain language: "Tap a scenario. See how each path affects hospitals, pharmacies, and patients." (Done.)
3. **Scenario labels** — "Protect the discount everywhere" / "Keep today's mix" / "Weaken or remove protections" instead of jargon. (Done.)
4. **Takeaways** — One line per scenario: Best / Today's reality / Worst outcome. (Done.)
5. **Badge** — "Advocacy tool" so it reads as a utility, not just content. (Done.)
6. **Result cards** — Labels in plain language: "Hospital–pharmacy partnerships," "Patient access to affordable meds." (Done.)
7. **Rollback styling** — Accent color when "Weaken or remove" is selected so risk is obvious. (Done.)
8. **Expand styling** — Primary color for "Protect everywhere" so best outcome is obvious. (Done.)
9. **Narrative block** — Short, scannable sentences; no jargon. (Done.)
10. **Pharmacy note** — Explain what the number means: "Hospitals could partner with this many pharmacies…" (Done.)
11. Consider adding a "Use in talking points" or "Copy for email" one-liner per scenario.
12. Consider a simple animation when switching scenarios (e.g. brief fade or slide).
13. Consider a "Share this scenario" link that copies a one-liner to clipboard.
14. Ensure mobile: buttons stack, cards stack, no horizontal scroll.
15. Consider an optional "Print this scenario" for handouts.
16. Add aria-live so screen readers announce scenario change.
17. Consider a one-sentence "So what?" under each scenario for the busiest readers.
18. Keep scenario keys stable (EXPAND / CURRENT / REMOVE) for any future API or export.
19. Consider adding a footnote: "Estimates for advocacy storytelling; not predictive."
20. Test with a non-policy person: can they explain the three options in one sentence each?

---

## Layman's terms & jargon (21–45)

21. **340B** — First use: "340B is a federal discount drug program." (Done.)
22. **Contract pharmacy** — Where helpful, say "hospital–pharmacy partnerships" or "community pharmacies that work with hospitals." (Done in key spots.)
23. **Protection** — Prefer "protects the discount" or "state law that protects the discount." (Done.)
24. **Executive strip** — "What we're fighting for" / "Where things stand" / "Why trust this" instead of "Policy priority" / "National landscape." (Done.)
25. **Key findings** — "The numbers that matter" and plain-language bullets. (Done.)
26. **Map hero** — "Who protects the 340B discount—and who doesn’t." (Done.)
27. **Map legend** — "Blue = state protects the discount. Gray = no state law yet." (Done.)
28. **Bottom line** — One sentence that a lawmaker can repeat. (Done in exec takeaway.)
29. **HAP asks** — One short sentence: "Protect the 340B discount so hospitals can keep expanding care." (Done.)
30. **Selection summary** — "Click a state… to see the details." (Done.)
31. Replace "enacted contract pharmacy protection" with "protect the discount" or "state law protecting the discount" where it repeats.
32. Replace "program integrity" with "protect the discount" or "fair rules for the program" in user-facing copy.
33. Replace "patient access" with "patients get affordable meds" or "patient access to affordable meds" where clearer.
34. In methodology, keep source names but shorten sentences (e.g. "Protection status as of March 2025"). (Done.)
35. PA Impact section: use "discount" and "hospitals/patients" instead of "340B program status" where possible.
36. Community benefit: "what hospitals give back" or "benefits to the community" in one intro line.
37. Avoid "stakeholders," "levers," "landscape" in body copy; use "hospitals," "patients," "states," "what we're fighting for."
38. One-sentence definition of 340B in the first card. (Done: subtitle.)
39. One-sentence "Why it matters" near the top (e.g. in exec takeaway). (Done.)
40. Verify every heading can be understood by someone who has never heard of 340B.
41. Add a "Glossary" or "Terms" expandable section for 340B, contract pharmacy, protection (optional).
42. Share description (og:description, etc.): include "federal discount drug program" and "72 PA hospitals." (Check meta.)
43. Print/PDF: ensure first page has one clear "ask" in layman's terms.
44. PA Impact scenario labels: align with simulator language (protect / today's mix / weaken).
45. Footer or methodology: one line "Questions? Contact HAP" with link.

---

## Declutter & hierarchy (46–65)

46. **One idea per section** — Each block has one main message. (Tightened.)
47. **Key findings** — Four bullets max; no repeated stats elsewhere. (Done.)
48. **Executive strip** — Three cards, one headline + one short note each. (Done.)
49. **Exec takeaway** — One "Bottom line" sentence; remove if redundant with strip. (Kept as single sentence.)
50. **Map** — Headline + one sub line + legend; no long paragraph. (Done.)
51. **Selection summary** — Short label "State" + title + one line of instruction. (Done.)
52. Remove duplicate explanations of "what 340B is" (keep one in first card). (Done.)
53. Trim methodology to essentials: sources, order, date. (Shortened in copy.)
54. Print source summary: one short paragraph. (Shortened.)
55. Avoid "Key findings" and "Key takeaway" and "Executive scan" all at once; simplify labels. (Renamed to "The numbers that matter," "Bottom line," strip labels.)
56. State list: "States with protection" / "No protection law" — keep; ensure counts are clear. (Done.)
57. KPI strip: four numbers only; no extra sentence unless necessary. (Keep as is.)
58. PA Impact: one headline, scenario buttons, results; trim narrative if long. (Already compact.)
59. Community benefit: one hero number + short list; no wall of text. (Audit.)
60. Reduce "Learn more" or "See below" links that don't add info. (Audit.)
61. Footer: minimal links (Contact, 340B page); remove redundant nav. (Audit.)
62. Ensure consistent spacing between sections (e.g. --space-6 or --space-8) so the page breathes. (Simulator has more margin.)
63. Consider collapsing "About this data" by default so first-time users aren't overwhelmed. (Already details/summary.)
64. One primary CTA per view: e.g. "Share" or "Print" prominent; secondary actions grouped. (Audit.)
65. Remove any "placeholder" or "Lorem" or outdated draft text. (Audit.)

---

## Style & "asset" feel (66–80)

66. **Simulator** — Card stands out: badge, gradient, stronger shadow, clear scenario styling. (Done.)
67. **Primary actions** — Share and Print/PDF visible; styled as primary actions. (Audit.)
68. **Typography** — Clear hierarchy: one hero headline per section, one sub line. (Done for simulator and key sections.)
69. **Color** — Blue = HAP/protection; accent for risk/alert; gray for neutral. (Consistent.)
70. **Cards** — Consistent radius, shadow, padding; simulator card slightly elevated. (Done.)
71. **Spacing** — More space above/below simulator so it feels like a feature. (Done.)
72. **Mobile** — All sections stack; buttons and links thumb-friendly. (Audit.)
73. **Print/PDF** — First page looks like a one-pager an advocate can hand to a lawmaker. (Do not change print logic; content only.)
74. Consider a very short "HAP Advocacy Dashboard" tagline in the header. (Audit.)
75. Consider a subtle background pattern or gradient for the hero area only. (Optional.)
76. Ensure "Last updated" and data freshness are visible but not dominant. (Audit.)
77. Favicon and og:image: professional (HAP logo or dashboard thumbnail). (Audit.)
78. No comic sans, no playful fonts; professional and approachable. (Already.)
79. Ensure contrast for "At risk" and badge text (WCAG AA). (Audit.)
80. Simulator: ensure the "Advocacy tool" badge doesn't wrap awkwardly on small screens. (Done with small font.)

---

## Usefulness & shareability (81–95)

81. **Share link** — Pre-filled with state when a state is selected so shared link opens to that state. (Already.)
82. **Print** — One click to print-friendly view; no extra steps. (Already.)
83. **Download PDF** — One click to PDF image for email or handout. (Already; do not change.)
84. **Simulator** — Clear enough that an advocate can say "Look, if we protect the discount everywhere, this is what we get" and show the screen. (Done with plain-language scenarios.)
85. **Map** — Click state → immediate summary; usable in a meeting. (Already.)
86. **Talking points** — Consider a short "Talking points" section or doc that mirrors simulator takeaways. (Optional.)
87. **Email subject** — Suggest a subject when sharing: e.g. "340B state map – [State]". (Optional.)
88. **QR code** — Optional: QR to dashboard for handouts. (Optional.)
89. **State one-pager** — Optional: "Print this state" that prints only the selected state's summary. (Future.)
90. Ensure all key numbers (21, 29, 72, $7.95B, 7%) are consistent everywhere. (Done; initial HTML synced.)
91. Document "How to use this in a meeting" in NOVICE-MAINTAINER or a one-pager. (Optional.)
92. Ensure dashboard works on tablets used in capitol meetings. (Audit.)
93. Consider a "Copy summary" that copies a two-line state summary to clipboard. (Optional.)
94. Ensure share URL is short and readable (no long query strings). (Already hash-based.)
95. Add optional analytics (e.g. which states are viewed most) only if approved and privacy-safe. (Optional.)

---

## Technical & maintenance (96–100)

96. **Protected systems** — Do not change print.html, downloadPdfAsImage(), preparePrintSnapshot(), openPrintView(), map SVG, or .map-wrap overflow. (Documented.)
97. **Initial HTML** — Keep 340b.html initial content in sync with state-data.js and computed counts so nothing pops on load. (Documented in NOVICE-MAINTAINER.)
98. **CONFIG** — Single source of truth in state-data.js; inline fallback in 340b.html kept in sync. (Done.)
99. **State counts** — When STATE_340B changes, update 21/29 in HTML and executive landscape line. (Documented.)
100. **ChatGPT handoff** — After each big update, update the handoff doc so the next session knows what's done and what's off-limits. (Done in CHATGPT-HANDOFF-AFTER-LAYMAN-UPDATE.md.)

---

*Use this list for the next design or content pass. Tick items as done; add new choices as the product evolves.*
