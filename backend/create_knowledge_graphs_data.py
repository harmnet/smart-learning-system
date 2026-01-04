"""
创建知识图谱测试数据

这个脚本将创建几个示例知识图谱及其节点
"""
import asyncio
import sys
from pathlib import Path

# 添加项目根目录到Python路径
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from app.db.session import engine, get_db
from sqlalchemy.ext.asyncio import AsyncSession


async def create_knowledge_graph_data():
    """创建知识图谱测试数据"""
    
    # 获取第一个教师ID（张老师）
    async with engine.begin() as conn:
        result = await conn.execute(
            text("SELECT id FROM users WHERE role = 'teacher' LIMIT 1")
        )
        teacher_row = result.fetchone()
        
        if not teacher_row:
            print("❌ 没有找到教师用户，请先创建教师账号")
            return
        
        teacher_id = teacher_row[0]
        print(f"✅ 找到教师ID: {teacher_id}")
        
        # 清空现有的知识图谱数据
        await conn.execute(text("DELETE FROM knowledge_nodes"))
        await conn.execute(text("DELETE FROM knowledge_graphs"))
        print("✅ 清空现有数据")
        
        # 创建知识图谱和节点
        graphs_data = [
            {
                "name": "Python编程基础",
                "description": "涵盖Python语言的核心概念和基础知识",
                "nodes": [
                    {
                        "name": "Python简介",
                        "content": "Python是一种高级编程语言，以其简洁和易读性而闻名",
                        "children": [
                            {"name": "Python的历史", "content": "由Guido van Rossum于1991年创建"},
                            {"name": "Python的特点", "content": "简洁、易读、功能强大、跨平台"},
                            {"name": "Python的应用领域", "content": "Web开发、数据分析、人工智能、自动化等"}
                        ]
                    },
                    {
                        "name": "基础语法",
                        "content": "Python的基本语法规则和编程结构",
                        "children": [
                            {"name": "变量与数据类型", "content": "整数、浮点数、字符串、布尔值、列表、元组、字典、集合"},
                            {"name": "运算符", "content": "算术运算符、比较运算符、逻辑运算符、赋值运算符"},
                            {"name": "控制流", "content": "if语句、for循环、while循环、break和continue"}
                        ]
                    },
                    {
                        "name": "函数与模块",
                        "content": "代码复用和组织的重要概念",
                        "children": [
                            {"name": "函数定义", "content": "使用def关键字定义函数，参数和返回值"},
                            {"name": "模块导入", "content": "使用import导入标准库和第三方模块"},
                            {"name": "包管理", "content": "使用pip安装和管理Python包"}
                        ]
                    }
                ]
            },
            {
                "name": "数据结构与算法",
                "description": "计算机科学的核心基础知识",
                "nodes": [
                    {
                        "name": "数据结构",
                        "content": "组织和存储数据的方式",
                        "children": [
                            {
                                "name": "线性结构",
                                "content": "数据元素排成一条线的结构",
                                "children": [
                                    {"name": "数组", "content": "连续存储的元素集合，支持随机访问"},
                                    {"name": "链表", "content": "通过指针连接的节点序列"},
                                    {"name": "栈", "content": "后进先出(LIFO)的数据结构"},
                                    {"name": "队列", "content": "先进先出(FIFO)的数据结构"}
                                ]
                            },
                            {
                                "name": "树形结构",
                                "content": "具有层次关系的数据结构",
                                "children": [
                                    {"name": "二叉树", "content": "每个节点最多有两个子节点"},
                                    {"name": "二叉搜索树", "content": "左子树 < 根 < 右子树"},
                                    {"name": "平衡树", "content": "AVL树、红黑树等"}
                                ]
                            },
                            {
                                "name": "图结构",
                                "content": "由节点和边组成的复杂关系网络",
                                "children": [
                                    {"name": "图的表示", "content": "邻接矩阵、邻接表"},
                                    {"name": "图的遍历", "content": "深度优先搜索(DFS)、广度优先搜索(BFS)"}
                                ]
                            }
                        ]
                    },
                    {
                        "name": "算法基础",
                        "content": "解决问题的方法和步骤",
                        "children": [
                            {"name": "排序算法", "content": "冒泡排序、快速排序、归并排序、堆排序"},
                            {"name": "查找算法", "content": "线性查找、二分查找、哈希查找"},
                            {"name": "动态规划", "content": "通过存储子问题的解来避免重复计算"}
                        ]
                    }
                ]
            },
            {
                "name": "Web开发技术栈",
                "description": "现代Web应用开发所需的技术和工具",
                "nodes": [
                    {
                        "name": "前端技术",
                        "content": "构建用户界面的技术",
                        "children": [
                            {
                                "name": "HTML/CSS",
                                "content": "网页的结构和样式",
                                "children": [
                                    {"name": "HTML5", "content": "语义化标签、表单、Canvas、SVG"},
                                    {"name": "CSS3", "content": "选择器、布局、动画、响应式设计"},
                                    {"name": "CSS框架", "content": "Bootstrap、Tailwind CSS"}
                                ]
                            },
                            {
                                "name": "JavaScript",
                                "content": "网页的交互逻辑",
                                "children": [
                                    {"name": "ES6+", "content": "箭头函数、解构、模块化、Promise、async/await"},
                                    {"name": "TypeScript", "content": "JavaScript的超集，提供类型系统"},
                                    {"name": "前端框架", "content": "React、Vue、Angular"}
                                ]
                            }
                        ]
                    },
                    {
                        "name": "后端技术",
                        "content": "服务器端应用开发",
                        "children": [
                            {
                                "name": "Node.js",
                                "content": "基于Chrome V8引擎的JavaScript运行时",
                                "children": [
                                    {"name": "Express", "content": "轻量级Web应用框架"},
                                    {"name": "Koa", "content": "新一代Web框架"}
                                ]
                            },
                            {
                                "name": "Python Web",
                                "content": "Python的Web开发框架",
                                "children": [
                                    {"name": "Django", "content": "全栈Web框架"},
                                    {"name": "FastAPI", "content": "现代、快速的API框架"}
                                ]
                            }
                        ]
                    },
                    {
                        "name": "数据库",
                        "content": "数据持久化和管理",
                        "children": [
                            {"name": "关系型数据库", "content": "MySQL、PostgreSQL、SQL Server"},
                            {"name": "非关系型数据库", "content": "MongoDB、Redis、Elasticsearch"}
                        ]
                    }
                ]
            },
            {
                "name": "机器学习入门",
                "description": "人工智能和机器学习的基础知识",
                "nodes": [
                    {
                        "name": "机器学习概述",
                        "content": "什么是机器学习以及为什么重要",
                        "children": [
                            {"name": "监督学习", "content": "从标注数据中学习模型"},
                            {"name": "无监督学习", "content": "从未标注数据中发现模式"},
                            {"name": "强化学习", "content": "通过与环境交互学习策略"}
                        ]
                    },
                    {
                        "name": "常用算法",
                        "content": "机器学习的经典算法",
                        "children": [
                            {"name": "线性回归", "content": "预测连续值的基础算法"},
                            {"name": "逻辑回归", "content": "分类问题的基础算法"},
                            {"name": "决策树", "content": "基于树结构的分类和回归算法"},
                            {"name": "神经网络", "content": "模拟人脑神经元的网络结构"}
                        ]
                    },
                    {
                        "name": "工具库",
                        "content": "机器学习常用的Python库",
                        "children": [
                            {"name": "NumPy", "content": "科学计算基础库"},
                            {"name": "Pandas", "content": "数据处理和分析库"},
                            {"name": "Scikit-learn", "content": "机器学习算法库"},
                            {"name": "TensorFlow", "content": "深度学习框架"},
                            {"name": "PyTorch", "content": "深度学习框架"}
                        ]
                    }
                ]
            },
            {
                "name": "数据库设计",
                "description": "关系型数据库设计的原则和实践",
                "nodes": [
                    {
                        "name": "数据库基础",
                        "content": "数据库的基本概念",
                        "children": [
                            {"name": "关系模型", "content": "表、行、列、主键、外键"},
                            {"name": "SQL语言", "content": "DDL、DML、DCL、TCL"},
                            {"name": "ACID特性", "content": "原子性、一致性、隔离性、持久性"}
                        ]
                    },
                    {
                        "name": "数据库设计",
                        "content": "如何设计高效的数据库",
                        "children": [
                            {"name": "需求分析", "content": "理解业务需求和数据流"},
                            {"name": "概念设计", "content": "ER图、实体、属性、关系"},
                            {"name": "逻辑设计", "content": "范式、表结构、约束"},
                            {"name": "物理设计", "content": "索引、分区、存储引擎"}
                        ]
                    },
                    {
                        "name": "性能优化",
                        "content": "提升数据库性能的方法",
                        "children": [
                            {"name": "索引优化", "content": "B树索引、哈希索引、全文索引"},
                            {"name": "查询优化", "content": "执行计划、JOIN优化、子查询优化"},
                            {"name": "缓存策略", "content": "查询缓存、Redis缓存"}
                        ]
                    }
                ]
            }
        ]
        
        # 插入数据的辅助函数
        async def insert_nodes(conn, graph_id, nodes, parent_id=None, sort_order=0):
            """递归插入节点"""
            for idx, node in enumerate(nodes):
                # 插入当前节点
                result = await conn.execute(
                    text("""
                        INSERT INTO knowledge_nodes 
                        (graph_id, node_name, node_content, parent_id, sort_order, is_active, created_at, updated_at)
                        VALUES (:graph_id, :node_name, :node_content, :parent_id, :sort_order, true, NOW(), NOW())
                        RETURNING id
                    """),
                    {
                        "graph_id": graph_id,
                        "node_name": node["name"],
                        "node_content": node.get("content"),
                        "parent_id": parent_id,
                        "sort_order": idx
                    }
                )
                node_id = result.fetchone()[0]
                
                # 递归插入子节点
                if "children" in node:
                    await insert_nodes(conn, graph_id, node["children"], node_id, 0)
        
        # 创建知识图谱和节点
        for graph_data in graphs_data:
            # 创建知识图谱
            result = await conn.execute(
                text("""
                    INSERT INTO knowledge_graphs 
                    (teacher_id, graph_name, description, is_active, created_at, updated_at)
                    VALUES (:teacher_id, :graph_name, :description, true, NOW(), NOW())
                    RETURNING id
                """),
                {
                    "teacher_id": teacher_id,
                    "graph_name": graph_data["name"],
                    "description": graph_data.get("description")
                }
            )
            graph_id = result.fetchone()[0]
            print(f"✅ 创建知识图谱: {graph_data['name']} (ID: {graph_id})")
            
            # 插入节点
            await insert_nodes(conn, graph_id, graph_data["nodes"])
            
            # 统计节点数量
            count_result = await conn.execute(
                text("SELECT COUNT(*) FROM knowledge_nodes WHERE graph_id = :graph_id"),
                {"graph_id": graph_id}
            )
            node_count = count_result.fetchone()[0]
            print(f"  ├─ 创建了 {node_count} 个知识节点")
        
        print("\n" + "=" * 60)
        print("✅ 知识图谱测试数据创建完成！")
        print("=" * 60)
        
        # 显示统计信息
        stats_result = await conn.execute(
            text("""
                SELECT 
                    COUNT(DISTINCT kg.id) as graph_count,
                    COUNT(kn.id) as node_count
                FROM knowledge_graphs kg
                LEFT JOIN knowledge_nodes kn ON kg.id = kn.graph_id
                WHERE kg.teacher_id = :teacher_id
            """),
            {"teacher_id": teacher_id}
        )
        stats = stats_result.fetchone()
        print(f"\n📊 统计信息：")
        print(f"  - 知识图谱总数: {stats[0]}")
        print(f"  - 知识节点总数: {stats[1]}")
        print(f"\n🎉 现在可以访问 http://localhost:3000/teacher/knowledge-graphs 查看效果！")


if __name__ == "__main__":
    asyncio.run(create_knowledge_graph_data())

