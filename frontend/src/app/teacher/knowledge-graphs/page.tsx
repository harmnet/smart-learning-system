"use client";

import { useState, useEffect, useRef } from 'react';
import { knowledgeGraphService, KnowledgeGraph, KnowledgeNode, GraphTree } from '@/services/knowledgeGraph.service';
import { useLanguage } from '@/contexts/LanguageContext';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import Modal from '@/components/common/Modal';
import Toast from '@/components/common/Toast';

export default function KnowledgeGraphPage() {
  const { t } = useLanguage();
  const [graphs, setGraphs] = useState<KnowledgeGraph[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGraph, setSelectedGraph] = useState<KnowledgeGraph | null>(null);
  const [graphTree, setGraphTree] = useState<GraphTree | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'mindmap' | 'graph'>('tree');
  
  // Modals
  const [createGraphModalOpen, setCreateGraphModalOpen] = useState(false);
  const [editGraphModalOpen, setEditGraphModalOpen] = useState(false);
  const [createNodeModalOpen, setCreateNodeModalOpen] = useState(false);
  const [editNodeModalOpen, setEditNodeModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [aiGenerateModalOpen, setAiGenerateModalOpen] = useState(false);
  
  // Form states
  const [graphName, setGraphName] = useState('');
  const [graphDescription, setGraphDescription] = useState('');
  const [nodeName, setNodeName] = useState('');
  const [nodeContent, setNodeContent] = useState('');
  const [parentNodeId, setParentNodeId] = useState<number | null>(null);
  const [editingGraph, setEditingGraph] = useState<KnowledgeGraph | null>(null);
  const [editingNode, setEditingNode] = useState<KnowledgeNode | null>(null);
  const [teacherId, setTeacherId] = useState<number | undefined>(undefined);
  
  // AI生成相关状态
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [aiGraphName, setAiGraphName] = useState('');
  const [aiGraphDescription, setAiGraphDescription] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGenerateError, setAiGenerateError] = useState<string | null>(null);
  
  // Toast状态
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  
  // G6图表相关
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const g6GraphRef = useRef<any>(null);
  const allGraphDataRef = useRef<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [expandedGraphNodes, setExpandedGraphNodes] = useState<Set<string>>(new Set());
  
  // 从localStorage获取当前登录用户的ID
  useEffect(() => {
    console.log('🔍 [知识图谱] 开始初始化，检查localStorage...');
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      console.log('🔍 [知识图谱] localStorage中的user字符串:', userStr);
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          console.log('✅ [知识图谱] 从localStorage读取的用户信息:', user);
          // 尝试多种可能的ID字段名
          const id = user.id || user.user_id || user.teacher_id;
          console.log('✅ [知识图谱] 提取的teacherId:', id, '类型:', typeof id);
          if (id) {
            console.log('✅ [知识图谱] 设置teacherId为:', id);
            setTeacherId(id);
          } else {
            console.error('❌ [知识图谱] 无法从用户信息中提取ID，用户信息:', user);
            console.error('❌ [知识图谱] 用户对象的所有键:', Object.keys(user));
          }
        } catch (e) {
          console.error('❌ [知识图谱] Failed to parse user info:', e);
        }
      } else {
        console.error('❌ [知识图谱] localStorage中没有用户信息，请先登录');
        // 尝试从其他可能的key获取
        console.log('🔍 [知识图谱] 检查其他localStorage键:', Object.keys(localStorage));
      }
    } else {
      console.error('❌ [知识图谱] window对象不可用');
    }
  }, []);

  useEffect(() => {
    console.log('🔍 [知识图谱] teacherId变化，当前值:', teacherId, '类型:', typeof teacherId);
    if (teacherId !== undefined) {
      console.log('✅ [知识图谱] teacherId有效，开始加载图谱列表...');
      loadGraphs();
    } else {
      console.warn('⚠️ [知识图谱] teacherId为undefined，跳过加载');
    }
  }, [teacherId]);

  useEffect(() => {
    if (selectedGraph) {
      loadGraphTree(selectedGraph.id);
    }
  }, [selectedGraph]);

  const loadGraphs = async () => {
    if (teacherId === undefined) {
      console.error('❌ [知识图谱] TeacherId is undefined, cannot load graphs');
      return;
    }
    console.log('🚀 [知识图谱] 开始加载知识图谱，teacherId:', teacherId, '类型:', typeof teacherId);
    setLoading(true);
    try {
      console.log('📡 [知识图谱] 调用API: getAll(', teacherId, ')');
      const data = await knowledgeGraphService.getAll(teacherId);
      console.log('✅ [知识图谱] 成功加载知识图谱，数量:', data.length);
      console.log('📊 [知识图谱] 返回的数据:', JSON.stringify(data, null, 2));
      setGraphs(data);
      if (data.length === 0) {
        console.warn('⚠️ [知识图谱] 图谱列表为空，可能的原因：1. 该教师没有创建图谱 2. teacherId不匹配');
      }
    } catch (error: any) {
      console.error('❌ [知识图谱] Failed to load graphs:', error);
      console.error('❌ [知识图谱] Error response:', error.response?.data);
      console.error('❌ [知识图谱] Error status:', error.response?.status);
      console.error('❌ [知识图谱] Error config:', error.config);
      const errorMessage = error.response?.data?.detail || error.message || '加载知识图谱失败';
      setToast({ message: `错误: ${errorMessage}`, type: 'error' });
    } finally {
      setLoading(false);
      console.log('🏁 [知识图谱] loadGraphs完成');
    }
  };

  const loadGraphTree = async (graphId: number) => {
    if (teacherId === undefined) {
      console.warn('TeacherId is undefined, cannot load graph tree');
      return;
    }
    try {
      const tree = await knowledgeGraphService.getTree(graphId, teacherId);
      setGraphTree(tree);
    } catch (error) {
      console.error('Failed to load graph tree:', error);
    }
  };

  const resetGraphForm = () => {
    setGraphName('');
    setGraphDescription('');
    setEditingGraph(null);
  };

  const resetNodeForm = () => {
    setNodeName('');
    setNodeContent('');
    setParentNodeId(null);
    setEditingNode(null);
  };

  // 渲染G6图表
  const renderG6Graph = async (data: { nodes: any[]; edges: any[] }) => {
    if (!graphContainerRef.current) {
      console.warn('⚠️ G6 Container not ready');
      return;
    }

    try {
      // 动态导入 G6（避免 SSR 问题）
      const { Graph } = await import('@antv/g6');

      console.log('✅ G6 loaded for knowledge graph, creating graph...');

      // 销毁旧图表
      if (g6GraphRef.current) {
        g6GraphRef.current.destroy();
      }
      // 清空容器
      if (graphContainerRef.current) {
        graphContainerRef.current.innerHTML = '';
      }

      // 创建新图表
      const graph = new Graph({
        container: graphContainerRef.current,
        width: graphContainerRef.current.offsetWidth,
        height: graphContainerRef.current.offsetHeight,
        data,
        layout: {
          type: 'radial',
          unitRadius: 180,        // 增加半径，避免节点过于密集
          linkDistance: 150,      // 增加连线距离
          preventOverlap: true,
          nodeSize: 50,           // 增加防重叠计算的节点尺寸
          strictRadial: false,
          nodeSpacing: 30,        // 节点之间的最小间距
        },
        node: {
          style: {
            size: (d: any) => d.style?.size || 30,
            fill: (d: any) => d.style?.fill || '#3b82f6',
            stroke: (d: any) => d.style?.stroke || '#2563eb',
            lineWidth: (d: any) => d.style?.lineWidth || 2,
            labelText: (d: any) => d.label || d.id,
            labelFill: '#1e293b',
            labelFontSize: (d: any) => d.style?.fontSize || 12,
            labelFontWeight: (d: any) => d.style?.fontWeight || 'bold',
            labelPosition: 'bottom',
            labelOffsetY: 10,           // 增加标签偏移，避免和节点重叠
            labelBackgroundFill: '#ffffff',
            labelBackgroundOpacity: 0.95,  // 添加背景透明度
            labelBackgroundRadius: 4,
            labelPadding: [3, 8, 3, 8], // 增加内边距
            labelMaxWidth: 120,         // 限制标签最大宽度
            cursor: 'pointer',
          },
          animation: {
            enter: [
              {
                fields: ['opacity'],
                duration: 500,
                easing: 'ease-out',
              },
            ],
          },
        },
        edge: {
          style: {
            stroke: '#94a3b8',         // 稍微深一点的颜色，更容易看清
            lineWidth: 2,
            lineAppendWidth: 10,       // 增加交互区域
            opacity: 0.6,              // 添加透明度，避免线条太突出
          },
          animation: {
            enter: [
              {
                fields: ['opacity'],
                duration: 500,
                easing: 'ease-out',
              },
            ],
          },
        },
        zoom: 1,
        // 启用交互：拖拽画布、缩放、拖拽节点
        plugins: [],
      });

      // 渲染图表
      await graph.render();
      graph.fitCenter();
      graph.zoomTo(0.8); // 初始缩放到80%，给节点更多空间

      // 监听节点点击事件
      graph.on('node:click', (event: any) => {
        let nodeId = null;
        if (event.target && event.target.id) {
          nodeId = event.target.id;
        } else if (event.target && event.target.cfg && event.target.cfg.id) {
          nodeId = event.target.cfg.id;
        } else if (event.item && event.item.getID) {
          nodeId = event.item.getID();
        } else if (event.itemId) {
          nodeId = event.itemId;
        }

        console.log('📍 Node clicked:', nodeId);
        if (nodeId) {
          handleGraphNodeClick(nodeId);
        }
      });

      g6GraphRef.current = graph;
      console.log('✅ G6 graph created successfully');
    } catch (error) {
      console.error('❌ Failed to render G6 graph:', error);
    }
  };

  // 处理G6图表节点点击
  const handleGraphNodeClick = async (nodeId: string) => {
    console.log('🔵 Handling node click:', nodeId);
    
    const node = allGraphDataRef.current.nodes.find(n => n.id === nodeId);
    if (!node) {
      console.warn('⚠️ Node not found:', nodeId);
      return;
    }

    // 切换节点展开状态
    const newExpandedNodes = new Set(expandedGraphNodes);
    if (newExpandedNodes.has(nodeId)) {
      newExpandedNodes.delete(nodeId);
    } else {
      newExpandedNodes.add(nodeId);
    }
    setExpandedGraphNodes(newExpandedNodes);

    // 获取当前应该显示的节点和边
    const visibleNodes: any[] = [];
    const visibleEdges: any[] = [];

    // 递归添加节点和边
    const addNodeAndChildren = (currentNodeId: string) => {
      const currentNode = allGraphDataRef.current.nodes.find(n => n.id === currentNodeId);
      if (!currentNode || visibleNodes.find(n => n.id === currentNodeId)) return;

      visibleNodes.push(currentNode);

      // 如果节点已展开，添加其子节点
      if (newExpandedNodes.has(currentNodeId)) {
        const childEdges = allGraphDataRef.current.edges.filter(e => e.source === currentNodeId);
        childEdges.forEach(edge => {
          visibleEdges.push(edge);
          addNodeAndChildren(edge.target);
        });
      }
    };

    // 从根节点开始添加
    const rootNodes = allGraphDataRef.current.nodes.filter(n => n.data.level === 0);
    rootNodes.forEach(root => addNodeAndChildren(root.id));

    // 重新渲染图表
    await renderG6Graph({ nodes: visibleNodes, edges: visibleEdges });
  };

  // 准备G6数据
  const prepareG6Data = () => {
    if (!graphTree || !graphTree.tree) return { nodes: [], edges: [] };

    const nodes: any[] = [];
    const edges: any[] = [];

    const addNode = (node: KnowledgeNode, level: number = 0, parentId?: string) => {
      const nodeId = `node-${node.id}`;
      
      // 根据层级设置不同的颜色和大小
      const levelStyles = [
        { size: 40, fill: '#10b981', stroke: '#059669', fontSize: 16 }, // Level 0: 绿色，根节点最大
        { size: 32, fill: '#3b82f6', stroke: '#2563eb', fontSize: 14 }, // Level 1: 蓝色
        { size: 26, fill: '#a855f7', stroke: '#9333ea', fontSize: 12 }, // Level 2: 紫色
        { size: 22, fill: '#f59e0b', stroke: '#d97706', fontSize: 11 }, // Level 3+: 橙色
      ];
      const style = levelStyles[Math.min(level, 3)];

      nodes.push({
        id: nodeId,
        label: node.node_name,
        style: {
          ...style,
          fontWeight: level === 0 ? 600 : 500,
        },
        data: {
          level,
          nodeData: node,
        },
      });

      if (parentId) {
        edges.push({
          source: parentId,
          target: nodeId,
        });
      }

      if (node.children && node.children.length > 0) {
        node.children.forEach(child => addNode(child, level + 1, nodeId));
      }
    };

    graphTree.tree.forEach(root => addNode(root, 0));

    return { nodes, edges };
  };

  // 当viewMode切换到graph时，初始化G6图表
  useEffect(() => {
    if (viewMode === 'graph' && graphTree && graphContainerRef.current) {
      const data = prepareG6Data();
      allGraphDataRef.current = data;
      
      // 初始只显示根节点
      const rootNodes = data.nodes.filter(n => n.data.level === 0);
      renderG6Graph({ nodes: rootNodes, edges: [] });
    }
    
    // 清理函数
    return () => {
      if (viewMode !== 'graph' && g6GraphRef.current) {
        g6GraphRef.current.destroy();
        g6GraphRef.current = null;
      }
    };
  }, [viewMode, graphTree]);

  const handleAIGenerateGraph = async () => {
    if (!aiGraphName.trim()) {
      setToast({ message: '请输入知识图谱名称', type: 'warning' });
      return;
    }
    if (!pdfFile) {
      setToast({ message: '请上传PDF文档', type: 'warning' });
      return;
    }
    if (teacherId === undefined) {
      setToast({ message: '无法获取教师ID，请重新登录', type: 'error' });
      return;
    }

    setAiGenerating(true);
    setAiGenerateError(null);

    try {
      const result = await knowledgeGraphService.generateFromPDF(
        teacherId,
        pdfFile,
        aiGraphName,
        aiGraphDescription || undefined
      );

      if (result.success) {
        setToast({ message: 'AI知识图谱生成成功！', type: 'success' });
        setAiGenerateModalOpen(false);
        setPdfFile(null);
        setAiGraphName('');
        setAiGraphDescription('');
        await loadGraphs();
        
        // 自动打开生成的知识图谱
        if (result.graph_id) {
          // 重新加载图谱列表以获取新创建的图谱
          await loadGraphs();
          const newGraph = graphs.find(g => g.id === result.graph_id);
          if (newGraph) {
            handleViewGraph(newGraph);
          }
        }
      } else {
        setAiGenerateError(result.error || 'AI生成知识图谱失败');
      }
    } catch (error: any) {
      console.error('AI生成知识图谱失败:', error);
      setAiGenerateError(error.response?.data?.detail || error.message || 'AI生成知识图谱失败');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCreateGraph = async () => {
    if (!graphName.trim()) {
      setToast({ message: t.teacher.knowledgeGraph.placeholders.graphName, type: 'warning' });
      return;
    }
    if (teacherId === undefined) {
      setToast({ message: '无法获取教师ID，请重新登录', type: 'error' });
      return;
    }

    try {
      await knowledgeGraphService.create(teacherId, {
        graph_name: graphName,
        description: graphDescription || undefined,
      });
      setToast({ message: t.teacher.knowledgeGraph.createSuccess, type: 'success' });
      setCreateGraphModalOpen(false);
      resetGraphForm();
      await loadGraphs();
    } catch (error: any) {
      console.error('Failed to create graph:', error);
      setToast({ message: t.teacher.knowledgeGraph.createError + ': ' + (error.response?.data?.detail || error.message), type: 'error' });
    }
  };

  const handleUpdateGraph = async () => {
    if (!editingGraph || !graphName.trim()) {
      setToast({ message: t.teacher.knowledgeGraph.placeholders.graphName, type: 'warning' });
      return;
    }
    if (teacherId === undefined) {
      setToast({ message: '无法获取教师ID，请重新登录', type: 'error' });
      return;
    }

    try {
      await knowledgeGraphService.update(editingGraph.id, teacherId, {
        graph_name: graphName,
        description: graphDescription || undefined,
      });
      setToast({ message: t.teacher.knowledgeGraph.updateSuccess, type: 'success' });
      setEditGraphModalOpen(false);
      resetGraphForm();
      await loadGraphs();
      if (selectedGraph?.id === editingGraph.id) {
        await loadGraphTree(editingGraph.id);
      }
    } catch (error: any) {
      console.error('Failed to update graph:', error);
      setToast({ message: t.teacher.knowledgeGraph.updateError + ': ' + (error.response?.data?.detail || error.message), type: 'error' });
    }
  };

  const handleDeleteGraph = async (graph: KnowledgeGraph) => {
    if (!confirm(t.teacher.knowledgeGraph.deleteConfirm)) return;
    if (teacherId === undefined) {
      setToast({ message: '无法获取教师ID，请重新登录', type: 'error' });
      return;
    }
    
    try {
      await knowledgeGraphService.delete(graph.id, teacherId);
      setToast({ message: t.teacher.knowledgeGraph.deleteSuccess, type: 'success' });
      if (selectedGraph?.id === graph.id) {
        setSelectedGraph(null);
        setGraphTree(null);
      }
      await loadGraphs();
    } catch (error: any) {
      console.error('Failed to delete graph:', error);
      setToast({ message: t.teacher.knowledgeGraph.deleteError + ': ' + (error.response?.data?.detail || error.message), type: 'error' });
    }
  };

  const handleEditGraph = (graph: KnowledgeGraph) => {
    setEditingGraph(graph);
    setGraphName(graph.graph_name);
    setGraphDescription(graph.description || '');
    setEditGraphModalOpen(true);
  };

  const handleViewGraph = async (graph: KnowledgeGraph) => {
    setSelectedGraph(graph);
    setViewModalOpen(true);
    await loadGraphTree(graph.id);
  };

  const handleCreateNode = async () => {
    if (!selectedGraph || !nodeName.trim()) {
      setToast({ message: t.teacher.knowledgeGraph.placeholders.nodeName, type: 'warning' });
      return;
    }
    if (teacherId === undefined) {
      setToast({ message: '无法获取教师ID，请重新登录', type: 'error' });
      return;
    }

    try {
      await knowledgeGraphService.createNode(selectedGraph.id, teacherId, {
        node_name: nodeName,
        node_content: nodeContent || undefined,
        parent_id: parentNodeId || undefined,
      });
      setToast({ message: t.teacher.knowledgeGraph.nodeCreateSuccess, type: 'success' });
      setCreateNodeModalOpen(false);
      resetNodeForm();
      await loadGraphTree(selectedGraph.id);
      // 刷新图谱列表以更新节点数
      await loadGraphs();
    } catch (error: any) {
      console.error('Failed to create node:', error);
      setToast({ message: t.teacher.knowledgeGraph.nodeCreateError + ': ' + (error.response?.data?.detail || error.message), type: 'error' });
    }
  };

  const handleUpdateNode = async () => {
    if (!selectedGraph || !editingNode || !nodeName.trim()) {
      setToast({ message: t.teacher.knowledgeGraph.placeholders.nodeName, type: 'warning' });
      return;
    }
    if (teacherId === undefined) {
      setToast({ message: '无法获取教师ID，请重新登录', type: 'error' });
      return;
    }

    try {
      await knowledgeGraphService.updateNode(editingNode.id, teacherId, {
        node_name: nodeName,
        node_content: nodeContent || undefined,
        parent_id: parentNodeId || undefined,
      });
      setToast({ message: t.teacher.knowledgeGraph.nodeUpdateSuccess, type: 'success' });
      setEditNodeModalOpen(false);
      resetNodeForm();
      await loadGraphTree(selectedGraph.id);
      // 刷新图谱列表以更新节点数
      await loadGraphs();
    } catch (error: any) {
      console.error('Failed to update node:', error);
      setToast({ message: t.teacher.knowledgeGraph.nodeUpdateError + ': ' + (error.response?.data?.detail || error.message), type: 'error' });
    }
  };

  const handleDeleteNode = async (node: KnowledgeNode) => {
    if (!selectedGraph || !confirm(t.teacher.knowledgeGraph.deleteNodeConfirm)) return;
    if (teacherId === undefined) {
      setToast({ message: '无法获取教师ID，请重新登录', type: 'error' });
      return;
    }
    
    try {
      await knowledgeGraphService.deleteNode(node.id, teacherId);
      setToast({ message: t.teacher.knowledgeGraph.nodeDeleteSuccess, type: 'success' });
      await loadGraphTree(selectedGraph.id);
      // 刷新图谱列表以更新节点数
      await loadGraphs();
    } catch (error: any) {
      console.error('Failed to delete node:', error);
      setToast({ message: t.teacher.knowledgeGraph.nodeDeleteError + ': ' + (error.response?.data?.detail || error.message), type: 'error' });
    }
  };

  const handleEditNode = (node: KnowledgeNode) => {
    setEditingNode(node);
    setNodeName(node.node_name);
    setNodeContent(node.node_content || '');
    setParentNodeId(node.parent_id || null);
    setEditNodeModalOpen(true);
  };

  // 递归获取所有节点选项（用于父节点选择）
  const getAllNodesForSelect = (nodes: KnowledgeNode[], excludeId?: number, level: number = 0): Array<{id: number, name: string, level: number}> => {
    const result: Array<{id: number, name: string, level: number}> = [];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      
      if (node.id !== excludeId) {
        // 使用全角空格实现层级缩进效果（参考组织管理）
        const indent = level > 0 ? '　'.repeat(level) + '├─ ' : '';
        const displayName = indent + node.node_name;
        result.push({ id: node.id, name: displayName, level });
        
        if (node.children && node.children.length > 0) {
          result.push(...getAllNodesForSelect(node.children, excludeId, level + 1));
        }
      }
    }
    return result;
  };

  // 渲染树状结构
  const renderTreeNode = (node: KnowledgeNode, level: number = 0, isLast: boolean = false, parentPath: boolean[] = []): JSX.Element => {
    const indent = level * 24; // 每级缩进24px
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div key={node.id} className="relative">
        <div 
          className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded relative"
          style={{ paddingLeft: `${indent + 8}px` }}
        >
          {/* 绘制连接线 */}
          {level > 0 && (
            <div className="absolute left-0 top-0 bottom-0 flex items-start" style={{ left: `${indent - 16}px`, width: '16px' }}>
              {/* 垂直连接线：显示所有父级路径的连接线 */}
              {parentPath.map((shouldHide, idx) => (
                <div
                  key={idx}
                  className="absolute top-0 bottom-0"
                  style={{
                    left: `${idx * 24}px`,
                    width: '1px',
                    backgroundColor: '#cbd5e1',
                    display: shouldHide ? 'none' : 'block'
                  }}
                />
              ))}
              {/* 当前节点的垂直连接线 */}
              <div
                className="absolute"
                style={{
                  left: `${(level - 1) * 24}px`,
                  top: 0,
                  bottom: isLast ? '50%' : 0,  // 最后一个节点的线只到中间，其他节点延伸到底部
                  width: '1px',
                  backgroundColor: '#cbd5e1',
                }}
              />
              {/* 水平连接线 */}
              <div
                className="absolute top-1/2"
                style={{
                  left: `${(level - 1) * 24}px`,
                  width: '16px',
                  height: '1px',
                  backgroundColor: '#cbd5e1',
                  transform: 'translateY(-50%)'
                }}
              />
            </div>
          )}
          
          <span className="text-sm font-medium">{node.node_name}</span>
          {node.node_content && (
            <span className="text-xs text-slate-500">- {node.node_content}</span>
          )}
          {selectedGraph && (
            <div className="flex gap-1 ml-auto">
              <button
                onClick={() => {
                  resetNodeForm();
                  setParentNodeId(node.id);
                  setCreateNodeModalOpen(true);
                }}
                className="px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded flex items-center gap-1"
                title={t.teacher.knowledgeGraph.addChildNode || '添加子节点'}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                {t.teacher.knowledgeGraph.addChildNode || '添加子节点'}
              </button>
              <button
                onClick={() => handleEditNode(node)}
                className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
              >
                {t.common.edit}
              </button>
              <button
                onClick={() => handleDeleteNode(node)}
                className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
              >
                {t.common.delete}
              </button>
            </div>
          )}
        </div>
        {hasChildren && (
          <div>
            {node.children!.map((child, index) => {
              const isChildLast = index === node.children!.length - 1;
              return renderTreeNode(child, level + 1, isChildLast, [...parentPath, !isLast]);
            })}
          </div>
        )}
      </div>
    );
  };

  // 渲染可视化视图
  const renderVisualization = () => {
    if (!graphTree || !graphTree.tree || graphTree.tree.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-slate-500">
          {t.teacher.knowledgeGraph.noNodes}
        </div>
      );
    }

    if (viewMode === 'tree') {
      return (
        <div className="p-6 overflow-auto">
          {graphTree.tree.map((node, index) => {
            const isLast = index === graphTree.tree.length - 1;
            return renderTreeNode(node, 0, isLast, []);
          })}
        </div>
      );
    } else if (viewMode === 'mindmap') {
      // 脑图展示 - 使用改进的CSS布局
      const renderMindMapNode = (node: KnowledgeNode, isRoot: boolean = false, level: number = 0): JSX.Element => {
        return (
          <div key={node.id} className={`${isRoot ? 'mb-8' : ''}`}>
            <div className={`${isRoot ? 'text-center' : ''} mb-4`}>
              <div className={`inline-block ${isRoot ? 'bg-blue-600 text-white px-6 py-3 rounded-xl text-lg font-bold' : 'bg-blue-50 border-2 border-blue-200 rounded-lg p-4 min-w-[200px]'}`}>
                <div className={`font-bold ${isRoot ? 'text-white' : 'text-blue-900'} mb-2`}>{node.node_name}</div>
                {node.node_content && (
                  <div className={`text-sm ${isRoot ? 'text-blue-100' : 'text-slate-600'}`}>{node.node_content}</div>
                )}
              </div>
            </div>
            {node.children && node.children.length > 0 && (
              <div className={`flex flex-wrap ${isRoot ? 'justify-center' : 'justify-start'} gap-4 mt-4`}>
                {node.children.map(child => renderMindMapNode(child, false, level + 1))}
              </div>
            )}
          </div>
        );
      };
      
      return (
        <div className="p-6 overflow-auto">
          <div className="flex flex-col items-center">
            {graphTree.tree.length > 0 && renderMindMapNode(graphTree.tree[0], true)}
            {graphTree.tree.length > 1 && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {graphTree.tree.slice(1).map(node => renderMindMapNode(node, false))}
              </div>
            )}
          </div>
        </div>
      );
    } else {
      // 图谱展示 - 使用G6可视化
      return (
        <div className="relative w-full h-[700px] bg-white border border-slate-200 rounded-lg">
          <div ref={graphContainerRef} className="w-full h-full" />
          {(!graphTree || !graphTree.tree || graphTree.tree.length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
              {t.teacher.knowledgeGraph.noNodes}
            </div>
          )}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm text-xs text-slate-600">
            💡 点击节点展开/收起子节点，鼠标滚轮缩放，拖动画布移动
          </div>
        </div>
      );
    }
  };

  return (
    <TeacherLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 mb-1">{t.teacher.knowledgeGraph.title}</h1>
              <p className="text-sm text-slate-500">{t.teacher.knowledgeGraph.subtitle}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  resetGraphForm();
                  setAiGenerateModalOpen(true);
                }}
                className="px-6 py-3 text-sm font-bold rounded-full transition-colors active:scale-95 text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
                AI生成知识图谱
              </button>
              <button
                onClick={() => {
                  resetGraphForm();
                  setCreateGraphModalOpen(true);
                }}
                className="px-6 py-3 text-sm font-bold rounded-full transition-colors active:scale-95 text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                {t.teacher.knowledgeGraph.createGraph}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          {loading ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-sm text-slate-500">{t.common.loading}</p>
            </div>
          ) : graphs.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
              <p className="text-slate-500">{t.teacher.knowledgeGraph.noGraphs}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {graphs.map((graph) => (
                <div key={graph.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                      {graph.graph_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleViewGraph(graph)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title={t.teacher.knowledgeGraph.viewGraph}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEditGraph(graph)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                        title={t.teacher.knowledgeGraph.editGraph}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteGraph(graph)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title={t.teacher.knowledgeGraph.deleteGraph}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1">{graph.graph_name}</h3>
                  {graph.description && (
                    <p className="text-xs text-slate-500 mb-2 line-clamp-2">{graph.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                    {graph.node_count} {t.teacher.knowledgeGraph.nodeCount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Graph Modal */}
      <Modal isOpen={createGraphModalOpen} onClose={() => setCreateGraphModalOpen(false)} title={t.teacher.knowledgeGraph.createGraph}>
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.knowledgeGraph.graphName} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={graphName}
              onChange={(e) => setGraphName(e.target.value)}
              placeholder={t.teacher.knowledgeGraph.placeholders.graphName}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.knowledgeGraph.description}
            </label>
            <textarea
              value={graphDescription}
              onChange={(e) => setGraphDescription(e.target.value)}
              placeholder={t.teacher.knowledgeGraph.placeholders.description}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setCreateGraphModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleCreateGraph}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {t.common.create}
            </button>
          </div>
        </div>
      </Modal>

      {/* AI Generate Graph Modal */}
      <Modal isOpen={aiGenerateModalOpen} onClose={() => setAiGenerateModalOpen(false)} title="AI生成知识图谱" size="lg">
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              知识图谱名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={aiGraphName}
              onChange={(e) => setAiGraphName(e.target.value)}
              placeholder="请输入知识图谱名称"
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              描述（可选）
            </label>
            <textarea
              value={aiGraphDescription}
              onChange={(e) => setAiGraphDescription(e.target.value)}
              placeholder="请输入知识图谱描述"
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              上传PDF文档 <span className="text-red-500">*</span>
              <span className="text-xs text-slate-500 ml-2">（文件大小不超过1MB）</span>
            </label>
            <div className="mt-2">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // 检查文件大小（1MB = 1024 * 1024 bytes）
                    const maxSize = 1024 * 1024;
                    if (file.size > maxSize) {
                      setToast({ message: `文件大小超过限制（${(file.size / 1024 / 1024).toFixed(2)}MB），最大允许1MB`, type: 'warning' });
                      e.target.value = '';
                      setPdfFile(null);
                      return;
                    }
                    setPdfFile(file);
                    setAiGenerateError(null);
                  }
                }}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              {pdfFile && (
                <div className="mt-2 p-3 bg-slate-50 rounded-md">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                    </svg>
                    <span className="text-sm text-slate-700">{pdfFile.name}</span>
                    <span className="text-xs text-slate-500 ml-auto">{(pdfFile.size / 1024).toFixed(2)} KB</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {aiGenerateError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{aiGenerateError}</p>
            </div>
          )}
          
          {aiGenerating && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-sm text-blue-600">AI正在分析PDF文档并生成知识图谱，请稍候...</p>
            </div>
          )}
          
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setAiGenerateModalOpen(false);
                setPdfFile(null);
                setAiGraphName('');
                setAiGraphDescription('');
                setAiGenerateError(null);
              }}
              disabled={aiGenerating}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 disabled:opacity-50"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleAIGenerateGraph}
              disabled={aiGenerating || !pdfFile || !aiGraphName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {aiGenerating ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  生成中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                  </svg>
                  开始生成
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Graph Modal */}
      <Modal isOpen={editGraphModalOpen} onClose={() => setEditGraphModalOpen(false)} title={t.teacher.knowledgeGraph.editGraph}>
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.knowledgeGraph.graphName} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={graphName}
              onChange={(e) => setGraphName(e.target.value)}
              placeholder={t.teacher.knowledgeGraph.placeholders.graphName}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.knowledgeGraph.description}
            </label>
            <textarea
              value={graphDescription}
              onChange={(e) => setGraphDescription(e.target.value)}
              placeholder={t.teacher.knowledgeGraph.placeholders.description}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setEditGraphModalOpen(false);
                resetGraphForm();
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleUpdateGraph}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {t.common.update}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Graph Modal */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title={selectedGraph?.graph_name || ''} size="xl">
        <div className="p-6">
          {/* View Mode Selector */}
          <div className="mb-4 flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                viewMode === 'tree'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              {t.teacher.knowledgeGraph.viewMode.tree}
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                viewMode === 'graph'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              {t.teacher.knowledgeGraph.viewMode.graph}
            </button>
            {selectedGraph && (
              <button
                onClick={() => {
                  resetNodeForm();
                  setCreateNodeModalOpen(true);
                }}
                className="ml-auto px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                {t.teacher.knowledgeGraph.createNode}
              </button>
            )}
          </div>

          {/* Visualization Area */}
          <div className="bg-slate-50 rounded-lg min-h-[400px] max-h-[600px] overflow-auto">
            {renderVisualization()}
          </div>
        </div>
      </Modal>

      {/* Create Node Modal */}
      <Modal isOpen={createNodeModalOpen} onClose={() => setCreateNodeModalOpen(false)} title={t.teacher.knowledgeGraph.createNode}>
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.knowledgeGraph.nodeName} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              placeholder={t.teacher.knowledgeGraph.placeholders.nodeName}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.knowledgeGraph.nodeContent}
            </label>
            <textarea
              value={nodeContent}
              onChange={(e) => setNodeContent(e.target.value)}
              placeholder={t.teacher.knowledgeGraph.placeholders.nodeContent}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.knowledgeGraph.parentNode}
            </label>
            <select
              value={parentNodeId || ''}
              onChange={(e) => setParentNodeId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-sm text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm hover:border-slate-300 cursor-pointer"
            >
              <option value="" className="py-2">{t.teacher.knowledgeGraph.rootNode}</option>
              {graphTree && graphTree.tree && getAllNodesForSelect(graphTree.tree).map(node => (
                <option key={node.id} value={node.id} className="py-2">
                  {node.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setCreateNodeModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleCreateNode}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {t.common.create}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Node Modal */}
      <Modal isOpen={editNodeModalOpen} onClose={() => setEditNodeModalOpen(false)} title={t.teacher.knowledgeGraph.editNode}>
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.knowledgeGraph.nodeName} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              placeholder={t.teacher.knowledgeGraph.placeholders.nodeName}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.knowledgeGraph.nodeContent}
            </label>
            <textarea
              value={nodeContent}
              onChange={(e) => setNodeContent(e.target.value)}
              placeholder={t.teacher.knowledgeGraph.placeholders.nodeContent}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.knowledgeGraph.parentNode}
            </label>
            <select
              value={parentNodeId || ''}
              onChange={(e) => setParentNodeId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-sm text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm hover:border-slate-300 cursor-pointer"
            >
              <option value="" className="py-2">{t.teacher.knowledgeGraph.rootNode}</option>
              {graphTree && graphTree.tree && getAllNodesForSelect(graphTree.tree, editingNode?.id).map(node => (
                <option key={node.id} value={node.id} className="py-2">
                  {node.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setEditNodeModalOpen(false);
                resetNodeForm();
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleUpdateNode}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {t.common.update}
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Toast提示 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </TeacherLayout>
  );
}

