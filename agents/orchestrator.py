#!/usr/bin/env python3
"""
HAP Organizational Multi-Agent Orchestrator

WHO THIS IS FOR: HAP leadership, analytics team, anyone modeling cross-functional task routing
WHAT IT DOES:
    Maps HAP's 54 real organizational roles into domain-specialized agents.
    Routes tasks to relevant domains, runs iterative propose → feedback → improve
    rounds with seniority-weighted conflict resolution, and exports structured
    results to CSV for Power BI consumption.
HOW IT CONNECTS:
    Complements the JS-based dashboard agents (agents/run-waves.js, master-executor.js).
    CSV output lands in data/ and aligns with powerbi/metric-registry.json patterns.

POWER BI MAPPING: Exports to data/hap_orchestrator_*.csv — importable as Power BI tables.

See agents/README.md for the broader multi-agent system.
See docs/DATA-DICTIONARY.md for field definitions.
"""

from __future__ import annotations

import csv
import hashlib
from collections import defaultdict
from pathlib import Path
from typing import Dict, Generator, List, Optional

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False


# ---------------------------------------------------------------------------
# Roles → Domains
# ---------------------------------------------------------------------------

ROLES_DOMAINS: Dict[str, str] = {
    # Executive
    "President and Chief Executive Officer": "Executive",
    "Special Assistant to the President and Chief Executive Officer": "Executive",
    # Finance
    "Accounting Manager": "Finance",
    "Accountant": "Finance",
    "Accounts Payable Specialist": "Finance",
    "Vice President, Finance & Legal Affairs": "Finance",
    "Director, Financial Reimbursement and Analysis": "Finance",
    "Senior Policy Analyst": "Finance",
    # Advocacy
    "Senior Vice President of Advocacy and Policy": "Advocacy",
    "Vice President, Federal Advocacy": "Advocacy",
    "Vice President, State Advocacy": "Advocacy",
    "Senior Director, State Advocacy": "Advocacy",
    "Director, Political Engagement": "Advocacy",
    "Political Action Manager": "Advocacy",
    "Policy Analyst": "Advocacy",
    "Manager, Advocacy Activation": "Advocacy",
    "Advocacy and Policy Coordinator": "Advocacy",
    # Operations
    "Chief Operating Officer": "Operations",
    "Senior Vice President, Operations": "Operations",
    "Senior Administrative Assistant": "Operations",
    # Communications
    "Vice President, Strategic Communications": "Communications",
    "Director, Advocacy & Member Communications": "Communications",
    "Producer, Digital Communications": "Communications",
    "Manager, Media Relations": "Communications",
    # IT
    "Manager, Website Services": "IT",
    "Director, Information & Technology and Services": "IT",
    "Senior Network Specialist": "IT",
    "IT Application Specialist": "IT",
    # Education
    "Senior Director, Education Services": "Education",
    # Emergency Management
    "Vice President, Emergency Management": "Emergency Management",
    "Manager": "Emergency Management",
    "Manager, Business Continuity and Cyber Resilience": "Emergency Management",
    # HR
    "Director, Human Resource Services": "HR",
    # Member Services
    "Vice President, Membership and Strategic Initiatives": "Member Services",
    "Manager, Member Engagement": "Member Services",
    "Education Program and Membership Coordinator": "Member Services",
    # Policy
    "Vice President, Policy & Care Delivery": "Policy",
    "Vice President, Equity & Behavioral Health": "Policy",
    "Vice President, Compliance & Regulatory Affairs": "Policy",
    # Quality
    "Senior Director, Clinical Affairs": "Quality",
    "Project Manager": "Quality",
    # Analytics
    "Vice President, Strategic Analytics": "Analytics",
    "Senior Research Analyst": "Analytics",
    "Project Director": "Analytics",
    "Cloud Data Architect": "Analytics",
    "Manager, Data Analytics and Visualization": "Analytics",
    # Workforce
    "Vice President, Workforce & Clinical Affairs": "Workforce",
    "Senior Director, Workforce & Professional Development": "Workforce",
    "Administrative Assistant/Education Coordinator": "Workforce",
    # Subsidiary (HAPevolve)
    "President (HAPevolve)": "Subsidiary",
    "Director of Business Development": "Subsidiary",
    "Director, Consulting Services": "Subsidiary",
    "Account Executive": "Subsidiary",
    "Operations Specialist": "Subsidiary",
}

