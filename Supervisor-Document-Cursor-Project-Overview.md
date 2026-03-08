# Project Overview: How I Built the HAP Interactive Dashboards Using Cursor AI

**Prepared for:** [Supervisor Name]  
**From:** [Your Name]  
**Date:** [Date]

---

## What I'm Doing

I'm creating **interactive web dashboards** that turn HAP's policy and financial reports into visual, explorable experiences. Instead of relying only on PDFs and static documents, we can now offer legislators, hospital leaders, and the public tools they can click through, filter, and interact with—all in a browser, with no special software required.

### The Two Projects

1. **"Time to Act" Pennsylvania Hospitals Dashboard** — Based on the Oliver Wyman report on hospital financial sustainability. Users can see economic impact metrics, hospital financial health data, closure maps, and 2030 scenarios. They can also adjust policy levers (e.g., reimbursement, sequestration) and see how outcomes change.

2. **340B Drug Pricing Advocacy Dashboard** — An interactive U.S. map showing state-by-state 340B and contract pharmacy protections. Users can click states for details, see Pennsylvania's position, and understand the $7.95B in community benefits and 72 PA hospitals in the program.

---

## How I Made This

I used **Cursor**, an AI-powered code editor, to design and build these dashboards. Here's the workflow:

### 1. Defining the Goal
I started with the source material—the Oliver Wyman report text, the 340B state laws data (CSV), and HAP's messaging. I had to understand what the data meant, who the audience was, and what actions we wanted people to take.

### 2. Describing What I Wanted
In Cursor, I described what I needed in plain English—for example: "Create an interactive map of the U.S. where each state is clickable and shows its 340B protection status" or "Add a section with policy levers that let users toggle options and see updated outcomes." The AI suggested code, structure, and design patterns.

### 3. Iterating and Refining
I didn't accept the first output. I reviewed it for accuracy, brand alignment, and usability. I asked for changes: "Make the chart mobile-friendly," "Use HAP blue (#0066a1) for the primary color," "Add ARIA labels for accessibility." Each round of feedback improved the result.

### 4. Integrating Data and Brand
I connected the dashboards to real data (e.g., the 340B state laws CSV) and ensured HAP branding—colors, fonts, logo, tone—was consistent throughout. The AI helped with the technical implementation; I ensured it matched our standards.

---

## The Cursor Tools I Used

| Capability | What It Does | How I Used It |
|------------|--------------|---------------|
| **AI Chat** | Conversational assistant that understands code and context | Asked for HTML/CSS/JavaScript to build charts, maps, and interactive sections; got suggestions for structure and styling |
| **Inline Editing** | Edit code with natural-language instructions | Refined layouts, fixed bugs, and adjusted styles by describing what I wanted changed |
| **Codebase Awareness** | AI reads your project files | Referenced existing files so new sections matched the design system and data format |
| **Multi-file Editing** | Changes across several files at once | Updated styles, content, and structure across HTML, CSS, and data files in a single request |

---

## What This Required From Me

- **Domain knowledge** — Understanding hospital policy, 340B, and HAP's advocacy goals so the dashboards told the right story  
- **Editorial judgment** — Deciding what to highlight, what to simplify, and what to leave out  
- **Quality control** — Checking numbers, labels, and links for accuracy before anything goes out  
- **Design sense** — Guiding layout, hierarchy, and visual clarity so the dashboards feel professional and on-brand  
- **Learning to prompt effectively** — Knowing how to ask the AI for specific outcomes, when to be vague vs. precise, and when to push back on suggestions  

The AI didn't replace my role—it extended what I could accomplish with the skills and context I already have.

---

## What You're Seeing

- **index.html** — Interactive "Time to Act" dashboard (Oliver Wyman report)  
- **static.html** — Static version of the same content for simpler sharing  
- **340b.html** — 340B advocacy dashboard with interactive U.S. map  
- **340b-state-laws.csv** — Data source for the 340B dashboard  

All of these can be opened in a web browser. No server or special setup is required for local viewing.

---

## Next Steps I'm Considering

- Gather feedback from communications and advocacy on content and usability  
- Explore hosting options if we want to share these publicly or via link  
- Identify other reports or campaigns that could benefit from this format  
- Document the process so others on the team can learn the workflow  

---

I'm happy to walk you through the dashboards or the Cursor workflow in more detail whenever works for you.
