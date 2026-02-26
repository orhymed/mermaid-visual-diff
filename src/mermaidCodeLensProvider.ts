import * as vscode from 'vscode';

export class MermaidCodeLensProvider implements vscode.CodeLensProvider {
    private codeLenses: vscode.CodeLens[] = [];
    private regex: RegExp;
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    constructor() {
        this.regex = /```mermaid([\s\S]*?)```/g;

        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
        this.codeLenses = [];
        const text = document.getText();
        let matches;
        let index = 0;

        while ((matches = this.regex.exec(text)) !== null) {
            const line = document.lineAt(document.positionAt(matches.index).line);
            const indexOf = line.text.indexOf(matches[0]);
            const position = new vscode.Position(line.lineNumber, Math.max(indexOf, 0));
            const range = document.getWordRangeAtPosition(position, new RegExp(this.regex)) || new vscode.Range(line.lineNumber, 0, line.lineNumber, 0);

            if (range) {
                const command: vscode.Command = {
                    title: "🔍 Show Visual Diff",
                    tooltip: "Show Visual Diff for this Mermaid block",
                    command: "mermaid-visual-diff.showVisualDiff",
                    arguments: [index]
                };

                this.codeLenses.push(new vscode.CodeLens(range, command));
            }
            index++;
        }
        return this.codeLenses;
    }

    public resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken) {
        return codeLens;
    }
}