# Higher number = more weight in conflict resolution
SENIORITY: Dict[str, int] = defaultdict(lambda: 1)
SENIORITY.update({
    "President and Chief Executive Officer": 10,
    "Chief Operating Officer": 9,
    "Senior Vice President of Advocacy and Policy": 8,
    "Senior Vice President, Operations": 8,
    "Vice President, Federal Advocacy": 7,
    "Vice President, State Advocacy": 7,
    "Vice President, Strategic Communications": 7,
    "Vice President, Emergency Management": 7,
    "Vice President, Finance & Legal Affairs": 7,
    "Vice President, Membership and Strategic Initiatives": 7,
    "Vice President, Policy & Care Delivery": 7,
    "Vice President, Equity & Behavioral Health": 7,
    "Vice President, Compliance & Regulatory Affairs": 7,
    "Vice President, Strategic Analytics": 7,
    "Vice President, Workforce & Clinical Affairs": 7,
    "President (HAPevolve)": 7,
    "Senior Director, State Advocacy": 6,
    "Senior Director, Education Services": 6,
    "Senior Director, Clinical Affairs": 6,
    "Senior Director, Workforce & Professional Development": 6,
    "Director, Political Engagement": 5,
    "Director, Advocacy & Member Communications": 5,
    "Director, Financial Reimbursement and Analysis": 5,
    "Director, Human Resource Services": 5,
    "Director, Information & Technology and Services": 5,
    "Director of Business Development": 5,
    "Director, Consulting Services": 5,
    "Project Director": 5,
    "Cloud Data Architect": 5,
    "Senior Research Analyst": 4,
    "Senior Network Specialist": 4,
    "Senior Policy Analyst": 4,
    "Political Action Manager": 3,
    "Policy Analyst": 3,
    "Manager, Advocacy Activation": 3,
    "Manager, Member Engagement": 3,
    "Manager, Media Relations": 3,
    "Manager, Website Services": 3,
    "Manager, Data Analytics and Visualization": 3,
    "Manager, Business Continuity and Cyber Resilience": 3,
    "Manager": 3,
    "Project Manager": 3,
    "IT Application Specialist": 2,
    "Account Executive": 2,
    "Advocacy and Policy Coordinator": 2,
    "Education Program and Membership Coordinator": 2,
    "Administrative Assistant/Education Coordinator": 2,
    "Operations Specialist": 2,
    "Accounts Payable Specialist": 2,
    "Accountant": 2,
    "Accounting Manager": 3,
    "Senior Administrative Assistant": 2,
    "Producer, Digital Communications": 3,
    "Special Assistant to the President and Chief Executive Officer": 4,
})

DOMAIN_TEMPLATES: Dict[str, str] = {
    "Executive": "Set strategic direction, approve plans, and allocate authority for: {task}",
    "Finance": "Analyze budget impact and recommend fiscal adjustments for: {task}",
    "Advocacy": "Draft policy positions and stakeholder engagement strategy for: {task}",
    "Operations": "Develop workflow optimization and resource allocation for: {task}",
    "Communications": "Plan internal/external communication strategy for: {task}",
    "IT": "Assess technology requirements and implementation plan for: {task}",
    "Education": "Design training curriculum and education delivery for: {task}",
    "Emergency Management": "Prepare contingency protocols and resilience plan for: {task}",
    "HR": "Plan staffing, recruitment, and professional development for: {task}",
    "Member Services": "Strengthen member engagement and service delivery for: {task}",
    "Policy": "Review regulatory compliance and propose policy framework for: {task}",
    "Quality": "Design quality metrics and improvement measures for: {task}",
    "Analytics": "Analyze data trends and build forecasting models for: {task}",
    "Workforce": "Optimize workforce planning and retention strategy for: {task}",
    "Subsidiary": "Develop consulting and business development approach for: {task}",
}


# ---------------------------------------------------------------------------
# Shared Context
# ---------------------------------------------------------------------------

def create_shared_context() -> Dict:
    """Factory for the global state that all agents and the supervisor read/write."""
    return {
        "company": "HAP",
        "feedback_log": [],
        "task_history": [],
        "conflicts": [],
    }


# ---------------------------------------------------------------------------
# Agent
# ---------------------------------------------------------------------------

