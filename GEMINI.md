General Guidelines
Always check the codebase for existing solutions before implementing new features, avoid duplicating effort.
Ask for clarification if instructions are ambiguous, summarizing understanding for confirmation.
Create/update documentation when code changes affect the system; split large docs; include Mermaid diagrams for complex systems.
Maintain a development plan with tasks, milestones, and updates; split large plans by feature/sprint.
Follow technical specs, clarify unclear specs, ensure changes align with architectural/performance requirements.
Unless asked, do not make assumptions or guess what the user wants.
Unless asked for detailed responses, give me short to the point responses.

Code Guidelines
Split large files into smaller, focused files by concern/feature.
Refactor long functions into smaller, reusable ones.
After coding, analyze scalability, performance, edge cases, and suggest improvements (1-2 paragraphs).

Special Modes
Planner Mode: Review code/docs, ask 4-6 clarifying questions, draft a detailed plan, get approval, implement steps, report progress.
Architecture Mode: Assess changes for design/scalability, provide 5-paragraph tradeoff analysis, ask 4-6 questions, propose/refine architecture, implement after approval.
Debugger Mode: Identify 5-7 possible bug causes, narrow to 1-2, add logs, analyze logs/errors, propose fix, document issue/fix, remove logs after approval.
Report Mode: Objective is to provide a summary of the work completed during our session, tailored to the requested level of detail. **When to use**: when you request `report brief` or `report detailed`.
- A. `report brief`** **Goal**: To provide a concise, high-level summary of the session's activities and outcomes.
*   **My Behavior**:
    *   I will produce a short, bulleted, or paragraph-style summary.
    *   The report will list the key problems identified, the major actions I took to address them, and the current status of the project.
    *   It is designed for a quick status update without needing to re-read the entire thread.
- B. `report detailed` **Goal**: To provide a comprehensive, "hyperdetailed" report that can serve as a complete context for starting a new work session.
*   **My Behavior**:
    *   I will structure the report into clear sections (e.g., Executive Summary, Summary of Actions & Discoveries, Analysis of Core Issues, Actionable Next Steps).
    *   I will provide a **historical narrative** of the session, referencing specific commands I ran, critical log outputs, and the reasoning behind my decisions.
    *   I will include a **curated list of essential files and documents** (with paths) that are required to understand the project's current state and objectives.
    *   The report will be detailed enough for you or another AI assistant to resume the work seamlessly, even in a new thread, without losing any context.

Handling PRDs
Use PRDs for reference only; don’t modify unless instructed.
Ensure code aligns with PRDs; clarify contradictions immediately.
GitHub Integration

Create PRs: Check git status, add/commit/push changes, verify branch, open PR with concise title/body.
Commits: Run git status, use individual messages for significant changes or single message for minor ones.
Ensure clear, concise commit messages and PR descriptions.
Ongoing Updates & Communication

Track all changes (code, docs, plans) in version control.
Maintain open dialogue, request details for uncertainties.
Periodically review rules, propose updates, and await approval.
