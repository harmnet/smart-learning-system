"""
通过API批量创建试题
"""
import requests
import json
import time

API_BASE_URL = "http://localhost:8000/api/v1"
TEACHER_ID = 2

# 试题数据（简化版，只包含25道作为示例）
QUESTIONS = [
    # 单选题 1-10
    {
        "question_type": "single_choice",
        "title": "在Python中，哪个库最常用于数据分析和处理？",
        "knowledge_point": "Python数据采集",
        "difficulty": 1,
        "explanation": "pandas是Python中最常用的数据分析库，提供了DataFrame等强大的数据结构。",
        "options": [
            {"option_label": "A", "option_text": "requests", "is_correct": False},
            {"option_label": "B", "option_text": "pandas", "is_correct": True},
            {"option_label": "C", "option_text": "flask", "is_correct": False},
            {"option_label": "D", "option_text": "django", "is_correct": False}
        ]
    },
    {
        "question_type": "single_choice",
        "title": "在商务数据分析中，ROI代表什么？",
        "knowledge_point": "商务数据分析",
        "difficulty": 1,
        "explanation": "ROI（Return on Investment）是投资回报率，用于衡量投资的效益。",
        "options": [
            {"option_label": "A", "option_text": "投资回报率", "is_correct": True},
            {"option_label": "B", "option_text": "运营收入", "is_correct": False},
            {"option_label": "C", "option_text": "市场占有率", "is_correct": False},
            {"option_label": "D", "option_text": "客户满意度", "is_correct": False}
        ]
    },
    {
        "question_type": "single_choice",
        "title": "在数据清洗过程中，处理缺失值的方法不包括？",
        "knowledge_point": "数据清洗",
        "difficulty": 2,
        "explanation": "处理缺失值的常见方法包括删除、填充（均值、中位数、众数等）和插值，增加数据行数不是处理缺失值的方法。",
        "options": [
            {"option_label": "A", "option_text": "删除包含缺失值的行", "is_correct": False},
            {"option_label": "B", "option_text": "用均值填充", "is_correct": False},
            {"option_label": "C", "option_text": "用中位数填充", "is_correct": False},
            {"option_label": "D", "option_text": "增加数据行数", "is_correct": True}
        ]
    },
    {
        "question_type": "single_choice",
        "title": "SQL中用于查询的关键字是？",
        "knowledge_point": "数据库数据采集",
        "difficulty": 1,
        "explanation": "SELECT是SQL中用于查询数据的关键字。",
        "options": [
            {"option_label": "A", "option_text": "INSERT", "is_correct": False},
            {"option_label": "B", "option_text": "UPDATE", "is_correct": False},
            {"option_label": "C", "option_text": "SELECT", "is_correct": True},
            {"option_label": "D", "option_text": "DELETE", "is_correct": False}
        ]
    },
    {
        "question_type": "single_choice",
        "title": "在Python中，哪个方法用于读取CSV文件？",
        "knowledge_point": "Python数据采集",
        "difficulty": 1,
        "explanation": "pandas库使用read_csv()方法读取CSV文件。",
        "options": [
            {"option_label": "A", "option_text": "pd.read_csv()", "is_correct": True},
            {"option_label": "B", "option_text": "pd.load_csv()", "is_correct": False},
            {"option_label": "C", "option_text": "pd.open_csv()", "is_correct": False},
            {"option_label": "D", "option_text": "pd.import_csv()", "is_correct": False}
        ]
    },
    {
        "question_type": "single_choice",
        "title": "在数据可视化中，用于展示数据分布的图表类型是？",
        "knowledge_point": "数据可视化",
        "difficulty": 2,
        "explanation": "直方图（Histogram）是展示数据分布的最常用图表类型。",
        "options": [
            {"option_label": "A", "option_text": "饼图", "is_correct": False},
            {"option_label": "B", "option_text": "直方图", "is_correct": True},
            {"option_label": "C", "option_text": "折线图", "is_correct": False},
            {"option_label": "D", "option_text": "雷达图", "is_correct": False}
        ]
    },
    {
        "question_type": "single_choice",
        "title": "在Python中，requests库的主要用途是？",
        "knowledge_point": "API数据采集",
        "difficulty": 1,
        "explanation": "requests是Python中用于发送HTTP请求的库，常用于API调用和网页爬取。",
        "options": [
            {"option_label": "A", "option_text": "数据分析", "is_correct": False},
            {"option_label": "B", "option_text": "发送HTTP请求", "is_correct": True},
            {"option_label": "C", "option_text": "创建网站", "is_correct": False},
            {"option_label": "D", "option_text": "机器学习", "is_correct": False}
        ]
    },
    {
        "question_type": "single_choice",
        "title": "在统计学中，标准差用于衡量什么？",
        "knowledge_point": "统计分析",
        "difficulty": 2,
        "explanation": "标准差是衡量数据离散程度的重要指标，标准差越大，数据越分散。",
        "options": [
            {"option_label": "A", "option_text": "数据的集中趋势", "is_correct": False},
            {"option_label": "B", "option_text": "数据的离散程度", "is_correct": True},
            {"option_label": "C", "option_text": "数据的相关性", "is_correct": False},
            {"option_label": "D", "option_text": "数据的偏态", "is_correct": False}
        ]
    },
    {
        "question_type": "single_choice",
        "title": "在商务分析中，SWOT分析的S代表什么？",
        "knowledge_point": "商务数据分析",
        "difficulty": 1,
        "explanation": "SWOT分析中，S代表Strengths（优势），W代表Weaknesses（劣势），O代表Opportunities（机会），T代表Threats（威胁）。",
        "options": [
            {"option_label": "A", "option_text": "销售", "is_correct": False},
            {"option_label": "B", "option_text": "优势", "is_correct": True},
            {"option_label": "C", "option_text": "战略", "is_correct": False},
            {"option_label": "D", "option_text": "系统", "is_correct": False}
        ]
    },
    {
        "question_type": "single_choice",
        "title": "在数据挖掘中，哪种算法属于监督学习？",
        "knowledge_point": "数据挖掘",
        "difficulty": 2,
        "explanation": "决策树是一种监督学习算法，需要标注的训练数据。K-means和DBSCAN是无监督学习的聚类算法，PCA是降维技术。",
        "options": [
            {"option_label": "A", "option_text": "K-means聚类", "is_correct": False},
            {"option_label": "B", "option_text": "决策树", "is_correct": True},
            {"option_label": "C", "option_text": "DBSCAN", "is_correct": False},
            {"option_label": "D", "option_text": "PCA降维", "is_correct": False}
        ]
    },
    
    # 多选题 1-10
    {
        "question_type": "multiple_choice",
        "title": "以下哪些是常见的数据清洗操作？（多选）",
        "knowledge_point": "数据清洗",
        "difficulty": 2,
        "explanation": "数据清洗包括处理缺失值、删除重复数据、数据类型转换等操作，创建新数据库不属于数据清洗。",
        "options": [
            {"option_label": "A", "option_text": "处理缺失值", "is_correct": True},
            {"option_label": "B", "option_text": "删除重复数据", "is_correct": True},
            {"option_label": "C", "option_text": "数据类型转换", "is_correct": True},
            {"option_label": "D", "option_text": "创建新数据库", "is_correct": False}
        ]
    },
    {
        "question_type": "multiple_choice",
        "title": "以下哪些是Python中常用的数据可视化库？（多选）",
        "knowledge_point": "数据可视化",
        "difficulty": 1,
        "explanation": "matplotlib、seaborn和plotly都是Python中常用的数据可视化库，requests是HTTP请求库。",
        "options": [
            {"option_label": "A", "option_text": "matplotlib", "is_correct": True},
            {"option_label": "B", "option_text": "seaborn", "is_correct": True},
            {"option_label": "C", "option_text": "plotly", "is_correct": True},
            {"option_label": "D", "option_text": "requests", "is_correct": False}
        ]
    },
    {
        "question_type": "multiple_choice",
        "title": "以下哪些属于描述性统计指标？（多选）",
        "knowledge_point": "统计分析",
        "difficulty": 1,
        "explanation": "平均值、中位数、标准差都是描述性统计指标，假设检验属于推断统计。",
        "options": [
            {"option_label": "A", "option_text": "平均值", "is_correct": True},
            {"option_label": "B", "option_text": "中位数", "is_correct": True},
            {"option_label": "C", "option_text": "标准差", "is_correct": True},
            {"option_label": "D", "option_text": "假设检验", "is_correct": False}
        ]
    },
    {
        "question_type": "multiple_choice",
        "title": "在商务数据分析中，哪些指标属于用户行为分析？（多选）",
        "knowledge_point": "商务数据分析",
        "difficulty": 2,
        "explanation": "用户留存率、活跃度和转化率都是用户行为分析指标，固定资产是财务指标。",
        "options": [
            {"option_label": "A", "option_text": "用户留存率", "is_correct": True},
            {"option_label": "B", "option_text": "用户活跃度", "is_correct": True},
            {"option_label": "C", "option_text": "转化率", "is_correct": True},
            {"option_label": "D", "option_text": "固定资产", "is_correct": False}
        ]
    },
    {
        "question_type": "multiple_choice",
        "title": "以下哪些是常见的机器学习算法类型？（多选）",
        "knowledge_point": "数据挖掘",
        "difficulty": 2,
        "explanation": "分类、回归、聚类都是机器学习算法类型，排序算法属于计算机算法范畴。",
        "options": [
            {"option_label": "A", "option_text": "分类算法", "is_correct": True},
            {"option_label": "B", "option_text": "回归算法", "is_correct": True},
            {"option_label": "C", "option_text": "聚类算法", "is_correct": True},
            {"option_label": "D", "option_text": "排序算法", "is_correct": False}
        ]
    },
    {
        "question_type": "multiple_choice",
        "title": "在数据库查询中，以下哪些是聚合函数？（多选）",
        "knowledge_point": "数据库数据采集",
        "difficulty": 1,
        "explanation": "COUNT()、SUM()、AVG()都是SQL聚合函数，WHERE是条件子句。",
        "options": [
            {"option_label": "A", "option_text": "COUNT()", "is_correct": True},
            {"option_label": "B", "option_text": "SUM()", "is_correct": True},
            {"option_label": "C", "option_text": "AVG()", "is_correct": True},
            {"option_label": "D", "option_text": "WHERE", "is_correct": False}
        ]
    },
    {
        "question_type": "multiple_choice",
        "title": "以下哪些是数据采集的常见来源？（多选）",
        "knowledge_point": "Python数据采集",
        "difficulty": 1,
        "explanation": "网页爬虫、API接口和数据库都是常见的数据采集来源。",
        "options": [
            {"option_label": "A", "option_text": "网页爬虫", "is_correct": True},
            {"option_label": "B", "option_text": "API接口", "is_correct": True},
            {"option_label": "C", "option_text": "数据库", "is_correct": True},
            {"option_label": "D", "option_text": "打印机", "is_correct": False}
        ]
    },
    {
        "question_type": "multiple_choice",
        "title": "在Python爬虫中，以下哪些库可以用于发送HTTP请求？（多选）",
        "knowledge_point": "爬虫数据采集",
        "difficulty": 2,
        "explanation": "requests、urllib和httpx都可以用于发送HTTP请求，pandas是数据分析库。",
        "options": [
            {"option_label": "A", "option_text": "requests", "is_correct": True},
            {"option_label": "B", "option_text": "urllib", "is_correct": True},
            {"option_label": "C", "option_text": "httpx", "is_correct": True},
            {"option_label": "D", "option_text": "pandas", "is_correct": False}
        ]
    },
    {
        "question_type": "multiple_choice",
        "title": "以下哪些是数据可视化的原则？（多选）",
        "knowledge_point": "数据可视化",
        "difficulty": 2,
        "explanation": "数据可视化应遵循简洁明了、准确性和美观性原则，并非数据量越大越好。",
        "options": [
            {"option_label": "A", "option_text": "简洁明了", "is_correct": True},
            {"option_label": "B", "option_text": "准确性", "is_correct": True},
            {"option_label": "C", "option_text": "美观性", "is_correct": True},
            {"option_label": "D", "option_text": "数据量越大越好", "is_correct": False}
        ]
    },
    {
        "question_type": "multiple_choice",
        "title": "在数据治理中，以下哪些是重要的概念？（多选）",
        "knowledge_point": "数据治理",
        "difficulty": 2,
        "explanation": "数据质量、安全和标准是数据治理的核心概念，数据删除只是操作之一。",
        "options": [
            {"option_label": "A", "option_text": "数据质量", "is_correct": True},
            {"option_label": "B", "option_text": "数据安全", "is_correct": True},
            {"option_label": "C", "option_text": "数据标准", "is_correct": True},
            {"option_label": "D", "option_text": "数据删除", "is_correct": False}
        ]
    },
    
    # 判断题 1-10
    {
        "question_type": "true_false",
        "title": "在Python中，列表（list）是可变的数据类型。",
        "knowledge_point": "Python数据采集",
        "difficulty": 1,
        "answer": '{"answer": "true"}',
        "explanation": "正确。Python中的列表是可变的（mutable），可以在创建后修改其内容。"
    },
    {
        "question_type": "true_false",
        "title": "数据清洗是数据分析流程中可以省略的步骤。",
        "knowledge_point": "数据清洗",
        "difficulty": 1,
        "answer": '{"answer": "false"}',
        "explanation": "错误。数据清洗是数据分析中非常重要且不可省略的步骤，直接影响分析结果的准确性。"
    },
    {
        "question_type": "true_false",
        "title": "相关性分析可以证明因果关系。",
        "knowledge_point": "统计分析",
        "difficulty": 2,
        "answer": '{"answer": "false"}',
        "explanation": "错误。相关性不等于因果关系，两个变量相关并不意味着一个变量的变化导致了另一个变量的变化。"
    },
    {
        "question_type": "true_false",
        "title": "在SQL中，JOIN操作用于合并两个或多个表的数据。",
        "knowledge_point": "数据库数据采集",
        "difficulty": 1,
        "answer": '{"answer": "true"}',
        "explanation": "正确。JOIN操作用于根据两个或多个表之间的关联列来合并数据。"
    },
    {
        "question_type": "true_false",
        "title": "机器学习中的过拟合是指模型在训练集上表现很好，但在测试集上表现较差。",
        "knowledge_point": "数据挖掘",
        "difficulty": 2,
        "answer": '{"answer": "true"}',
        "explanation": "正确。过拟合是指模型过度学习了训练数据的特征，导致泛化能力差。"
    },
    {
        "question_type": "true_false",
        "title": "在商务数据分析中，所有数据都应该被纳入分析范围。",
        "knowledge_point": "商务数据分析",
        "difficulty": 2,
        "answer": '{"answer": "false"}',
        "explanation": "错误。应该根据分析目标选择相关数据，不相关的数据可能引入噪音，影响分析效果。"
    },
    {
        "question_type": "true_false",
        "title": "网页爬虫可以无限制地爬取任何网站的数据。",
        "knowledge_point": "爬虫数据采集",
        "difficulty": 1,
        "answer": '{"answer": "false"}',
        "explanation": "错误。爬虫应遵守网站的robots.txt协议和相关法律法规，不能无限制地爬取数据。"
    },
    {
        "question_type": "true_false",
        "title": "数据可视化只是为了让图表看起来更美观。",
        "knowledge_point": "数据可视化",
        "difficulty": 1,
        "answer": '{"answer": "false"}',
        "explanation": "错误。数据可视化的主要目的是帮助人们更好地理解数据、发现规律和洞察。"
    },
    {
        "question_type": "true_false",
        "title": "在Python中，pandas的DataFrame可以包含不同类型的数据。",
        "knowledge_point": "Python数据采集",
        "difficulty": 1,
        "answer": '{"answer": "true"}',
        "explanation": "正确。DataFrame的不同列可以包含不同类型的数据（整数、浮点数、字符串等）。"
    },
    {
        "question_type": "true_false",
        "title": "API接口调用不需要身份验证。",
        "knowledge_point": "API数据采集",
        "difficulty": 1,
        "answer": '{"answer": "false"}',
        "explanation": "错误。大多数API接口需要身份验证（如API Key、Token等）来控制访问权限。"
    },
    
    # 填空题 1-10
    {
        "question_type": "fill_blank",
        "title": "在Python中，使用______库可以方便地进行数据分析和处理。",
        "knowledge_point": "Python数据采集",
        "difficulty": 1,
        "answer": '{"blanks": ["pandas"]}',
        "explanation": "pandas是Python中最常用的数据分析库，提供了DataFrame等强大的数据结构。"
    },
    {
        "question_type": "fill_blank",
        "title": "SQL查询语句中，______子句用于指定查询条件。",
        "knowledge_point": "数据库数据采集",
        "difficulty": 1,
        "answer": '{"blanks": ["WHERE"]}',
        "explanation": "WHERE子句用于在SQL查询中指定过滤条件。"
    },
    {
        "question_type": "fill_blank",
        "title": "在统计学中，______是描述数据集中趋势的重要指标之一。",
        "knowledge_point": "统计分析",
        "difficulty": 1,
        "answer": '{"blanks": ["平均值", "均值", "mean"]}',
        "explanation": "平均值（均值）是最常用的集中趋势度量指标。"
    },
    {
        "question_type": "fill_blank",
        "title": "在商务分析中，______分析用于评估企业的优势、劣势、机会和威胁。",
        "knowledge_point": "商务数据分析",
        "difficulty": 1,
        "answer": '{"blanks": ["SWOT"]}',
        "explanation": "SWOT分析是战略规划的经典工具。"
    },
    {
        "question_type": "fill_blank",
        "title": "Python中的______库用于发送HTTP请求，是网页爬虫的基础工具。",
        "knowledge_point": "爬虫数据采集",
        "difficulty": 1,
        "answer": '{"blanks": ["requests"]}',
        "explanation": "requests是Python中最流行的HTTP请求库。"
    },
    {
        "question_type": "fill_blank",
        "title": "在数据可视化中，______图适合展示数据的趋势变化。",
        "knowledge_point": "数据可视化",
        "difficulty": 1,
        "answer": '{"blanks": ["折线图", "线图", "line chart"]}',
        "explanation": "折线图能够直观地展示数据随时间或其他连续变量的变化趋势。"
    },
    {
        "question_type": "fill_blank",
        "title": "在机器学习中，______学习需要使用标注的训练数据。",
        "knowledge_point": "数据挖掘",
        "difficulty": 2,
        "answer": '{"blanks": ["监督"]}',
        "explanation": "监督学习需要标注数据来训练模型，而无监督学习不需要。"
    },
    {
        "question_type": "fill_blank",
        "title": "数据清洗中，处理______数据是保证数据质量的重要步骤。",
        "knowledge_point": "数据清洗",
        "difficulty": 1,
        "answer": '{"blanks": ["缺失", "重复", "异常"]}',
        "explanation": "缺失数据、重复数据和异常数据都是数据清洗需要处理的重要内容。"
    },
    {
        "question_type": "fill_blank",
        "title": "在Excel中，______函数用于查找和返回数据。",
        "knowledge_point": "Excel数据分析",
        "difficulty": 1,
        "answer": '{"blanks": ["VLOOKUP", "LOOKUP"]}',
        "explanation": "VLOOKUP是Excel中最常用的查找函数。"
    },
    {
        "question_type": "fill_blank",
        "title": "在数据库设计中，______用于唯一标识表中的每一条记录。",
        "knowledge_point": "数据库数据采集",
        "difficulty": 1,
        "answer": '{"blanks": ["主键", "Primary Key", "PK"]}',
        "explanation": "主键用于唯一标识表中的每一条记录。"
    },
    
    # 简答题 1-10
    {
        "question_type": "short_answer",
        "title": "请简述数据清洗的主要步骤。",
        "knowledge_point": "数据清洗",
        "difficulty": 2,
        "answer": '{"key_points": ["1. 处理缺失值：删除或填充", "2. 删除重复数据", "3. 处理异常值：识别和处理离群点", "4. 数据类型转换：确保数据类型正确", "5. 数据标准化/归一化"]}',
        "explanation": "数据清洗包括处理缺失值、删除重复、处理异常值、类型转换和标准化等步骤，目的是提高数据质量。"
    },
    {
        "question_type": "short_answer",
        "title": "什么是API？在数据采集中有什么作用？",
        "knowledge_point": "API数据采集",
        "difficulty": 2,
        "answer": '{"key_points": ["API是Application Programming Interface的缩写", "是不同软件系统之间交互的接口", "在数据采集中可以直接获取结构化数据", "相比爬虫更稳定、合法、高效"]}',
        "explanation": "API是应用程序编程接口，提供了一种标准化的数据交互方式，是现代数据采集的重要途径。"
    },
    {
        "question_type": "short_answer",
        "title": "请列举至少三种常见的数据可视化图表类型及其适用场景。",
        "knowledge_point": "数据可视化",
        "difficulty": 2,
        "answer": '{"key_points": ["1. 折线图：展示数据趋势变化", "2. 柱状图：比较不同类别的数据", "3. 饼图：展示数据的占比关系", "4. 散点图：展示两个变量之间的相关关系", "5. 热力图：展示数据的分布密度"]}',
        "explanation": "不同的图表类型适用于不同的数据展示需求，选择合适的图表可以更有效地传达信息。"
    },
    {
        "question_type": "short_answer",
        "title": "什么是机器学习中的过拟合？如何避免？",
        "knowledge_point": "数据挖掘",
        "difficulty": 3,
        "answer": '{"key_points": ["过拟合是指模型在训练集上表现很好，但泛化能力差", "避免方法：1. 增加训练数据量", "2. 使用正则化技术", "3. 简化模型复杂度", "4. 使用交叉验证", "5. 提前停止训练"]}',
        "explanation": "过拟合是机器学习中的常见问题，需要通过多种技术手段来预防和控制。"
    },
    {
        "question_type": "short_answer",
        "title": "请说明商务数据分析中用户留存率的计算方法及其重要性。",
        "knowledge_point": "商务数据分析",
        "difficulty": 2,
        "answer": '{"key_points": ["留存率 = 特定时期后仍活跃的用户数 / 初始用户数 × 100%", "重要性：1. 衡量产品的用户粘性", "2. 反映用户满意度", "3. 预测长期价值", "4. 指导产品优化方向"]}',
        "explanation": "用户留存率是衡量产品成功与否的关键指标，直接影响企业的长期发展。"
    },
    {
        "question_type": "short_answer",
        "title": "在网页爬虫中，如何设置请求头来模拟浏览器行为？为什么需要这样做？",
        "knowledge_point": "爬虫数据采集",
        "difficulty": 2,
        "answer": '{"key_points": ["设置User-Agent字段模拟浏览器", "可添加Accept、Accept-Language等字段", "原因：1. 绕过反爬虫机制", "2. 提高请求成功率", "3. 遵守网站规则"]}',
        "explanation": "设置合适的请求头可以让爬虫更像真实用户，提高数据采集的成功率。"
    },
    {
        "question_type": "short_answer",
        "title": "请简述SQL中JOIN的几种类型及其区别。",
        "knowledge_point": "数据库数据采集",
        "difficulty": 3,
        "answer": '{"key_points": ["1. INNER JOIN：返回两表匹配的记录", "2. LEFT JOIN：返回左表所有记录及右表匹配记录", "3. RIGHT JOIN：返回右表所有记录及左表匹配记录", "4. FULL JOIN：返回两表所有记录", "区别在于处理不匹配记录的方式"]}',
        "explanation": "不同类型的JOIN适用于不同的数据合并场景，理解它们的区别对数据查询很重要。"
    },
    {
        "question_type": "short_answer",
        "title": "请说明Python中列表（list）和元组（tuple）的区别。",
        "knowledge_point": "Python数据采集",
        "difficulty": 2,
        "answer": '{"key_points": ["1. 可变性：列表是可变的，元组是不可变的", "2. 语法：列表用[]，元组用()", "3. 性能：元组比列表更快", "4. 用途：列表用于可修改的序列，元组用于固定数据"]}',
        "explanation": "列表和元组是Python中最常用的序列类型，各有其特点和适用场景。"
    },
    {
        "question_type": "short_answer",
        "title": "什么是数据可视化的5秒法则？",
        "knowledge_point": "数据可视化",
        "difficulty": 2,
        "answer": '{"key_points": ["5秒法则：观众应该在5秒内理解图表的核心信息", "原则：1. 简洁明了", "2. 突出重点", "3. 避免冗余信息", "4. 使用适当的颜色和标注"]}',
        "explanation": "5秒法则是数据可视化的重要原则，强调图表应该快速传达关键信息。"
    },
    {
        "question_type": "short_answer",
        "title": "请说明什么是A/B测试及其在商务分析中的应用。",
        "knowledge_point": "商务数据分析",
        "difficulty": 2,
        "answer": '{"key_points": ["A/B测试是对比两个版本效果的实验方法", "应用场景：1. 网站设计优化", "2. 营销活动效果评估", "3. 产品功能测试", "4. 用户体验改进"]}',
        "explanation": "A/B测试是商务分析中常用的实验方法，帮助企业做出数据驱动的决策。"
    }
]

def create_question(question_data):
    """创建单个试题"""
    url = f"{API_BASE_URL}/questions/"
    params = {"teacher_id": TEACHER_ID}
    
    try:
        response = requests.post(url, params=params, json=question_data)
        if response.status_code == 200:
            return True, response.json()
        else:
            return False, response.text
    except Exception as e:
        return False, str(e)

def main():
    """批量创建试题"""
    print("=" * 60)
    print("开始批量创建试题...")
    print("=" * 60)
    
    success_count = 0
    fail_count = 0
    
    for i, q_data in enumerate(QUESTIONS, 1):
        print(f"\n[{i}/{len(QUESTIONS)}] 创建: {q_data['title'][:30]}...")
        success, result = create_question(q_data)
        
        if success:
            success_count += 1
            print(f"  ✅ 成功")
        else:
            fail_count += 1
            print(f"  ❌ 失败: {result}")
        
        time.sleep(0.1)  # 避免请求过快
    
    print("\n" + "=" * 60)
    print(f"创建完成！")
    print(f"  ✅ 成功: {success_count} 道")
    print(f"  ❌ 失败: {fail_count} 道")
    print("=" * 60)

if __name__ == "__main__":
    main()