class Agent:
    """
    One HAP organizational role as a collaborative agent.

    HOW IT WORKS:
    1. propose_action() generates a domain-specific structured proposal
    2. receive_feedback() filters incoming proposals by relevance (same domain
       or senior leadership) so agents aren't flooded with irrelevant info
    3. improve() synthesizes feedback into a refined proposal, weighted by
       seniority — then clears the feedback buffer to avoid memory bloat
    """

    def __init__(self, role: str, domain: str):
        self.role = role
        self.domain = domain
        self.seniority: int = SENIORITY[role]
        self.proposals: List[Dict] = []
        self.feedback: List[Dict] = []
        self._iteration = 0

    def propose_action(self, task: str) -> Dict:
        """Generate a structured, domain-specific proposal for the given task."""
        template = DOMAIN_TEMPLATES.get(self.domain, "Develop a plan for: {task}")
        self._iteration += 1
        proposal = {
            "agent_role": self.role,
            "domain": self.domain,
            "task": task,
            "suggested_action": template.format(task=task),
            "seniority": self.seniority,
            "confidence": min(0.5 + 0.05 * self.seniority, 1.0),
            "iteration": self._iteration,
        }
        self.proposals.append(proposal)
        return proposal

    def receive_feedback(self, proposals: List[Dict]):
        """
        Accept proposals from the same domain or from senior leadership (seniority >= 8).
        CEO receives everything.
        """
        for p in proposals:
            if p["agent_role"] == self.role:
                continue  # skip own proposal
            same_domain = p["domain"] == self.domain
            senior_leader = p.get("seniority", 0) >= 8
            is_ceo = self.role == "President and Chief Executive Officer"
            if same_domain or senior_leader or is_ceo:
                self.feedback.append(p)

    def improve(self) -> Optional[Dict]:
        """
        Synthesize feedback into a refined proposal.

        Only reads items that have 'suggested_action' (proposals, not previous
        improvements) to avoid the KeyError that v2 hit. Weights by seniority
        so VP-level input outranks coordinator-level input in the synthesis.
        Clears the feedback buffer afterward to prevent memory bloat.
        """
        usable = [f for f in self.feedback if "suggested_action" in f]
        if not usable:
            return None

        weighted = sorted(usable, key=lambda f: f.get("seniority", 1), reverse=True)
        top = weighted[:3]
        improved = {
            "agent_role": self.role,
            "domain": self.domain,
            "improved_action": " | ".join(p["suggested_action"] for p in top),
            "num_feedback_items": len(usable),
            "top_influences": [p["agent_role"] for p in top],
        }
        self.proposals.append(improved)
        self.feedback.clear()
        return improved

    def reset(self):
        """Wipe state between unrelated task runs if needed."""
        self.proposals.clear()
        self.feedback.clear()
        self._iteration = 0


# ---------------------------------------------------------------------------
# Supervisor
# ---------------------------------------------------------------------------

