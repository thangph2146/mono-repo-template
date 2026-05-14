const fs = require('fs');
const Graph = require('graphology');

const data = JSON.parse(fs.readFileSync('./.graphify/snapshot/graph.json', 'utf-8'));
const G = new Graph({type: 'undirected'});
for (const n of data.nodes) { const {id, ...a} = n; G.mergeNode(id, a); }
for (const l of data.links) { const {source, target, ...a} = l; if (G.hasNode(source) && G.hasNode(target)) try { G.mergeEdge(source, target, a); } catch {} }

const terms = ['agent', 'conventions', 'next.js', 'rules'];
const scored = [];
G.forEachNode((nid, ndata) => {
    const label = (ndata.label || '').toLowerCase();
    const score = terms.filter(t => label.includes(t)).length;
    if (score > 0) scored.push([score, nid]);
});
scored.sort((a, b) => b[0] - a[0]);
const startNodes = scored.slice(0, 3).map(s => s[1]);

const subgraphNodes = new Set(startNodes);
const subgraphEdges = [];
let frontier = new Set(startNodes);

for (let i = 0; i < 2; i++) {
    const nextFrontier = new Set();
    for (const n of frontier) {
        G.forEachNeighbor(n, neighbor => {
            if (!subgraphNodes.has(neighbor)) {
                nextFrontier.add(neighbor);
                subgraphEdges.push([n, neighbor]);
            }
        });
    }
    nextFrontier.forEach(n => subgraphNodes.add(n));
    frontier = nextFrontier;
}

const lines = ['Traversal result:'];
for (const nid of subgraphNodes) {
    const d = G.getNodeAttributes(nid);
    lines.push(`  NODE ${d.label || nid} [src=${d.source_file || ''}]`);
}
for (const [u, v] of subgraphEdges) {
    const ek = G.edge(u, v);
    const edge = ek ? G.getEdgeAttributes(ek) : {};
    lines.push(`  EDGE ${G.getNodeAttribute(u, 'label') || u} --${edge.relation || ''} [${edge.confidence || ''}]--> ${G.getNodeAttribute(v, 'label') || v}`);
}
console.log(lines.join('\n'));
