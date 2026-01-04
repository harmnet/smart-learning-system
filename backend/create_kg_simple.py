"""
通过后端直接创建知识图谱测试数据
"""
import asyncio
import httpx

BASE_URL = "http://localhost:8000/api/v1"

# 使用管理员账号登录获取token，然后为教师ID=2创建数据
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"


async def main():
    async with httpx.AsyncClient(timeout=60.0) as client:
        # 1. 管理员登录
        print("🔐 正在登录管理员账号...")
        login_response = await client.post(
            f"{BASE_URL}/auth/login",
            data={
                "username": ADMIN_USERNAME,
                "password": ADMIN_PASSWORD
            }
        )
        
        if login_response.status_code != 200:
            print(f"❌ 登录失败: {login_response.status_code}")
            return
        
        login_data = login_response.json()
        token = login_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        print("✅ 管理员登录成功！")
        
        # 2. 获取所有教师列表
        print("\n📋 获取教师列表...")
        teachers_response = await client.get(
            f"{BASE_URL}/admin/teachers",
            headers=headers
        )
        
        if teachers_response.status_code == 200:
            teachers = teachers_response.json()
            print(f"✅ 找到 {len(teachers)} 个教师")
            
            if teachers:
                # 使用第一个教师的ID
                teacher = teachers[0]
                teacher_id = teacher["id"]
                teacher_name = teacher.get("full_name", teacher.get("username"))
                print(f"📌 将为教师 {teacher_name} (ID: {teacher_id}) 创建知识图谱数据")
                
                # 3. 为这个教师创建知识图谱
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
                                    {"node_name": "数组", "node_content": "连续存储的元素集合"},
                                    {"node_name": "链表", "node_content": "通过指针连接的节点序列"},
                                    {"node_name": "栈", "node_content": "后进先出(LIFO)的数据结构"},
                                    {"node_name": "队列", "node_content": "先进先出(FIFO)的数据结构"}
                                ]
                            },
                            {
                                "node_name": "算法基础",
                                "node_content": "解决问题的方法和步骤",
                                "children": [
                                    {"node_name": "排序算法", "node_content": "冒泡排序、快速排序、归并排序"},
                                    {"node_name": "查找算法", "node_content": "线性查找、二分查找"},
                                    {"node_name": "动态规划", "node_content": "存储子问题的解来避免重复计算"}
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
                                    {"node_name": "HTML5", "node_content": "语义化标签、表单、Canvas"},
                                    {"node_name": "CSS3", "node_content": "选择器、布局、动画、响应式设计"},
                                    {"node_name": "JavaScript", "node_content": "ES6+、TypeScript、React、Vue"}
                                ]
                            },
                            {
                                "node_name": "后端技术",
                                "node_content": "服务器端应用开发",
                                "children": [
                                    {"node_name": "Node.js", "node_content": "基于Chrome V8引擎的JavaScript运行时"},
                                    {"node_name": "Python Web", "node_content": "Django、FastAPI等框架"},
                                    {"node_name": "数据库", "node_content": "MySQL、PostgreSQL、MongoDB、Redis"}
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
                                    {"node_name": "决策树", "node_content": "基于树结构的分类和回归算法"},
                                    {"node_name": "神经网络", "node_content": "模拟人脑神经元的网络结构"}
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
                print(f"   可以用以下任一教师账号登录查看：")
                for t in teachers[:3]:  # 只显示前3个教师
                    print(f"   - {t.get('full_name', t.get('username'))} (手机号: {t.get('phone', '无')})")
            else:
                print("❌ 没有找到教师，无法创建数据")
        else:
            print(f"❌ 获取教师列表失败: {teachers_response.status_code}")


if __name__ == "__main__":
    asyncio.run(main())