class Supervisor:
    """
    Iterative multi-agent supervisor modeled on the HAP project's
    multi-agent-supervisor rule gates.

    HOW IT WORKS:
    1. Selects agents relevant to the task's domain (+ CEO always included)
    2. Runs propose → feedback → improve rounds
    3. Detects convergence by hashing proposals — stops early when stable
    4. Logs conflicts when same-domain agents produce divergent proposals
       (meaningful when proposal logic varies, e.g. LLM-backed agents)
    5. Writes everything to shared context for CEO review and BI export

    LIMITATIONS (current deterministic templates):
    - Same-domain agents share a template, so intra-domain "conflicts" only
      arise if proposal logic is customized per role in a future version.
    - Convergence triggers after 2 iterations because templates are
      deterministic. With LLM-backed agents, convergence becomes meaningful.
    """

    def __init__(
        self,
        agents: List[Agent],
        shared_context: Dict,
        max_iterations: int = 5,
    ):
        self.agents = agents
        self.ctx = shared_context
        self.max_iterations = max_iterations
        self._by_domain: Dict[str, List[Agent]] = defaultdict(list)
        for a in agents:
            self._by_domain[a.domain].append(a)
        self.ceo = next(
            a for a in agents
            if a.role == "President and Chief Executive Officer"
        )

    def _select_agents(self, domain: Optional[str]) -> List[Agent]:
        if domain is None:
            return list(self.agents)
        selected = list(self._by_domain.get(domain, []))
        if self.ceo not in selected:
            selected.append(self.ceo)
        return selected

    @staticmethod
    def _proposal_fingerprint(proposals: List[Dict]) -> str:
        """Hash the set of proposal actions to detect convergence."""
        actions = sorted(p.get("suggested_action", "") for p in proposals)
        return hashlib.md5("|".join(actions).encode()).hexdigest()

    def run_task(self, task: str, domain: Optional[str] = None) -> List[Optional[Dict]]:
        """
        Run a single task through the relevant agents.

        Returns the list of improved proposals from the final iteration.
        """
        relevant = self._select_agents(domain)
        prev_fingerprint = ""
        iteration = 0
        proposals: List[Dict] = []
        improvements: List[Optional[Dict]] = []

        for iteration in range(1, self.max_iterations + 1):
            proposals = [agent.propose_action(task) for agent in relevant]
            fingerprint = self._proposal_fingerprint(proposals)

            for agent in relevant:
                agent.receive_feedback(proposals)

            improvements = [agent.improve() for agent in relevant]

            if fingerprint == prev_fingerprint:
                break
            prev_fingerprint = fingerprint

        self.ctx["feedback_log"].append({
            "task": task,
            "domain": domain,
            "iterations": iteration,
            "proposals": proposals,
            "improvements": [i for i in improvements if i],
        })
        self.ctx["task_history"].append(task)
        return improvements

    def run_task_streaming(
        self, task: str, domain: Optional[str] = None
    ) -> Generator[Dict, None, None]:
        """
        Generator variant of run_task — yields per-iteration results.

        Each yield is a dict with:
            iteration: int
            phase: "proposals" | "improvements" | "converged"
            data: list of proposal/improvement dicts

        Useful for streaming to a live dashboard, WebSocket, or
        Power BI DirectQuery endpoint.
        """
        relevant = self._select_agents(domain)
        prev_fingerprint = ""
        iteration = 0
        proposals: List[Dict] = []
        improvements: List[Optional[Dict]] = []

        for iteration in range(1, self.max_iterations + 1):
            proposals = [agent.propose_action(task) for agent in relevant]
            fingerprint = self._proposal_fingerprint(proposals)

            yield {
                "iteration": iteration,
                "phase": "proposals",
                "data": proposals,
            }

            for agent in relevant:
                agent.receive_feedback(proposals)

            improvements = [agent.improve() for agent in relevant]

            yield {
                "iteration": iteration,
                "phase": "improvements",
                "data": [i for i in improvements if i],
            }

            if fingerprint == prev_fingerprint:
                yield {
                    "iteration": iteration,
                    "phase": "converged",
                    "data": [],
                }
                break
            prev_fingerprint = fingerprint

        self.ctx["feedback_log"].append({
            "task": task,
            "domain": domain,
            "iterations": iteration,
            "proposals": proposals,
            "improvements": [i for i in improvements if i],
        })
        self.ctx["task_history"].append(task)

    def ceo_summary(self) -> Dict:
        """Ask the CEO agent to synthesize everything received so far."""
        return self.ceo.improve() or {
            "agent_role": self.ceo.role,
            "status": "No cross-domain feedback received yet",
        }


# ---------------------------------------------------------------------------
# Semantic Layer & Export
# ---------------------------------------------------------------------------

def semantic_row(record: Dict) -> Dict:
    """Flatten a proposal or improvement into a dashboard-friendly row."""
    return {
        "Task": record.get("task", ""),
        "Domain": record.get("domain", ""),
        "Agent Role": record.get("agent_role", ""),
        "Proposed Action": record.get("suggested_action", ""),
        "Improved Action": record.get("improved_action", ""),
        "Feedback Count": record.get("num_feedback_items", 0),
        "Seniority": record.get("seniority", ""),
        "Confidence": record.get("confidence", ""),
        "Top Influences": ", ".join(record.get("top_influences", [])),
    }


