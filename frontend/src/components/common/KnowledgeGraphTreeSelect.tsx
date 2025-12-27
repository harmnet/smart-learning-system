"use client";

import { useState, useEffect, useRef } from 'react';
import { knowledgeGraphService, KnowledgeNode, GraphTree } from '@/services/knowledgeGraph.service';
import { useLanguage } from '@/contexts/LanguageContext';

interface KnowledgeGraphTreeSelectProps {
  teacherId: number;
  value?: string; // 当前选中的知识点（节点名称）
  onChange: (nodeName: string | null) => void;
  placeholder?: string;
}

export default function KnowledgeGraphTreeSelect({
  teacherId,
  value,
  onChange,
  placeholder = '请选择知识点'
}: KnowledgeGraphTreeSelectProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [graphs, setGraphs] = useState<any[]>([]);
  const [selectedGraphId, setSelectedGraphId] = useState<number | null>(null);
  const [graphTree, setGraphTree] = useState<GraphTree | null>(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGraphs();
  }, []);

  useEffect(() => {
    if (selectedGraphId) {
      loadGraphTree(selectedGraphId);
    }
  }, [selectedGraphId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadGraphs = async () => {
    try {
      const data = await knowledgeGraphService.getAll(teacherId);
      setGraphs(data);
      if (data.length > 0 && !selectedGraphId) {
        setSelectedGraphId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load graphs:', error);
    }
  };

  const loadGraphTree = async (graphId: number) => {
    try {
      setLoading(true);
      const tree = await knowledgeGraphService.getTree(graphId, teacherId);
      setGraphTree(tree);
    } catch (error) {
      console.error('Failed to load graph tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const findNodePath = (nodes: KnowledgeNode[], targetName: string, path: string[] = []): string[] | null => {
    for (const node of nodes) {
      const currentPath = [...path, node.node_name];
      if (node.node_name === targetName) {
        return currentPath;
      }
      if (node.children && node.children.length > 0) {
        const found = findNodePath(node.children, targetName, currentPath);
        if (found) return found;
      }
    }
    return null;
  };

  const getDisplayText = (): string => {
    if (!value) return placeholder;
    if (!graphTree) return value;
    
    const path = findNodePath(graphTree.tree, value);
    if (path) {
      return path.join(' > ');
    }
    return value;
  };

  const handleNodeSelect = (nodeName: string) => {
    onChange(nodeName);
    setIsOpen(false);
  };

  const renderTreeNode = (node: KnowledgeNode, level: number = 0): JSX.Element => {
    const isSelected = node.node_name === value;
    return (
      <div key={node.id}>
        <div
          className={`
            px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors flex items-center gap-2
            ${isSelected ? 'bg-blue-100 text-blue-700' : 'text-slate-700'}
          `}
          style={{ paddingLeft: `${12 + level * 20}px` }}
          onClick={() => handleNodeSelect(node.node_name)}
        >
          <div className="flex items-center gap-2 flex-1">
            {node.children && node.children.length > 0 ? (
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            ) : (
              <span className="w-4 h-4"></span>
            )}
            <span className="text-sm">{node.node_name}</span>
            {node.node_content && (
              <span className="text-xs text-slate-400 truncate">- {node.node_content}</span>
            )}
          </div>
          {isSelected && (
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          )}
        </div>
        {node.children && node.children.length > 0 && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm bg-white cursor-pointer hover:border-blue-500 transition-colors flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`text-sm ${value ? 'text-slate-900' : 'text-slate-400'}`}>
          {getDisplayText()}
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-[500px] overflow-auto">
          {graphs.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              {t.teacher.knowledgeGraph.noGraphs}
            </div>
          ) : (
            <>
              {/* 知识图谱选择 */}
              {graphs.length > 1 && (
                <div className="p-2 border-b border-slate-200">
                  <select
                    value={selectedGraphId || ''}
                    onChange={(e) => setSelectedGraphId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {graphs.map(graph => (
                      <option key={graph.id} value={graph.id}>
                        {graph.graph_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 树状节点列表 */}
              {loading ? (
                <div className="p-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : graphTree && graphTree.tree.length > 0 ? (
                <div className="py-2">
                  {graphTree.tree.map(node => renderTreeNode(node))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-slate-500">
                  {t.teacher.knowledgeGraph.noNodes}
                </div>
              )}

              {/* 清除选择 */}
              {value && (
                <div className="p-2 border-t border-slate-200">
                  <button
                    onClick={() => {
                      onChange(null);
                      setIsOpen(false);
                    }}
                    className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    清除选择
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

