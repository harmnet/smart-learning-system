'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { adminService } from '@/services/admin.service';
import { majorService } from '@/services/major.service';
import { useLanguage } from '@/contexts/LanguageContext';

// 定义接口
interface Class {
  id: number;
  name: string;
  code?: string;
  major_id: number;
  major_name?: string;
  grade?: string;
  student_count?: number;
}

interface Major {
  id: number;
  name: string;
  description?: string;
}

interface GradeGroup {
  grade: string;
  classes: Class[];
}

interface MajorNode {
  id: number;
  name: string;
  grades: GradeGroup[];
}

export default function ClassOverviewPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const allDataRef = useRef<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] }); // 使用ref存储完整数据
  const [hasData, setHasData] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set()); // 记录展开的节点
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; content: any }>({
    visible: false,
    x: 0,
    y: 0,
    content: null,
  });

  useEffect(() => {
    loadData();
    
    // 组件卸载时销毁图表
    return () => {
      if (graphRef.current) {
        graphRef.current.destroy();
        graphRef.current = null;
      }
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // 获取所有班级
      const classesResponse = await adminService.getClasses({ skip: 0, limit: 1000 });
      const classes: Class[] = classesResponse.items || [];
      console.log('📚 Classes loaded:', classes.length);

      // 获取所有专业
      const majorsResponse = await majorService.getAll({ skip: 0, limit: 1000 });
      const majors: Major[] = majorsResponse.items || [];
      console.log('🎓 Majors loaded:', majors.length);

      // 按专业和年级分组班级
      const majorMap = new Map<number, MajorNode>();

      classes.forEach((cls) => {
        if (!cls.major_id || !cls.grade) return;

        if (!majorMap.has(cls.major_id)) {
          const major = majors.find(m => m.id === cls.major_id);
          if (major) {
            majorMap.set(cls.major_id, {
              id: major.id,
              name: major.name,
              grades: []
            });
          }
        }

        const majorNode = majorMap.get(cls.major_id);
        if (majorNode) {
          let gradeGroup = majorNode.grades.find(g => g.grade === cls.grade);
          if (!gradeGroup) {
            gradeGroup = { grade: cls.grade, classes: [] };
            majorNode.grades.push(gradeGroup);
          }
          gradeGroup.classes.push(cls);
        }
      });

      const majorsList = Array.from(majorMap.values());

      // 构建图数据结构（Graphin 格式）
      const nodes: any[] = [];
      const edges: any[] = [];

      majorsList.forEach((major) => {
        // 专业节点（绿色，最大）
        const majorNodeId = `major-${major.id}`;
        nodes.push({
          id: majorNodeId,
          label: major.name,
          style: {
            size: 28,  // 随文字适度调大
            fill: '#10b981',  // 绿色
            stroke: '#059669',
            lineWidth: 2,
            fontSize: 18,  // 用户建议字号
            fontWeight: 600,
          },
          data: {
            nodeType: 'major',
            majorData: major
          }
        });

        // 年级节点（蓝色，中等）
        major.grades.forEach((grade) => {
          const gradeNodeId = `grade-${major.id}-${grade.grade}`;
          nodes.push({
            id: gradeNodeId,
            label: grade.grade,
            style: {
              size: 22,  // 随文字适度调大
              fill: '#3b82f6',  // 蓝色
              stroke: '#2563eb',
              lineWidth: 1.5,
              fontSize: 16,  // 用户建议字号
              fontWeight: 500,
            },
            data: {
              nodeType: 'grade',
              gradeData: grade
            }
          });

          // 专业到年级的边
          edges.push({
            source: majorNodeId,
            target: gradeNodeId,
          });

          // 班级节点（紫色，最小）
          grade.classes.forEach((cls) => {
            const classNodeId = `class-${cls.id}`;
            nodes.push({
              id: classNodeId,
              label: cls.name,
              style: {
                size: 18,  // 随文字适度调大
                fill: '#a855f7',  // 紫色
                stroke: '#9333ea',
                lineWidth: 1,
                fontSize: 14,  // 用户建议字号
                fontWeight: 400,
              },
              data: {
                nodeType: 'class',
                classData: {
                  ...cls,
                  majorName: major.name, // 注入专业名称
                  gradeName: grade.grade // 注入年级名称
                }
              }
            });

            // 年级到班级的边
            edges.push({
              source: gradeNodeId,
              target: classNodeId,
            });
          });
        });
      });

      console.log('✅ Graph data prepared:', { nodes: nodes.length, edges: edges.length });
      
      // 保存完整数据到ref（这样事件处理器能访问到最新数据）
      allDataRef.current = { nodes, edges };
      
      // 初始只显示专业节点
      const majorNodes = nodes.filter(n => n.data.nodeType === 'major');
      
      // 渲染图表（初始只显示专业）
      await renderGraph({ nodes: majorNodes, edges: [] });
      
      setHasData(true);
      setLoading(false);
    } catch (error) {
      console.error('❌ Failed to load data:', error);
      setLoading(false);
    }
  };

  // 渲染 G6 图表
  const renderGraph = async (data: { nodes: any[]; edges: any[] }) => {
    if (!containerRef.current) {
      console.warn('⚠️ Container not ready');
      return;
    }

    try {
      // 动态导入 G6（避免 SSR 问题）
      const { Graph } = await import('@antv/g6');

      console.log('✅ G6 loaded, creating graph...');

      // 销毁旧图表
      if (graphRef.current) {
        graphRef.current.destroy();
      }
      // 清空容器，防止重复渲染（关键修复：解决初始节点不消失和重影问题）
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      // 创建新图表
      const graph = new Graph({
        container: containerRef.current,
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
        data,  // 直接传入数据
        layout: {
          type: 'radial',
          unitRadius: 160,   // 文字变大，增加半径
          linkDistance: 140, // 文字变大，增加连线
          preventOverlap: true,
          nodeSize: 40,      // 增加防重叠计算的节点尺寸
          strictRadial: false, 
        },
        node: {
          style: {
            size: (d: any) => d.style?.size || 60,
            fill: (d: any) => d.style?.fill || '#5B8FF9',
            stroke: (d: any) => d.style?.stroke || '#3B77DB',
            lineWidth: (d: any) => d.style?.lineWidth || 2,
            labelText: (d: any) => d.label || d.id,
            labelFill: '#1e293b',
            labelFontSize: (d: any) => d.style?.fontSize || 13,
            labelFontWeight: (d: any) => d.style?.fontWeight || 'bold',
            labelPosition: 'bottom',
            labelOffsetY: 8,
            labelBackgroundFill: '#ffffff',
            labelBackgroundRadius: 3,
            labelPadding: [2, 6, 2, 6],
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
            stroke: '#cbd5e1',
            lineWidth: 2,
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
        // autoFit: 'view',  // 禁用自动缩放，防止节点过少时被过度放大
        zoom: 1, // 初始缩放比例
      });

      // 渲染图表
      await graph.render();
      
      // 居中显示
      graph.fitCenter();
      // 强制设置为 1:1 缩放，避免巨大化
      graph.zoomTo(1); 

      // 监听节点点击事件
      graph.on('node:click', (event: any) => {
        console.log('🔵 Node clicked:', event);
        console.log('🔍 Event keys:', Object.keys(event));
        console.log('🔍 Event.target:', event.target);
        console.log('🔍 Event.item:', event.item);
        
        // G6 v5 中，节点ID通常在 target.id 或 target.cfg.id 中
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
        
        console.log('📍 Extracted nodeId:', nodeId);
        if (nodeId) {
          const node = allDataRef.current.nodes.find(n => n.id === nodeId);
          if (node && node.data.nodeType === 'class') {
            // 点击班级节点显示详情
            const { client } = event;
            setTooltip({
              visible: true,
              x: client.x + 20,
              y: client.y - 20,
              content: node.data.classData
            });
          } else {
            handleNodeClick(nodeId);
          }
        }
      });

      // 监听鼠标悬停事件
      graph.on('node:pointerenter', (event: any) => {
        let nodeId = null;
        if (event.target && event.target.id) {
          nodeId = event.target.id;
        } else if (event.item && event.item.getID) {
          nodeId = event.item.getID();
        }

        if (nodeId) {
          const node = allDataRef.current.nodes.find(n => n.id === nodeId);
          if (node && node.data.nodeType === 'class') {
            const { client } = event;
            setTooltip({
              visible: true,
              x: client.x + 20,
              y: client.y - 20,
              content: node.data.classData
            });
            // 改变光标样式
            if (containerRef.current) containerRef.current.style.cursor = 'pointer';
          }
        }
      });

      // 监听鼠标移出事件
      graph.on('node:pointerleave', () => {
        setTooltip(prev => ({ ...prev, visible: false }));
        if (containerRef.current) containerRef.current.style.cursor = 'default';
      });

      console.log('✅ Event listener registered');

      graphRef.current = graph;
      console.log('✅ Graph rendered successfully');
    } catch (error) {
      console.error('❌ Failed to render graph:', error);
    }
  };

  // 处理节点点击，展开/收起子节点
  const handleNodeClick = async (nodeId: string) => {
    console.log('🎯 handleNodeClick called with nodeId:', nodeId);
    const allData = allDataRef.current; // 从ref获取最新数据
    const clickedNode = allData.nodes.find(n => n.id === nodeId);
    if (!clickedNode) {
      console.warn('⚠️ Node not found:', nodeId);
      console.log('📦 Available nodes:', allData.nodes.map(n => n.id));
      return;
    }
    console.log('✅ Found node:', clickedNode);

    const nodeType = clickedNode.data.nodeType;
    
    // 只有专业和年级节点可以展开
    if (nodeType !== 'major' && nodeType !== 'grade') return;

    const newExpandedNodes = new Set(expandedNodes);
    
    if (expandedNodes.has(nodeId)) {
      // 收起：移除该节点及其所有子孙节点
      newExpandedNodes.delete(nodeId);
      
      // 递归移除所有子孙节点
      const removeDescendants = (parentId: string) => {
        const childEdges = allData.edges.filter(e => e.source === parentId);
        childEdges.forEach(edge => {
          newExpandedNodes.delete(edge.target);
          removeDescendants(edge.target);
        });
      };
      removeDescendants(nodeId);
    } else {
      // 展开：添加直接子节点
      newExpandedNodes.add(nodeId);
    }

    setExpandedNodes(newExpandedNodes);

    // 计算应该显示的节点和边
    const visibleNodes: any[] = [];
    const visibleEdges: any[] = [];
    const visibleNodeIds = new Set<string>();

    // 专业节点始终可见
    allData.nodes.filter(n => n.data.nodeType === 'major').forEach(n => {
      visibleNodes.push(n);
      visibleNodeIds.add(n.id);
    });

    // 对于已展开的节点，添加它们的直接子节点
    // 需要确保展开的节点本身及其父链都可见
    const addNodeAndChildren = (nodeId: string) => {
      const node = allData.nodes.find(n => n.id === nodeId);
      if (!node) return;
      
      // 确保节点本身可见
      if (!visibleNodeIds.has(nodeId)) {
        visibleNodes.push(node);
        visibleNodeIds.add(nodeId);
      }
      
      // 如果节点被展开，添加其子节点
      if (newExpandedNodes.has(nodeId)) {
        const childEdges = allData.edges.filter(e => e.source === nodeId);
        childEdges.forEach(edge => {
          const childNode = allData.nodes.find(n => n.id === edge.target);
          if (childNode && !visibleNodeIds.has(childNode.id)) {
            visibleNodes.push(childNode);
            visibleNodeIds.add(childNode.id);
          }
        });
      }
    };

    // 遍历所有展开的节点
    newExpandedNodes.forEach(expandedId => {
      addNodeAndChildren(expandedId);
    });

    // 只添加两端节点都可见的边
    allData.edges.forEach(edge => {
      if (visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)) {
        visibleEdges.push(edge);
      }
    });

    console.log('🔄 Rendering with:', { 
      nodes: visibleNodes.length, 
      edges: visibleEdges.length,
      expandedNodes: Array.from(newExpandedNodes),
      visibleNodeIds: Array.from(visibleNodeIds) 
    });

    // 重新渲染图表
    await renderGraph({ nodes: visibleNodes, edges: visibleEdges });
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t.admin.classes.overview.title}</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">{t.admin.classes.overview.subtitle}</p>
        </div>
        <Link
          href="/admin/classes"
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold text-sm transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-blue-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          {t.common.back}
        </Link>
      </div>

      {/* Legend */}
      <div className="mb-6 flex items-center gap-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-500 to-green-600 border-2 border-green-700"></div>
          <span className="text-sm font-bold text-slate-700">{t.admin.classes.overview.major}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-700"></div>
          <span className="text-sm font-bold text-slate-700">{t.admin.classes.overview.grade}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-purple-700"></div>
          <span className="text-sm font-bold text-slate-700">{t.admin.classes.overview.class}</span>
        </div>
        <div className="ml-auto text-xs text-slate-400 font-medium">{t.admin.classes.overview.tip}</div>
      </div>

      {/* Graph Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden relative" style={{ height: 'calc(100vh - 200px)' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
              <p className="text-lg font-bold text-slate-600">{t.common.loading}</p>
            </div>
          </div>
        )}
        
        {!loading && !hasData && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <p className="text-lg font-bold text-slate-600 mb-1">{t.admin.classes.overview.noData}</p>
              <p className="text-sm text-slate-400">{t.admin.classes.overview.noDataHint}</p>
            </div>
          </div>
        )}

        {/* G6 容器 */}
        <div ref={containerRef} className="w-full h-full"></div>
      </div>

      {/* Tooltip */}
      {tooltip.visible && tooltip.content && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            minWidth: '220px',
            pointerEvents: 'none',
            backdropFilter: 'blur(4px)',
          }}
          className="animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <div className="text-sm font-bold text-gray-900">{tooltip.content.name}</div>
          </div>
          <div className="text-xs text-gray-600 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">{t.admin.classes.overview.classCode}</span>
              <span className="font-bold font-mono text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">{tooltip.content.code || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">{t.admin.classes.columns.major}</span>
              <span className="font-medium text-gray-800">{tooltip.content.majorName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">{t.admin.classes.columns.grade}</span>
              <span className="font-medium text-gray-800">{tooltip.content.gradeName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">{t.admin.classes.columns.studentCount}</span>
              <span className="font-bold text-gray-900">{tooltip.content.student_count || 0} {t.admin.classes.heatmap.students}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
