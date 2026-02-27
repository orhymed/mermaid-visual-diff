# Mermaid Visual Diff

A VS Code extension to visually compare Mermaid flowcharts in Markdown files between the Git HEAD (last commit) and your current uncommitted edits.

## Features

- **CodeLens Integration (New!):** Instantly see a clickable `🔍 Show Visual Diff` link directly above any Mermaid block in your editor.
- **Multi-Block Support (New!):** Automatically detects and diffs specific Mermaid blocks when you have multiple diagrams in a single file. (Also respects your cursor position when triggered via the Command Palette).
- Accurately parses and extracts Markdown Mermaid blocks (` ```mermaid ... ``` `).
- Generates a graphical diff rendered with Mermaid.js Webview:
  - **Side-by-Side View:** The view automatically separates the *Original Graph* from the computed *Visual Diff* to clearly demonstrate what changed.
  - **Added Nodes:** Highlighted with a green stroke and background (`fill:#e6ffed, stroke:#2ea043`).
  - **Removed Nodes:** Highlighted with a red dashed stroke and background (`fill:#ffebe9, stroke:#cf222e`).
  - **Unchanged Nodes:** Shown in a neutral gray color (`fill:#f6f8fa, stroke:#d0d7de`).
  - **Removed Connections:** Depicted as dashed arrow lines (`-.->`).

## How to use

1. Open any Markdown file containing a Mermaid flowchart (e.g. `graph TD` or `flowchart LR`) within a Git-tracked workspace.
2. Ensure the file has been committed at least once.
3. Make edits to the Mermaid diagram.
4. **Option A (Recommended):** Click the `🔍 Show Visual Diff` CodeLens link that appears just above your ` ```mermaid ` block!
5. **Option B:** Place your cursor inside the Mermaid block and run the command **`Mermaid: Show Visual Diff`** from the VS Code command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`).
6. A Webview panel will open beside your editor displaying the colored diff for that specific diagram.

## Requirements

- A workspace currently tracked by Git.
- The active Markdown file must contain at least one valid Mermaid flowchart block.

## Extension Settings

This extension contributes the following settings, allowing you to customize the color schema of the visual diff:

* `mermaid-visual-diff.addedColor`: Background color for added nodes/edges (default: `#e6ffed`)
* `mermaid-visual-diff.addedStroke`: Stroke color for added nodes/edges (default: `#2ea043`)
* `mermaid-visual-diff.removedColor`: Background color for removed nodes/edges (default: `#ffebe9`)
* `mermaid-visual-diff.removedStroke`: Stroke color for removed nodes/edges (default: `#cf222e`)

## Known Issues

- It strictly supports basic node/edge definitions within flowcharts (`graph` / `flowchart`). Complex diagrams (like sequence diagrams, gantt charts, or complex styling parameters natively defined on relationships) may not diff precisely.
- Removed edges simply revert to a dashed connection (`-.->`), ignoring their previous label or explicit connection line type.

## Release Notes

### 0.0.1
Initial release of Mermaid Visual Diff.

---

**Enjoy visualizing your diagram history!**
