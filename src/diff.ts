export interface NodeInfo {
    id: string;
    originalText: string;
}

export interface EdgeInfo {
    from: string;
    to: string;
    connector: string;
    originalText: string;
    id: string; // from->to
}

export interface ParsedMermaid {
    typeLine: string;
    nodes: Map<string, NodeInfo>;
    edges: Map<string, EdgeInfo>;
    otherLines: string[];
}

export interface DiffColors {
    addedColor: string;
    addedStroke: string;
    removedColor: string;
    removedStroke: string;
}

export function parseMermaid(text: string): ParsedMermaid {
    const lines = text.split('\n');
    let typeLine = 'graph TD';
    const nodes = new Map<string, NodeInfo>();
    const edges = new Map<string, EdgeInfo>();
    const otherLines: string[] = [];

    const edgeConnectors = ['-->', '---', '-.->', '==>'];

    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('%%')) continue;

        if (line.match(/^(graph|flowchart)\s+[A-Z]+/)) {
            typeLine = line;
            continue;
        }

        // Check if line contains an edge connector
        let isEdge = false;
        let foundConnector = '';
        for (const conn of edgeConnectors) {
            if (line.includes(conn)) {
                isEdge = true;
                foundConnector = conn;
                break;
            }
        }

        if (isEdge) {
            const parts = line.split(foundConnector);
            if (parts.length >= 2) {
                const fromPart = parts[0].trim();
                const toPart = parts.slice(1).join(foundConnector).trim(); // handle multiple connectors by just taking the first one as primary, though usually 1 per line is best practice

                const fromIdMatch = fromPart.match(/^([a-zA-Z0-9_]+)/);
                const toIdMatch = toPart.match(/^([a-zA-Z0-9_]+)/);

                if (fromIdMatch && toIdMatch) {
                    const fromId = fromIdMatch[1];
                    const toId = toIdMatch[1];

                    if (!nodes.has(fromId)) {
                        nodes.set(fromId, { id: fromId, originalText: fromPart });
                    }
                    if (!nodes.has(toId)) {
                        nodes.set(toId, { id: toId, originalText: toPart });
                    }

                    const edgeId = `${fromId}->${toId}`;
                    edges.set(edgeId, {
                        from: fromId,
                        to: toId,
                        connector: foundConnector,
                        originalText: line,
                        id: edgeId
                    });
                } else {
                    otherLines.push(line);
                }
            }
        } else {
            // Might be a node definition or style
            const idMatch = line.match(/^([a-zA-Z0-9_]+)/);
            if (idMatch && !line.startsWith('classDef') && !line.startsWith('class ') && !line.startsWith('style ')) {
                const id = idMatch[1];
                if (!nodes.has(id)) {
                    nodes.set(id, { id: id, originalText: line });
                }
            } else {
                otherLines.push(line);
            }
        }
    }

    return { typeLine, nodes, edges, otherLines };
}

export function computeDiff(oldText: string, newText: string, colors: DiffColors = { addedColor: '#e6ffed', addedStroke: '#2ea043', removedColor: '#ffebe9', removedStroke: '#cf222e' }): string {
    const oldParsed = parseMermaid(oldText);
    const newParsed = parseMermaid(newText);

    const resultLines: string[] = [
        newParsed.typeLine || oldParsed.typeLine || 'graph TD',
        `classDef added fill:${colors.addedColor},stroke:${colors.addedStroke},stroke-width:2px;`,
        `classDef removed fill:${colors.removedColor},stroke:${colors.removedStroke},stroke-width:2px,stroke-dasharray: 5 5;`,
        'classDef unchanged fill:#f6f8fa,stroke:#d0d7de,stroke-width:1px;'
    ];

    const addedNodes = new Set<string>();
    const removedNodes = new Set<string>();
    const unchangedNodes = new Set<string>();

    // Node Diff
    for (const [id, node] of newParsed.nodes) {
        if (oldParsed.nodes.has(id)) {
            unchangedNodes.add(id);
            resultLines.push(node.originalText);
        } else {
            addedNodes.add(id);
            resultLines.push(node.originalText);
        }
    }
    for (const [id, node] of oldParsed.nodes) {
        if (!newParsed.nodes.has(id)) {
            removedNodes.add(id);
            resultLines.push(node.originalText);
        }
    }

    // Edge Diff
    for (const [id, edge] of newParsed.edges) {
        if (oldParsed.edges.has(id)) {
            resultLines.push(edge.originalText);
        } else {
            // Added edge
            resultLines.push(edge.originalText);
            // Optionally we could try to style added edges, but Mermaid doesn't easily support classes on edges without `linkStyle`.
            // The prompt says "削除されたエッジは -.-> で表現するなど". 
            // We keep added edges as they are, but node colors will indicate them.
        }
    }

    let linkIndex = 0; // if we wanted to use linkStyle
    for (const [id, edge] of oldParsed.edges) {
        if (!newParsed.edges.has(id)) {
            // Removed edge
            // Represent removed edge with -.->
            let removedEdgeLine = `${edge.from} -.-> ${edge.to}`;
            // If the original edge had labels, it's lost in this simple conversion, but sufficient.
            resultLines.push(removedEdgeLine);
        }
    }

    // Apply Node Styles
    for (const id of addedNodes) {
        resultLines.push(`class ${id} added`);
    }
    for (const id of removedNodes) {
        resultLines.push(`class ${id} removed`);
    }
    for (const id of unchangedNodes) {
        resultLines.push(`class ${id} unchanged`);
    }

    return resultLines.join('\n');
}
