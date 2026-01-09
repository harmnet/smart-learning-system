'use client';

import React, { useEffect, useState } from 'react';
import { knowledgeGraphService, KnowledgeNode } from '@/services/knowledgeGraph.service';

interface KnowledgeGraphTreeSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface FlatNode {
  id: number;
  name: string;
  depth: number;
  graphName?: string;
}

export default function KnowledgeGraphTreeSelect({
  value,
  onChange,
  placeholder = '请选择知识点',
  disabled = false
}: KnowledgeGraphTreeSelectProps) {
  const [flatNodes, setFlatNodes] = useState<FlatNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadKnowledgeNodes();
  }, []);

  const loadKnowledgeNodes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const teacherId = localStorage.getItem('teacher_id') || localStorage.getItem('user_id');
      if (!teacherId) {
        throw new Error('未找到教师ID');
      }

      // 获取所有知识图谱
      const graphs = await knowledgeGraphService.getAll(parseInt(teacherId));
      
      // 收集所有知识点节点（保留层级信息）
      const allFlatNodes: FlatNode[] = [];
      
      for (const graph of graphs) {
        const tree = await knowledgeGraphService.getTree(graph.id, parseInt(teacherId));
        
        // 递归提取节点并保留层级深度
        const extractNodesWithDepth = (nodes: KnowledgeNode[], depth: number = 0): void => {
          for (const node of nodes) {
            allFlatNodes.push({
              id: node.id,
              name: node.node_name,
              depth: depth,
              graphName: depth === 0 ? graph.graph_name : undefined
            });
            
            if (node.children && node.children.length > 0) {
              extractNodesWithDepth(node.children, depth + 1);
            }
          }
        };
        
        extractNodesWithDepth(tree.tree);
      }
      
      setFlatNodes(allFlatNodes);
    } catch (err) {
      console.error('加载知识点失败:', err);
      setError('加载知识点失败');
    } finally {
      setLoading(false);
    }
  };

  // 根据层级深度生成缩进前缀
  const getIndentPrefix = (depth: number): string => {
    if (depth === 0) return '';
    return '　'.repeat(depth) + '└─ ';
  };

  return (
    <div className="w-full">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled || loading}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">{loading ? '加载中...' : placeholder}</option>
        {flatNodes.map((node) => (
          <option key={node.id} value={node.name}>
            {getIndentPrefix(node.depth)}{node.name}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

