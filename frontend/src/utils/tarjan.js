class Graph {
  constructor(nodes, edges) {
    this.nodes = nodes;
    this.edges = edges;
    this.index = 0;
    this.stack = [];
    this.lowlink = new Map();
    this.indexMap = new Map();
    this.onStack = new Map();
  }

  tarjanSCC() {
    this.index = 0;
    this.stack = [];
    this.lowlink.clear();
    this.indexMap.clear();
    this.onStack.clear();
    const sccs = [];

    for (const node of this.nodes) {
      if (!this.indexMap.has(node.id)) {
        this.strongConnect(node.id, sccs);
      }
    }

    return sccs.filter(scc => scc.length > 1);
  }

  strongConnect(v, sccs) {
    this.indexMap.set(v, this.index);
    this.lowlink.set(v, this.index);
    this.index++;
    this.stack.push(v);
    this.onStack.set(v, true);

    const adjacent = this.edges.filter(e => e.from === v);
    for (const edge of adjacent) {
      const w = edge.to;
      if (!this.indexMap.has(w)) {
        this.strongConnect(w, sccs);
        this.lowlink.set(v, Math.min(this.lowlink.get(v), this.lowlink.get(w)));
      } else if (this.onStack.get(w)) {
        this.lowlink.set(v, Math.min(this.lowlink.get(v), this.indexMap.get(w)));
      }
    }

    if (this.lowlink.get(v) === this.indexMap.get(v)) {
      const scc = [];
      let w;
      do {
        w = this.stack.pop();
        this.onStack.set(w, false);
        scc.push(w);
      } while (w !== v);
      sccs.push(scc);
    }
  }
}

export function detectDeadlocks(nodes, edges) {
  const graph = new Graph(nodes, edges);
  return graph.tarjanSCC();
}