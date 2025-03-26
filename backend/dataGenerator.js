function generateRandomDataset(numProcesses = 5000, numResources = 5000, numEdges = 20000) {
  const processes = Array.from({ length: numProcesses }, (_, i) => `P${i}`);
  const resources = Array.from({ length: numResources }, (_, i) => `R${i}`);
  const nodes = [
    ...processes.map(id => ({ id, type: 'process' })),
    ...resources.map(id => ({ id, type: 'resource' }))
  ];

  const edges = [];
  for (let i = 0; i < numEdges; i++) {
    const fromType = Math.random() > 0.5 ? 'process' : 'resource';
    const toType = fromType === 'process' ? 'resource' : 'process';
    const fromNodes = nodes.filter(n => n.type === fromType);
    const toNodes = nodes.filter(n => n.type === toType);
    const from = fromNodes[Math.floor(Math.random() * fromNodes.length)].id;
    const to = toNodes[Math.floor(Math.random() * toNodes.length)].id;
    edges.push({ from, to });
  }

  return { nodes, edges };
}

module.exports = { generateRandomDataset };