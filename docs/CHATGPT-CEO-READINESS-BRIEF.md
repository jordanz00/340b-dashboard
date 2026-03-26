# HAP 340B — CEO READY POLISH (CURSOR VERSION)

Use this document **as-is in ChatGPT or Cursor** to drive copy, hierarchy, UX, and performance goals. Paste the **Execution prompt** (§10) when asking an AI to rewrite sections.

---

## 1. MISSION

Build a **clear, credible, scannable advocacy experience**:

- What 340B is  
- Why it matters (state + national)  
- What the map shows  
- What HAP stands for  

**Constraints:**

- No jargon walls  
- No hype  
- No legal overreach  

---

## 2. TARGET STATE

| FROM | TO |
|------|-----|
| Dense policy copy | Executive-level clarity |
| Weak hierarchy | Strong **H1 → H2 → H3** hierarchy |
| Unclear UX | Guided, intuitive interactivity |
| Stats without meaning | Every stat **includes a one-line impact** (why it matters in context) |
| Amateur layout | **CNN-level** presentation: clean, confident, readable |

---

## 3. NON-NEGOTIABLES

- **Do NOT** invent laws, stats, or dates  
- **No legal advice**  
- **Plain English** (8th–10th grade reading level)  
- **Define once:** 340B, covered entity, contract pharmacy, PBM  
- **Consistent terminology** everywhere  
- **Every number** includes a **one-line impact** (concise relevance)  

---

## 4. COPY SYSTEM

### Voice

- Confident, neutral, **non-partisan**  
- **Association-grade** (not marketing fluff / not academic paper)  

**Audience:** CEO · Policymakers · Staff / comms  

### Page structure

**H1:** One **purpose-driven** title (not generic “Dashboard”).  

**H2 sections (suggested):**

- Overview  
- Map  
- Key Metrics  
- Community Impact  
- Policy Timeline  
- Methodology / Sources  

**Above the fold:**

- Headline  
- **1-line value prop**  
- **1 primary action**  

### Stats format

Each stat:

- **Label**  
- **Number**  
- **1-line meaning** (impact or relevance)  

**Example:**  

`23% savings` → *“Expands hospital capacity to serve more patients.”*  

**Always** tie to **data date** and **source / methodology** where shown.  

### Map UX

Must have:

- **1–2 line** “How to use”  
- **Plain-English legend**  
- Clear **interaction feedback** (selection, hover, focus)  
- **Friendly** empty / error states  

### Timeline (priority)

**Goal:** Broadcast-quality **(CNN-style)** · **Compact** (no horizontal scroll for core story) · **Highly interactive**  

**Rules:**

- **1-line headline** per era  
- **1-line explanation**  
- **Expand for detail** (optional)  
- **Smooth animations only** — no lag  

**Narrative flow:**  

1. Origin  
2. Expansion  
3. Conflict  
4. Current  
5. State action  

### Community impact

- **Lead:** patient outcomes  
- **Then:** hospital reinvestment  
- **No insider-only language**  
- **Simple** service labels  

### Methodology

- **Bullet summary first**  
- **Expandable** detail  
- Sources = **name + org + date** (not URL dumps without context)  

### CTA

- **ONE primary CTA** only  
- Examples: Contact HAP · View policy position  

---

## 5. VISUAL SYSTEM

- Consistent spacing rhythm  
- Clear type scale (title → section → body → caption)  
- **Minimal colors** — **one accent** for emphasis / selection  
- **Uniform card** structure  
- **Mobile-safe** — no horizontal scroll for main content  
- **Tap targets ≥ 44px** where interactive  

---

## 6. INTERACTIVITY

Each interaction:

- Has a **label** or **tooltip**  
- Has a **clear outcome**  

**Animations:** Support understanding · Smooth · **Respect `prefers-reduced-motion`**  

**Primary features:** Map · Timeline  

---

## 7. PERFORMANCE (CRITICAL)

**Do NOT remove design or effects** to improve speed.

**Instead:**

- Prefer **transform** + **opacity** (GPU-friendly)  
- **Avoid layout thrashing** (cache layout reads; don’t read `getBoundingClientRect` in hot scroll paths)  
- **Minimize scroll work** — coalesce with **requestAnimationFrame**, **passive** listeners  
- **Debounce / throttle** resize and non-critical work  
- **`will-change`** — **sparingly** (not on every tile)  

**Optimize for Chrome** (M1 as baseline).  

**Goal:** **Zero scroll stutter** with **full fidelity** visuals.  

---

## 8. FILES (repo)

| Area | Files |
|------|--------|
| Structure & copy | `340b.html`, `340b-BASIC.html` |
| Data & dates | `state-data.js` |
| Layout & screen | `340b.css` |
| Print | `print-view.css` |
| Map, filters, share, print | `340b.js` |
| BASIC-only nav | `hap-nav-shared.js` |

---

## 9. EXPERIENCE BAR

**Must feel like:**

- CEO briefing tool  
- Policy storytelling product  
- **Public flagship** experience  

**Must NOT feel like:**

- Prototype  
- Dev demo  
- Dense policy PDF pasted as HTML  

---

## 10. EXECUTION PROMPT (paste into ChatGPT)

```
Role: Editorial + UX strategist for a U.S. hospital association (340B advocacy).

Constraints:
- Do not invent laws, statistics, or dates. Flag anything that needs a verified source.
- Do not provide legal advice. Use briefing / advocacy framing only.
- Plain English; define 340B-related terms once (covered entity, contract pharmacy, PBM).
- Keep terminology consistent across the section.

For each section I paste:
1. Recommend H2/H3 hierarchy.
2. Rewrite copy (tight, scannable).
3. Add a one-line **impact** (or **why it matters**) for every stat or number.
4. Provide microcopy (buttons, tooltips, empty states) where relevant.
5. List jargon to remove or replace.

Optimize for: CEO readability, policy clarity, professional polish, strong hierarchy, purposeful interactivity, and performance-safe wording (no unnecessary reflows in copy length).
```

---

**End of brief** — file: `docs/CHATGPT-CEO-READINESS-BRIEF.md`
