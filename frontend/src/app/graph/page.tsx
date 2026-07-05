'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Loader2, Network, X } from 'lucide-react';
import axios from 'axios';

type Node = {
  id: string;
  label: string;
  type: string;
  group: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  score?: number; 
};

type Link = {
  source: string | Node;
  target: string | Node;
  value: number;
};

type GraphData = {
  nodes: Node[];
  links: Link[];
  query: string;
};

export default function GraphPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GraphData | null>(null);
  
  const [tooltip, setTooltip] = useState<{ show: boolean, x: number, y: number, text: string, type: string }>({ 
    show: false, x: 0, y: 0, text: '', type: '' 
  });

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchGraph = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await axios.post('http://localhost:3001/api/graph', {
        query: query.trim()
      });
      setData(response.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Error fetching graph data.');
    } finally {
      setLoading(false);
    }
  };

  const clearGraph = () => {
    setData(null);
    setQuery('');
  };

  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;

    let simulation: any;

    const renderGraph = async () => {
      const d3 = await import('d3');

      const container = containerRef.current;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove(); // clear old elements

      svg.attr('width', width).attr('height', height);

      // Setup data copies because D3 mutates them directly
      const nodes = data.nodes.map(d => ({ ...d }));
      const links = data.links.map(d => ({ ...d }));

      // Forces Setup
      simulation = d3.forceSimulation(nodes as any)
        .force('charge', d3.forceManyBody().strength(-250))
        .force('link', d3.forceLink(links).id((d: any) => d.id).distance(90))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collide', d3.forceCollide(30));

      // 1. Draw links
      const link = svg.append('g')
        .attr('stroke', '#334155')
        .attr('stroke-opacity', 0.6)
        .selectAll('line')
        .data(links)
        .join('line')
        .attr('stroke-width', (d: any) => Math.max(1, d.value / 5));

      // 2. Draw nodes
      const node = svg.append('g')
        .selectAll('circle')
        .data(nodes)
        .join('circle')
        .attr('r', (d: any) => d.group === 0 ? 20 : d.group === 1 ? 14 : 10)
        .attr('fill', (d: any) => d.group === 0 ? '#10b981' : d.group === 1 ? '#3b82f6' : '#f59e0b')
        .attr('cursor', 'pointer')
        .on('mouseover', (event, d: any) => {
          setTooltip({
            show: true,
            x: event.clientX,
            y: event.clientY,
            text: d.label,
            type: d.type
          });
        })
        .on('mouseout', () => {
          setTooltip(prev => ({ ...prev, show: false }));
        })
        .call(d3.drag()
          .on('start', (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d: any) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any);

      // 3. Draw text labels
      const labels = svg.append('g')
        .selectAll('text')
        .data(nodes)
        .join('text')
        .text((d: any) => d.label)
        .attr('font-size', '12px')
        .attr('fill', '#94a3b8')
        .attr('text-anchor', 'middle')
        .attr('dy', (d: any) => d.group === 0 ? 32 : d.group === 1 ? 26 : 22);

      // Simulation physics tick
      simulation.on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

        node
          .attr('cx', (d: any) => Math.max(20, Math.min(width - 20, d.x)))
          .attr('cy', (d: any) => Math.max(20, Math.min(height - 20, d.y)));

        labels
          .attr('x', (d: any) => Math.max(20, Math.min(width - 20, d.x)))
          .attr('y', (d: any) => Math.max(20, Math.min(height - 20, d.y)));
      });

      // 4. Draw Legend
      const legend = svg.append('g')
        .attr('transform', `translate(${width - 160}, 20)`);
      
      const legendData = [
        { label: 'Query', color: '#10b981' },
        { label: 'Document', color: '#3b82f6' },
        { label: 'Equipment Tag', color: '#f59e0b' }
      ];

      legend.selectAll('circle')
        .data(legendData)
        .join('circle')
        .attr('cx', 10)
        .attr('cy', (d, i) => i * 25)
        .attr('r', 6)
        .attr('fill', d => d.color);

      legend.selectAll('text')
        .data(legendData)
        .join('text')
        .attr('x', 24)
        .attr('y', (d, i) => i * 25 + 4)
        .text(d => d.label)
        .attr('font-size', '12px')
        .attr('fill', '#e2e8f0')
        .attr('font-family', 'sans-serif');

      simulation.alpha(1).restart();
    };

    renderGraph();

    return () => {
      if (simulation) simulation.stop();
    };
  }, [data]);

  // Derive unique documents dynamically from nodes and link scores
  const documents = data ? data.nodes.filter(n => n.type === 'document').map(doc => {
    // Reverse engineer score from edge weight between query and this doc
    const link = data.links.find(l => 
      (typeof l.target === 'object' ? l.target.id === doc.id : l.target === doc.id) && 
      (typeof l.source === 'object' ? l.source.id === 'query' : l.source === 'query')
    );
    const score = link ? link.value / 10 : 0;
    return { ...doc, score };
  }).sort((a, b) => (b.score || 0) - (a.score || 0)) : [];

  return (
    <div className="flex h-[calc(100vh-64px)] -m-6 bg-slate-950 overflow-hidden">
      
      {/* Left Panel: Search & Results */}
      <div className="w-[30%] bg-slate-900 border-r border-slate-800 flex flex-col z-10 shrink-0">
        <div className="p-6 border-b border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-slate-100">
            <Network className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-semibold">Knowledge Graph</h2>
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchGraph()}
              placeholder="Search concepts or equipment..."
              className="flex-1 bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            <button
              onClick={fetchGraph}
              disabled={loading || !query.trim()}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
          {error && <p className="text-red-400 text-xs mt-3 bg-red-500/10 p-2 rounded border border-red-500/20">{error}</p>}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {data && (
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Matched Documents ({documents.length})</span>
              <button onClick={clearGraph} className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors">
                <X className="w-3 h-3" /> Clear
              </button>
            </div>
          )}
          
          {documents.map((doc, idx) => (
            <div key={idx} className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-200 truncate mb-2.5" title={doc.label}>{doc.label}</h3>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold bg-slate-700 text-slate-300 px-2 py-0.5 rounded uppercase tracking-wider">
                  Document
                </span>
                <span className="text-xs text-emerald-400 font-bold">{Math.round((doc.score || 0) * 100)}% Match</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2.5 overflow-hidden">
                <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.round((doc.score || 0) * 100)}%` }}></div>
              </div>
            </div>
          ))}

          {!data && !loading && (
            <div className="text-center text-slate-500 text-sm mt-12 px-6 leading-relaxed">
              Enter a query to generate an interactive semantic web of heavily correlated documents and extracted equipment tags.
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: SVG Canvas */}
      <div className="w-[70%] relative flex-1" ref={containerRef}>
        
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-emerald-500 bg-slate-950/80 backdrop-blur-sm z-20">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="text-slate-300 font-medium animate-pulse">Computing vectors and rendering topological graph...</p>
          </div>
        )}
        
        {/* Empty State */}
        {!data && !loading && (
          <div className="absolute inset-0 flex items-center justify-center z-0">
            <Network className="w-32 h-32 text-slate-800/30" />
          </div>
        )}
        
        <svg ref={svgRef} className="w-full h-full" />
        
        {/* Custom Tooltip */}
        {tooltip.show && (
          <div 
            className="absolute bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm shadow-xl z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-15px] min-w-[150px]"
            style={{ 
              left: tooltip.x - (containerRef.current?.getBoundingClientRect().left || 0), 
              top: tooltip.y - (containerRef.current?.getBoundingClientRect().top || 0) 
            }}
          >
            <div className="font-semibold text-slate-100 mb-1.5 max-w-[220px] break-words leading-tight">{tooltip.text}</div>
            <div className="text-[11px] text-slate-300 font-medium uppercase tracking-wider flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${tooltip.type === 'query' ? 'bg-emerald-500' : tooltip.type === 'document' ? 'bg-blue-500' : 'bg-amber-500'}`}></span>
              {tooltip.type}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