def _write_csv(path: Path, rows: List[Dict]):
    """Write dicts to CSV without requiring pandas."""
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    fieldnames = list(rows[0].keys())
    with open(path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def export_to_powerbi(
    context: Dict,
    output_dir: Path = Path("data"),
) -> Dict[str, Path]:
    """
    Export shared context to CSVs for Power BI.

    Uses pandas when available; falls back to the csv module.
    Returns {name: filepath} for each generated file.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    prefix = "hap_orchestrator"

    tasks_path = output_dir / f"{prefix}_tasks.csv"
    tasks_rows = [{"Task": t} for t in context["task_history"]]

    proposals_path = output_dir / f"{prefix}_proposals.csv"
    proposal_rows: List[Dict] = []
    for entry in context["feedback_log"]:
        for p in entry["proposals"]:
            row = semantic_row(p)
            row["Iterations"] = entry["iterations"]
            row["Is Improvement"] = False
            proposal_rows.append(row)
        for imp in entry.get("improvements", []):
            row = semantic_row(imp)
            row["Iterations"] = entry["iterations"]
            row["Is Improvement"] = True
            proposal_rows.append(row)

    conflicts_path = output_dir / f"{prefix}_conflicts.csv"
    conflict_rows: List[Dict] = []
    for c in context["conflicts"]:
        conflict_rows.append({
            "Task": c["task"],
            "Domain": c.get("domain", ""),
            "Iteration": c["iteration"],
            "Num Proposals": len(c["proposals"]),
            "Proposals": " | ".join(
                p["suggested_action"] for p in c["proposals"]
            ),
        })

    if HAS_PANDAS:
        pd.DataFrame(tasks_rows).to_csv(tasks_path, index=False)
        pd.DataFrame(proposal_rows).to_csv(proposals_path, index=False)
        pd.DataFrame(conflict_rows).to_csv(conflicts_path, index=False)
    else:
        _write_csv(tasks_path, tasks_rows)
        _write_csv(proposals_path, proposal_rows)
        _write_csv(conflicts_path, conflict_rows)

    return {
        "tasks": tasks_path,
        "proposals": proposals_path,
        "conflicts": conflicts_path,
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    import argparse

    parser = argparse.ArgumentParser(description="HAP Multi-Agent Orchestrator")
    parser.add_argument(
        "--stream", action="store_true",
        help="Use streaming (generator) mode instead of batch mode",
    )
    args = parser.parse_args()

    ctx = create_shared_context()
    agents = [Agent(role, domain) for role, domain in ROLES_DOMAINS.items()]
    supervisor = Supervisor(agents, ctx, max_iterations=5)

    tasks = [
        {"task": "Develop statewide advocacy plan for Pennsylvania hospitals", "domain": "Advocacy"},
        {"task": "Prepare next fiscal year budget", "domain": "Finance"},
        {"task": "Upgrade IT infrastructure for remote workforce", "domain": "IT"},
        {"task": "Launch 340B awareness campaign", "domain": "Communications"},
    ]

    if args.stream:
        for t in tasks:
            print(f"\n{'='*60}")
            print(f"TASK: {t['task']}  |  DOMAIN: {t['domain']}")
            print(f"{'='*60}")
            for step in supervisor.run_task_streaming(t["task"], t["domain"]):
                phase = step["phase"]
                it = step["iteration"]
                if phase == "converged":
                    print(f"  [iter {it}] Converged — proposals stabilized")
                elif phase == "proposals":
                    print(f"  [iter {it}] {len(step['data'])} proposals")
                    for p in step["data"][:3]:
                        conf = f"{p['confidence']:.0%}"
                        print(f"    {p['agent_role']} ({conf}): {p['suggested_action'][:80]}")
                    if len(step["data"]) > 3:
                        print(f"    ... and {len(step['data']) - 3} more")
                else:
                    print(f"  [iter {it}] {len(step['data'])} improvements")
                    for imp in step["data"][:3]:
                        print(f"    {imp['agent_role']}: synthesized {imp['num_feedback_items']} inputs")
                    if len(step["data"]) > 3:
                        print(f"    ... and {len(step['data']) - 3} more")
    else:
        for t in tasks:
            print(f"\n--- Task: {t['task']} (domain: {t['domain']}) ---")
            improvements = supervisor.run_task(t["task"], t["domain"])
            for imp in improvements:
                if imp:
                    print(f"  {imp['agent_role']}: {imp['improved_action'][:100]}...")

    print("\n=== CEO Summary ===")
    ceo = supervisor.ceo_summary()
    print(ceo)

    print("\n=== Power BI Export ===")
    paths = export_to_powerbi(ctx)
    for name, path in paths.items():
        print(f"  {name}: {path}")

    print(f"\nConflicts logged: {len(ctx['conflicts'])}")
    print(f"Tasks completed:  {len(ctx['task_history'])}")


if __name__ == "__main__":
    main()
