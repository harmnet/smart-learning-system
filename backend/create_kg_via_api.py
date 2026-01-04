"""
通过API创建知识图谱测试数据
"""
import httpx
import asyncio
import json

BASE_URL = "http://localhost:8000/api/v1"

# 使用教师账号登录
TEACHER_USERNAME = "13800138002"  # 张老师的手机号
TEACHER_PASSWORD = "111111"  # 教师密码（已重置）


async def main():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("🔐 正在登录教师账号...")
        
        # 1. 登录获取token
        login_response = await client.post(
            f"{BASE_URL}/auth/login",
            data={
                "username": TEACHER_USERNAME,
                "password": TEACHER_PASSWORD
            }
        )
        
        if login_response.status_code != 200:
            print(f"❌ 登录失败: {login_response.status_code}")
            print(f"响应: {login_response.text}")
            return
        
        login_data = login_response.json()
        token = login_data["access_token"]
        user = login_data["user"]
        teacher_id = user["id"]
        
        print(f"✅ 登录成功！教师ID: {teacher_id}, 姓名: {user.get('full_name', user.get('username'))}")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # 定义知识图谱数据
        graphs_data = [
            {
                "graph_name": "Python编程基础",
                "description": "涵盖Python语言的核心概念和基础知识",
                "nodes": [
                    {
                        "node_name": "Python简介",
                        "node_content": "Python是一种高级编程语言，以其简洁和易读性而闻名",
                        "children": [
                            {"node_name": "Python的历史", "node_content": "由Guido van Rossum于1991年创建"},
                            {"node_name": "Python的特点", "node_content": "简洁、易读、功能强大、跨平台"},
                            {"node_name": "Python的应用领域", "node_content": "Web开发、数据分析、人工智能、自动化等"}
                        ]
                    },
                    {
                        "node_name": "基础语法",
                        "node_content": "Python的基本语法规则和编程结构",
                        "children": [
                            {"node_name": "变量与数据类型", "node_content": "整数、浮点数、字符串、布尔值、列表、元组、字典、集合"},
                            {"node_name": "运算符", "node_content": "算术运算符、比较运算符、逻辑运算符、赋值运算符"},
                            {"node_name": "控制流", "node_content": "if语句、for循环、while循环、break和continue"}
                        ]
                    },
                    {
                        "node_name": "函数与模块",
                        "node_content": "代码复用和组织的重要概念",
                        "children": [
                            {"node_name": "函数定义", "node_content": "使用def关键字定义函数，参数和返回值"},
                            {"node_name": "模块导入", "node_content": "使用import导入标准库和第三方模块"},
                            {"node_name": "包管理", "node_content": "使用pip安装和管理Python包"}
                        ]
                    }
                ]
            },
            {
                "graph_name": "数据结构与算法",
                "description": "计算机科学的核心基础知识",
                "nodes": [
                    {
                        "node_name": "数据结构",
                        "node_content": "组织和存储数据的方式",
                        "children": [
                            {
                                "node_name": "线性结构",
                                "node_content": "数据元素排成一条线的结构",
                                "children": [
                                    {"node_name": "数组", "node_content": "连续存储的元素集合，支持随机访问"},
                                    {"node_name": "链表", "node_content": "通过指针连接的节点序列"},
                                    {"node_name": "栈", "node_content": "后进先出(LIFO)的数据结构"},
                                    {"node_name": "队列", "node_content": "先进先出(FIFO)的数据结构"}
                                ]
                            },
                            {
                                "node_name": "树形结构",
                                "node_content": "具有层次关系的数据结构",
                                "children": [
                                    {"node_name": "二叉树", "node_content": "每个节点最多有两个子节点"},
                                    {"node_name": "二叉搜索树", "node_content": "左子树 < 根 < 右子树"},
                                    {"node_name": "平衡树", "node_content": "AVL树、红黑树等"}
                                ]
                            },
                            {
                                "node_name": "图结构",
                                "node_content": "由节点和边组成的复杂关系网络",
                                "children": [
                                    {"node_name": "图的表示", "node_content": "邻接矩阵、邻接表"},
                                    {"node_name": "图的遍历", "node_content": "深度优先搜索(DFS)、广度优先搜索(BFS)"}
                                ]
                            }
                        ]
                    },
                    {
                        "node_name": "算法基础",
                        "node_content": "解决问题的方法和步骤",
                        "children": [
                            {"node_name": "排序算法", "node_content": "冒泡排序、快速排序、归并排序、堆排序"},
                            {"node_name": "查找算法", "node_content": "线性查找、二分查找、哈希查找"},
                            {"node_name": "动态规划", "node_content": "通过存储子问题的解来避免重复计算"}
                        ]
                    }
                ]
            },
            {
                "graph_name": "Web开发技术栈",
                "description": "现代Web应用开发所需的技术和工具",
                "nodes": [
                    {
                        "node_name": "前端技术",
                        "node_content": "构建用户界面的技术",
                        "children": [
                            {
                                "node_name": "HTML/CSS",
                                "node_content": "网页的结构和样式",
                                "children": [
                                    {"node_name": "HTML5", "node_content": "语义化标签、表单、Canvas、SVG"},
                                    {"node_name": "CSS3", "node_content": "选择器、布局、动画、响应式设计"},
                                    {"node_name": "CSS框架", "node_content": "Bootstrap、Tailwind CSS"}
                                ]
                            },
                            {
                                "node_name": "JavaScript",
                                "node_content": "网页的交互逻辑",
                                "children": [
                                    {"node_name": "ES6+", "node_content": "箭头函数、解构、模块化、Promise、async/await"},
                                    {"node_name": "TypeScript", "node_content": "JavaScript的超集，提供类型系统"},
                                    {"node_name": "前端框架", "node_content": "React、Vue、Angular"}
                                ]
                            }
                        ]
                    },
                    {
                        "node_name": "后端技术",
                        "node_content": "服务器端应用开发",
                        "children": [
                            {
                                "node_name": "Node.js",
                                "node_content": "基于Chrome V8引擎的JavaScript运行时",
                                "children": [
                                    {"node_name": "Express", "node_content": "轻量级Web应用框架"},
                                    {"node_name": "Koa", "node_content": "新一代Web框架"}
                                ]
                            },
                            {
                                "node_name": "Python Web",
                                "node_content": "Python的Web开发框架",
                                "children": [
                                    {"node_name": "Django", "node_content": "全栈Web框架"},
                                    {"node_name": "FastAPI", "node_content": "现代、快速的API框架"}
                                ]
                            }
                        ]
                    },
                    {
                        "node_name": "数据库",
                        "node_content": "数据持久化和管理",
                        "children": [
                            {"node_name": "关系型数据库", "node_content": "MySQL、PostgreSQL、SQL Server"},
                            {"node_name": "非关系型数据库", "node_content": "MongoDB、Redis、Elasticsearch"}
                        ]
                    }
                ]
            },
            {
                "graph_name": "机器学习入门",
                "description": "人工智能和机器学习的基础知识",
                "nodes": [
                    {
                        "node_name": "机器学习概述",
                        "node_content": "什么是机器学习以及为什么重要",
                        "children": [
                            {"node_name": "监督学习", "node_content": "从标注数据中学习模型"},
                            {"node_name": "无监督学习", "node_content": "从未标注数据中发现模式"},
                            {"node_name": "强化学习", "node_content": "通过与环境交互学习策略"}
                        ]
                    },
                    {
                        "node_name": "常用算法",
                        "node_content": "机器学习的经典算法",
                        "children": [
                            {"node_name": "线性回归", "node_content": "预测连续值的基础算法"},
                            {"node_name": "逻辑回归", "node_content": "分类问题的基础算法"},
                            {"node_name": "决策树", "node_content": "基于树结构的分类和回归算法"},
                            {"node_name": "神经网络", "node_content": "模拟人脑神经元的网络结构"}
                        ]
                    },
                    {
                        "node_name": "工具库",
                        "node_content": "机器学习常用的Python库",
                        "children": [
                            {"node_name": "NumPy", "node_content": "科学计算基础库"},
                            {"node_name": "Pandas", "node_content": "数据处理和分析库"},
                            {"node_name": "Scikit-learn", "node_content": "机器学习算法库"},
                            {"node_name": "TensorFlow", "node_content": "深度学习框架"},
                            {"node_name": "PyTorch", "node_content": "深度学习框架"}
                        ]
                    }
                ]
            }
        ]
        
        # 递归创建节点
        async def create_nodes(graph_id, nodes, parent_id=None):
            for node_data in nodes:
                print(f"  ├─ 创建节点: {node_data['node_name']}")
                
                # 创建节点
                node_response = await client.post(
                    f"{BASE_URL}/teacher/knowledge-graphs/{graph_id}/nodes",
                    params={"teacher_id": teacher_id},
                    json={
                        "node_name": node_data["node_name"],
                        "node_content": node_data.get("node_content"),
                        "parent_id": parent_id,
                        "sort_order": 0
                    },
                    headers=headers
                )
                
                if node_response.status_code != 200:
                    print(f"     ❌ 创建节点失败: {node_response.status_code} - {node_response.text}")
                    continue
                
                node = node_response.json()
                node_id = node["id"]
                
                # 递归创建子节点
                if "children" in node_data:
                    await create_nodes(graph_id, node_data["children"], node_id)
        
        # 创建知识图谱
        for idx, graph_data in enumerate(graphs_data, 1):
            print(f"\n📚 [{idx}/{len(graphs_data)}] 创建知识图谱: {graph_data['graph_name']}")
            
            # 创建知识图谱
            response = await client.post(
                f"{BASE_URL}/teacher/knowledge-graphs",
                params={"teacher_id": teacher_id},
                json={
                    "graph_name": graph_data["graph_name"],
                    "description": graph_data.get("description")
                },
                headers=headers
            )
            
            if response.status_code != 200:
                print(f"❌ 创建图谱失败: {response.status_code}")
                print(f"响应: {response.text}")
                continue
            
            graph = response.json()
            graph_id = graph["id"]
            print(f"✅ 知识图谱创建成功 (ID: {graph_id})")
            
            # 创建节点
            await create_nodes(graph_id, graph_data["nodes"])
        
        print("\n" + "=" * 60)
        print("✅ 知识图谱测试数据创建完成！")
        print("=" * 60)
        print(f"\n🎉 现在可以访问 http://localhost:3000/teacher/knowledge-graphs 查看效果！")
        print(f"   使用账号: {TEACHER_USERNAME}")
        print(f"   密码: {TEACHER_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(main())

