import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import jsPDF from 'jspdf';

function Dashboard({ theme }) {
  const [dataset, setDataset] = useState({ nodes: [], edges: [] });
  const [deadlocks, setDeadlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalNodes: 0, totalEdges: 0, totalDeadlocks: 0, processNodes: 0, resourceNodes: 0 });
  const [edgeTimeline, setEdgeTimeline] = useState([]);

  useEffect(() => {
    fetchDataset();
  }, []);

  const fetchDataset = async () => {
    setLoading(true);
    try {
      console.log('Fetching dataset from /api/dataset...');
      const response = await axios.get('http://localhost:5000/api/dataset');
      console.log('Response from backend:', response.data);

      // Validate the data
      const nodes = Array.isArray(response.data.nodes) ? response.data.nodes : [];
      const edges = Array.isArray(response.data.edges) ? response.data.edges : [];
      console.log('Dataset:', { nodes, edges });

      setDataset({ nodes, edges });

      // Detect deadlocks
      const detectedDeadlocks = detectDeadlocks(nodes, edges);
      console.log('Detected deadlocks:', detectedDeadlocks);
      setDeadlocks(detectedDeadlocks);

      // Calculate statistics
      const statsData = {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        totalDeadlocks: detectedDeadlocks.length,
        processNodes: nodes.filter(n => n.type === 'process').length,
        resourceNodes: nodes.filter(n => n.type === 'resource').length,
      };
      console.log('Stats:', statsData);
      setStats(statsData);

      // Create a timeline for the line chart
      const timelineData = [];
      const step = Math.floor(edges.length / 10); // Divide edges into 10 steps
      for (let i = 0; i <= 10; i++) {
        const edgeCount = i === 0 ? 0 : Math.min(i * step, edges.length);
        timelineData.push({
          time: i,
          edges: edgeCount,
        });
      }
      console.log('Edge timeline:', timelineData);
      setEdgeTimeline(timelineData);
    } catch (error) {
      console.error('Error fetching dataset:', error);
      setDataset({ nodes: [], edges: [] }); // Reset dataset on error
    } finally {
      setLoading(false);
    }
  };

  const detectDeadlocks = (nodes, edges) => {
    class Graph {
      constructor(nodes, edges) {
        this.nodes = Array.isArray(nodes) ? nodes : [];
        this.edges = Array.isArray(edges) ? edges : [];
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

        if (!Array.isArray(this.nodes)) {
          console.error('this.nodes is not an array:', this.nodes);
          return [];
        }

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

    const graph = new Graph(nodes, edges);
    return graph.tarjanSCC();
  };

  const exportReport = () => {
    const doc = new jsPDF();
    doc.text('Deadlock Detection Report', 10, 10);
    doc.text(`Total Nodes: ${stats.totalNodes}`, 10, 20);
    doc.text(`Total Edges: ${stats.totalEdges}`, 10, 30);
    doc.text(`Total Deadlocks: ${stats.totalDeadlocks}`, 10, 40);
    doc.text('Deadlock Cycles:', 10, 50);
    deadlocks.forEach((cycle, i) => {
      doc.text(`Cycle ${i + 1}: ${cycle.join(' -> ')}`, 10, 60 + i * 10);
    });
    doc.save('deadlock-report.pdf');
  };

  const pieData = [
    { name: 'Processes', value: stats.processNodes || 0 },
    { name: 'Resources', value: stats.resourceNodes || 0 },
  ];

  const barData = [
    { name: 'Nodes', value: stats.totalNodes || 0 },
    { name: 'Edges', value: stats.totalEdges || 0 },
    { name: 'Deadlocks', value: stats.totalDeadlocks || 0 },
  ];

  const COLORS = ['#4CAF50', '#2196F3'];

  const chartVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
        staggerChildren: 0.2,
      },
    },
  };

  const barVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  const lineVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 1.5,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <div className="p-6 flex-1 overflow-auto">
      {loading ? (
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xl">Analyzing dataset...</p>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={chartVariants}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <motion.div
              className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}
              variants={chartVariants}
            >
              <h2 className="text-lg font-semibold mb-4">Node Distribution</h2>
              {stats.processNodes > 0 || stats.resourceNodes > 0 ? (
                <PieChart width={500} height={400}>
                  <Pie
                    data={pieData}
                    cx={200}
                    cy={150}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={{ stroke: theme === 'dark' ? '#fff' : '#000', strokeWidth: 1 }}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#333' : '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      paddingTop: '10px',
                      fontSize: '14px',
                    
                    }}
                  />
                </PieChart>
              ) : (
                <p className="text-center">No data available</p>
              )}
            </motion.div>

            <motion.div
              className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}
              variants={chartVariants}
            >
              <h2 className="text-lg font-semibold mb-4">Statistics</h2>
              {stats.totalNodes > 0 || stats.totalEdges > 0 || stats.totalDeadlocks > 0 ? (
                <BarChart width={400} height={300} data={barData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#333' : '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    }}
                  />
                  <Legend />
                  {barData.map((entry, index) => (
                    <Bar
                      key={index}
                      dataKey="value"
                      fill="#8884d8"
                      as={motion.rect}
                      variants={barVariants}
                    />
                  ))}
                </BarChart>
              ) : (
                <p className="text-center">No data available</p>
              )}
            </motion.div>
          </div>

          <motion.div
            className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow mb-6`}
            variants={chartVariants}
          >
            <h2 className="text-lg font-semibold mb-4">Resource Allocation Over Time</h2>
            {edgeTimeline.length > 0 ? (
              <LineChart width={800} height={400} data={edgeTimeline}>
                <XAxis dataKey="time" label={{ value: 'Time Step', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Number of Edges', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#333' : '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="edges"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 8 }}
                  isAnimationActive={true}
                  animationBegin={0}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                  as={motion.path}
                  variants={lineVariants}
                />
              </LineChart>
            ) : (
              <p className="text-center">No data available</p>
            )}
          </motion.div>

          <motion.div
            className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}
            variants={chartVariants}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Deadlock Report</h2>
              <motion.button
                onClick={exportReport}
                className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                Export Report
              </motion.button>
            </div>
            {deadlocks.length > 0 ? (
              <ul>
                {deadlocks.map((cycle, index) => (
                  <motion.li
                    key={index}
                    className="mb-2 p-2 bg-red-500 bg-opacity-20 rounded"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    Cycle {index + 1}: {cycle.join(' -> ')}
                  </motion.li>
                ))}
              </ul>
            ) : (
              <p>No deadlocks detected.</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default Dashboard;