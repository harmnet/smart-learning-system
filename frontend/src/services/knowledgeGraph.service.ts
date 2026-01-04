import apiClient from '@/lib/api-client';

export interface KnowledgeNode {
  id: number;
  node_name: string;
  node_content?: string;
  parent_id?: number;
  sort_order: number;
  resource_count?: number;
  total_resource_count?: number;
  children?: KnowledgeNode[];
}

export interface KnowledgeGraph {
  id: number;
  teacher_id: number;
  graph_name: string;
  description?: string;
  node_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GraphTree {
  graph_id: number;
  graph_name: string;
  description?: string;
  tree: KnowledgeNode[];
}

export interface GraphCreate {
  graph_name: string;
  description?: string;
}

export interface GraphUpdate {
  graph_name?: string;
  description?: string;
}

export interface NodeCreate {
  node_name: string;
  node_content?: string;
  parent_id?: number;
  sort_order?: number;
}

export interface NodeUpdate {
  node_name?: string;
  node_content?: string;
  parent_id?: number;
  sort_order?: number;
}

class KnowledgeGraphService {
  /**
   * 获取知识图谱列表
   */
  async getAll(teacherId: number): Promise<KnowledgeGraph[]> {
    console.log('📡 [知识图谱服务] 调用getAll，teacherId:', teacherId);
    console.log('📡 [知识图谱服务] API URL: /teacher/knowledge-graphs/');
    console.log('📡 [知识图谱服务] 请求参数: { teacher_id:', teacherId, '}');
    const response = await apiClient.get<KnowledgeGraph[]>('/teacher/knowledge-graphs/', {
      params: { teacher_id: teacherId }
    });
    console.log('✅ [知识图谱服务] API响应:', response.data);
    return response.data;
  }

  /**
   * 创建知识图谱
   */
  async create(teacherId: number, data: GraphCreate): Promise<any> {
    const response = await apiClient.post('/teacher/knowledge-graphs/', data, {
      params: { teacher_id: teacherId }
    });
    return response.data;
  }

  /**
   * 更新知识图谱
   */
  async update(graphId: number, teacherId: number, data: GraphUpdate): Promise<any> {
    const response = await apiClient.put(`/teacher/knowledge-graphs/${graphId}`, data, {
      params: { teacher_id: teacherId }
    });
    return response.data;
  }

  /**
   * 删除知识图谱
   */
  async delete(graphId: number, teacherId: number): Promise<void> {
    await apiClient.delete(`/teacher/knowledge-graphs/${graphId}`, {
      params: { teacher_id: teacherId }
    });
  }

  /**
   * 获取知识图谱的树状结构
   */
  async getTree(graphId: number, teacherId: number): Promise<GraphTree> {
    const response = await apiClient.get<GraphTree>(`/teacher/knowledge-graphs/${graphId}/tree`, {
      params: { teacher_id: teacherId }
    });
    return response.data;
  }

  /**
   * 创建知识节点
   */
  async createNode(graphId: number, teacherId: number, data: NodeCreate): Promise<any> {
    const response = await apiClient.post(`/teacher/knowledge-graphs/${graphId}/nodes`, data, {
      params: { teacher_id: teacherId }
    });
    return response.data;
  }

  /**
   * 更新知识节点
   */
  async updateNode(nodeId: number, teacherId: number, data: NodeUpdate): Promise<any> {
    const response = await apiClient.put(`/teacher/knowledge-graphs/nodes/${nodeId}`, data, {
      params: { teacher_id: teacherId }
    });
    return response.data;
  }

  /**
   * 删除知识节点
   */
  async deleteNode(nodeId: number, teacherId: number): Promise<void> {
    await apiClient.delete(`/teacher/knowledge-graphs/nodes/${nodeId}`, {
      params: { teacher_id: teacherId }
    });
  }

  /**
   * 移动节点
   */
  async moveNode(nodeId: number, teacherId: number, targetParentId: number | null): Promise<any> {
    const response = await apiClient.post(
      `/teacher/knowledge-graphs/nodes/${nodeId}/move`,
      null,
      {
        params: {
          teacher_id: teacherId,
          target_parent_id: targetParentId
        }
      }
    );
    return response.data;
  }

  /**
   * 从PDF生成知识图谱
   */
  async generateFromPDF(
    teacherId: number,
    file: File,
    graphName: string,
    description?: string
  ): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('graph_name', graphName);
    formData.append('teacher_id', teacherId.toString());
    if (description) {
      formData.append('description', description);
    }

    const response = await apiClient.post(
      '/teacher/knowledge-graphs/ai-generate-from-pdf',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 120秒超时，因为AI生成可能需要较长时间
      }
    );
    return response.data;
  }

  /**
   * 递归获取知识图谱节点及其所有子节点的关联资源
   */
  async getNodeResourcesRecursive(graphId: number, nodeId: number, teacherId: number): Promise<any> {
    const response = await apiClient.get(
      `/teacher/knowledge-graphs/${graphId}/nodes/${nodeId}/resources-recursive`,
      { params: { teacher_id: teacherId } }
    );
    return response.data;
  }
}

export const knowledgeGraphService = new KnowledgeGraphService();
export default knowledgeGraphService;

