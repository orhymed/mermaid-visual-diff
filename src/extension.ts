import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import { computeDiff } from './diff';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('mermaid-visual-diff.showVisualDiff', async () => {
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

            // Extract Mermaid blocks
            const mermaidRegex = /```mermaid\s+([\s\S]*?)\s+```/;
            const oldMatch = oldContent.match(mermaidRegex);
            const newMatch = newContent.match(mermaidRegex);

            if (!oldMatch && !newMatch) {
                vscode.window.showErrorMessage('No Mermaid block found in both old and new versions.');
                return;
            }

            const oldMermaid = oldMatch ? oldMatch[1] : '';
            const newMermaid = newMatch ? newMatch[1] : '';

            // Compute Diff
            const diffMermaid = computeDiff(oldMermaid, newMermaid);

            // Show Webview
            const panel = vscode.window.createWebviewPanel(
                'mermaidVisualDiff',
                'Mermaid Visual Diff',
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true
                }
            );

            panel.webview.html = getWebviewContent(diffMermaid);

        } catch (error) {
            vscode.window.showErrorMessage(`Error getting Git HEAD: ${error}`);
        }
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent(mermaidText: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mermaid Visual Diff</title>
</head>
<body style="background-color: white;">
    <div class="mermaid">
        ${mermaidText}
    </div>
    <script type="module">
        import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
        mermaid.initialize({ startOnLoad: true });
    </script>
</body>
</html>`;
}

export function deactivate() { }
