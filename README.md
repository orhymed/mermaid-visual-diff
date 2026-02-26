# Mermaid Visual Diff

A VS Code extension to visually compare Mermaid flowcharts in Markdown files between the Git HEAD (last commit) and your current uncommitted edits.

## Features

- Right from your Markdown editor, you can invoke a single command to see exactly what changed in your Mermaid diagrams.
- Accurately parses and extracts the first Markdown Mermaid block (` ```mermaid ... ``` `).
- Generates a side-by-side graphical diff rendered with Mermaid.js Webview:
  - **Added Nodes:** Highlighted with a green stroke and background (`fill:#e6ffed, stroke:#2ea043`).
  - **Removed Nodes:** Highlighted with a red dashed stroke and background (`fill:#ffebe9, stroke:#cf222e`).
  - **Unchanged Nodes:** Shown in a neutral gray color (`fill:#f6f8fa, stroke:#d0d7de`).
  - **Removed Connections:** Depicted as dashed arrow lines (`-.->`).

## How to use

1. Open any Markdown file containing a Mermaid flowchart (e.g. `graph TD` or `flowchart LR`) within a Git-tracked workspace.
2. Ensure the file has been committed at least once.
3. Make edits to the Mermaid diagram.
4. Run the command **`Mermaid: Show Visual Diff`** from the VS Code command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`).
5. A Webview panel will open beside your editor displaying the colored diff.

## Requirements

- A workspace currently tracked by Git.
- The active Markdown file must contain at least one valid Mermaid flowchart block.

## Extension Settings

Presently, this extension does not contribute any customizable settings. It automatically uses your system's `git` installation.

## Known Issues

- The extension currently only visualizes the *first* Mermaid block found in the Markdown file.
- It strictly supports basic node/edge definitions within flowcharts (`graph` / `flowchart`). Complex diagrams (like sequence diagrams, gantt charts, or complex styling parameters natively defined on relationships) may not diff precisely.
- Removed edges simply revert to a dashed connection (`-.->`), ignoring their previous label or explicit connection line type.

## Release Notes

### 0.0.1
Initial release of Mermaid Visual Diff.

---

**Enjoy visualizing your diagram history!**
