import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import { computeDiff, DiffColors } from './diff';
import { MermaidCodeLensProvider } from './mermaidCodeLensProvider';

export function activate(context: vscode.ExtensionContext) {
    const codeLensProvider = new MermaidCodeLensProvider();
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider({ language: 'markdown' }, codeLensProvider)
    );

    let disposable = vscode.commands.registerCommand('mermaid-visual-diff.showVisualDiff', async (blockIndex?: number) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active active text editor found.');
            return;
        }

        const document = editor.document;
        if (document.isUntitled) {
            vscode.window.showErrorMessage('File is not saved. Cannot compare with Git.');
            return;
        }

        const fsPath = document.uri.fsPath;
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('File is not in a workspace.');
            return;
        }

        const cwd = workspaceFolder.uri.fsPath;
        const relativePath = path.relative(cwd, fsPath);

        try {
            // Get old content from git HEAD
            const oldContent = await new Promise<string>((resolve, reject) => {
                cp.exec(`git show HEAD:"${relativePath.replace(/\\/g, '/')}"`, { cwd }, (error, stdout, stderr) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(stdout);
                    }
                });
            });

            // Get current content
            const newContent = document.getText();

            // Determine target block index
            let targetIndex = blockIndex !== undefined ? blockIndex : -1;

            // Extract ALL Mermaid blocks
            const mermaidRegex = /```mermaid\s+([\s\S]*?)\s+```/g;

            const extractBlocks = (text: string) => {
                const blocks: string[] = [];
                let match;
                while ((match = mermaidRegex.exec(text)) !== null) {
                    blocks.push(match[1]);
                }
                // Reset regex index just in case
                mermaidRegex.lastIndex = 0;
                return blocks;
            };

            const oldBlocks = extractBlocks(oldContent);
            const newBlocks = extractBlocks(newContent);

            if (targetIndex === -1) {
                // If not provided by CodeLens, figure it out based on cursor position
                const cursorPosition = editor.selection.active;
                let currentIndex = 0;
                let foundMatch = false;

                // We re-run exec to get positional info for newBlocks
                let match;
                while ((match = mermaidRegex.exec(newContent)) !== null) {
                    const blockStartPos = document.positionAt(match.index);
                    const blockEndPos = document.positionAt(match.index + match[0].length);
                    // Check if cursor is roughly within or near this block
                    if (cursorPosition.line >= blockStartPos.line && cursorPosition.line <= blockEndPos.line) {
                        targetIndex = currentIndex;
                        foundMatch = true;
                        break;
                    }
                    currentIndex++;
                }
                mermaidRegex.lastIndex = 0;

                // Fallback to first block if not near any
                if (!foundMatch) {
                    targetIndex = 0;
                }
            }

            const oldMermaid = oldBlocks[targetIndex] || '';
            const newMermaid = newBlocks[targetIndex] || '';

            if (!oldMermaid && !newMermaid) {
                vscode.window.showErrorMessage('No Mermaid block found at this location.');
                return;
            }

            // Get Color Settings
            const config = vscode.workspace.getConfiguration('mermaid-visual-diff');
            const colors: DiffColors = {
                addedColor: config.get('addedColor', '#e6ffed'),
                addedStroke: config.get('addedStroke', '#2ea043'),
                removedColor: config.get('removedColor', '#ffebe9'),
                removedStroke: config.get('removedStroke', '#cf222e')
            };

            // Compute Diff
            const diffMermaid = computeDiff(oldMermaid, newMermaid, colors);

            // Show Webview
            const panel = vscode.window.createWebviewPanel(
                'mermaidVisualDiff',
                `Mermaid Graph Diff (${targetIndex + 1})`,
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true
                }
            );

            panel.webview.html = getWebviewContent(oldMermaid, diffMermaid);

        } catch (error) {
            vscode.window.showErrorMessage(`Error getting Git HEAD: ${error}`);
        }
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent(oldMermaid: string, diffMermaid: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mermaid Visual Diff</title>
    <style>
        body {
            background-color: white;
            color: #333;
            font-family: sans-serif;
            display: flex;
            flex-direction: column;
            padding: 20px;
        }
        .container {
            display: flex;
            gap: 20px;
            width: 100%;
        }
        .pane {
            flex: 1;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 10px;
            background-color: #fafafa;
        }
        h2 {
            font-size: 16px;
            margin-top: 0;
            margin-bottom: 20px;
            color: #555;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }
        /* Fallback message for empty graphs */
        .empty-message {
            color: #999;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="pane">
            <h2>Original Graph</h2>
            ${oldMermaid ? `<div class="mermaid">${oldMermaid}</div>` : `<p class="empty-message">No original graph found (New file or block).</p>`}
        </div>
        <div class="pane">
            <h2>Visual Diff</h2>
            <div class="mermaid">${diffMermaid}</div>
        </div>
    </div>
    <script type="module">
        import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
        mermaid.initialize({ startOnLoad: true });
    </script>
</body>
</html>`;
}

export function deactivate() { }
