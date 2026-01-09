"""
Test cases for exam papers knowledge point, clear questions, and AI assemble features
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.base import User
from app.models.exam_paper import ExamPaper, ExamPaperQuestion
from app.models.question import Question, QuestionOption
from app.models.knowledge_graph import KnowledgeGraph, KnowledgeNode


# ============= Fixtures =============

@pytest.fixture
async def setup_knowledge_point_data(db: AsyncSession, test_teacher: User):
    """准备知识点和题目数据"""
    # 创建知识图谱和节点
    graph = KnowledgeGraph(
        teacher_id=test_teacher.id,
        graph_name="测试知识图谱",
        description="用于测试"
    )
    db.add(graph)
    await db.flush()
    
    # 创建知识节点
    node = KnowledgeNode(
        graph_id=graph.id,
        node_name="数据结构",
        node_content="数据结构基础知识"
    )
    db.add(node)
    await db.flush()
    
    # 创建不同类型的题目
    questions = []
    for i in range(20):
        question_type = "single_choice" if i < 10 else "multiple_choice"
        question = Question(
            teacher_id=test_teacher.id,
            question_type=question_type,
            title=f"测试题目{i+1}: 关于数据结构的问题",
            knowledge_point="数据结构",
            answer="A" if question_type == "single_choice" else "AB",
            explanation="这是测试解析",
            difficulty=1,
            is_active=True
        )
        db.add(question)
        await db.flush()
        
        # 为选择题添加选项
        if question_type in ["single_choice", "multiple_choice"]:
            for j, label in enumerate(['A', 'B', 'C', 'D']):
                option = QuestionOption(
                    question_id=question.id,
                    option_label=label,
                    option_text=f"选项{label}",
                    is_correct=(label == 'A' or (question_type == "multiple_choice" and label == 'B')),
                    sort_order=j
                )
                db.add(option)
        
        questions.append(question)
    
    await db.commit()
    return {"graph": graph, "node": node, "questions": questions}


async def create_test_paper_with_knowledge_point(
    db: AsyncSession,
    teacher_id: int,
    knowledge_point: str,
    total_score: float = 100.0
) -> ExamPaper:
    """创建带知识点的测试试卷"""
    paper = ExamPaper(
        teacher_id=teacher_id,
        paper_name="测试试卷",
        composition_mode="manual",
        total_score=total_score,
        question_order="fixed",
        option_order="fixed",
        knowledge_point=knowledge_point,
        duration_minutes=60,
        min_submit_minutes=10,
        is_active=True
    )
    db.add(paper)
    await db.commit()
    await db.refresh(paper)
    return paper


# ============= 知识点字段相关测试 =============

@pytest.mark.asyncio
async def test_create_exam_paper_with_knowledge_point(
    client: AsyncClient,
    test_teacher: User
):
    """测试创建试卷时包含知识点"""
    response = await client.post(
        f"/api/v1/teacher/exam-papers/?teacher_id={test_teacher.id}",
        json={
            "paper_name": "测试试卷",
            "composition_mode": "manual",
            "total_score": 100,
            "question_order": "fixed",
            "option_order": "fixed",
            "knowledge_point": "数据结构"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["paper_name"] == "测试试卷"


@pytest.mark.asyncio
async def test_create_exam_paper_without_knowledge_point(
    client: AsyncClient,
    test_teacher: User
):
    """测试创建试卷时缺少knowledge_point字段"""
    response = await client.post(
        f"/api/v1/teacher/exam-papers/?teacher_id={test_teacher.id}",
        json={
            "paper_name": "测试试卷",
            "composition_mode": "manual",
            "total_score": 100,
            "question_order": "fixed",
            "option_order": "fixed"
            # 故意不包含 knowledge_point
        }
    )
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_update_exam_paper_knowledge_point(
    client: AsyncClient,
    db: AsyncSession,
    test_teacher: User
):
    """测试更新试卷的知识点"""
    # 创建试卷
    paper = await create_test_paper_with_knowledge_point(
        db, test_teacher.id, "数据结构"
    )
    
    # 更新知识点
    response = await client.put(
        f"/api/v1/teacher/exam-papers/{paper.id}?teacher_id={test_teacher.id}",
        json={
            "knowledge_point": "算法分析"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "message" in data


@pytest.mark.asyncio
async def test_get_exam_paper_returns_knowledge_point(
    client: AsyncClient,
    db: AsyncSession,
    test_teacher: User
):
    """测试获取试卷详情时返回知识点"""
    # 创建试卷
    paper = await create_test_paper_with_knowledge_point(
        db, test_teacher.id, "数据结构"
    )
    
    # 获取试卷详情
    response = await client.get(
        f"/api/v1/teacher/exam-papers/{paper.id}?teacher_id={test_teacher.id}"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["knowledge_point"] == "数据结构"


@pytest.mark.asyncio
async def test_list_exam_papers_includes_knowledge_point(
    client: AsyncClient,
    db: AsyncSession,
    test_teacher: User
):
    """测试列表接口返回知识点"""
    # 创建试卷
    await create_test_paper_with_knowledge_point(
        db, test_teacher.id, "数据结构"
    )
    
    # 获取试卷列表
    response = await client.get(
        f"/api/v1/teacher/exam-papers/?teacher_id={test_teacher.id}"
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert "knowledge_point" in data[0]
    assert data[0]["knowledge_point"] == "数据结构"


# ============= 清空试题功能测试 =============

@pytest.mark.asyncio
async def test_clear_all_questions_success(
    client: AsyncClient,
    db: AsyncSession,
    test_teacher: User,
    setup_knowledge_point_data
):
    """测试成功清空试卷所有试题"""
    # 创建试卷并添加题目
    paper = await create_test_paper_with_knowledge_point(
        db, test_teacher.id, "数据结构"
    )
    
    # 添加3道题目
    questions = setup_knowledge_point_data["questions"][:3]
    for i, q in enumerate(questions):
        epq = ExamPaperQuestion(
            exam_paper_id=paper.id,
            question_id=q.id,
            score=5.0,
            sort_order=i
        )
        db.add(epq)
    await db.commit()
    
    # 清空试题
    response = await client.delete(
        f"/api/v1/teacher/exam-papers/{paper.id}/questions/clear?teacher_id={test_teacher.id}"
    )
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    
    # 验证试题已被清空
    result = await db.execute(
        select(ExamPaperQuestion).where(
            ExamPaperQuestion.exam_paper_id == paper.id
        )
    )
    remaining = result.scalars().all()
    assert len(remaining) == 0


@pytest.mark.asyncio
async def test_clear_all_questions_empty_paper(
    client: AsyncClient,
    db: AsyncSession,
    test_teacher: User
):
    """测试清空已经没有试题的试卷"""
    # 创建空试卷
    paper = await create_test_paper_with_knowledge_point(
        db, test_teacher.id, "数据结构"
    )
    
    # 清空试题
    response = await client.delete(
        f"/api/v1/teacher/exam-papers/{paper.id}/questions/clear?teacher_id={test_teacher.id}"
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_clear_all_questions_nonexistent_paper(
    client: AsyncClient,
    test_teacher: User
):
    """测试清空不存在的试卷(应返回404)"""
    response = await client.delete(
        f"/api/v1/teacher/exam-papers/99999/questions/clear?teacher_id={test_teacher.id}"
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_clear_all_questions_other_teacher_paper(
    client: AsyncClient,
    db: AsyncSession,
    test_teacher: User,
    another_teacher: User
):
    """测试清空其他教师的试卷(应失败)"""
    # 用test_teacher创建试卷
    paper = await create_test_paper_with_knowledge_point(
        db, test_teacher.id, "数据结构"
    )
    
    # 用another_teacher尝试清空
    response = await client.delete(
        f"/api/v1/teacher/exam-papers/{paper.id}/questions/clear?teacher_id={another_teacher.id}"
    )
    assert response.status_code == 404  # 找不到该试卷


# ============= AI组卷功能测试 =============

@pytest.mark.asyncio
async def test_ai_assemble_success(
    client: AsyncClient,
    db: AsyncSession,
    test_teacher: User,
    setup_knowledge_point_data
):
    """测试AI组卷成功(题目充足)"""
    # 创建试卷
    paper = await create_test_paper_with_knowledge_point(
        db, test_teacher.id, "数据结构", total_score=50.0
    )
    
    # 请求5道单选题
    response = await client.post(
        f"/api/v1/teacher/exam-papers/{paper.id}/ai-assemble?teacher_id={test_teacher.id}",
        json={
            "question_configs": [
                {
                    "question_type": "single_choice",
                    "count": 5,
                    "score_per_question": 10
                }
            ]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "questions" in data
    assert len(data["questions"]) == 5
    assert data["total_score"] == 50.0


@pytest.mark.asyncio
async def test_ai_assemble_insufficient_questions(
    client: AsyncClient,
    db: AsyncSession,
    test_teacher: User,
    setup_knowledge_point_data
):
    """测试AI组卷失败(题目数量不足)"""
    # 创建试卷
    paper = await create_test_paper_with_knowledge_point(
        db, test_teacher.id, "数据结构"
    )
    
    # 请求30道单选题,但只有10道
    response = await client.post(
        f"/api/v1/teacher/exam-papers/{paper.id}/ai-assemble?teacher_id={test_teacher.id}",
        json={
            "question_configs": [
                {
                    "question_type": "single_choice",
                    "count": 30,
                    "score_per_question": 2
                }
            ]
        }
    )
    assert response.status_code == 400
    assert "数量不足" in response.json()["detail"]


@pytest.mark.asyncio
async def test_ai_assemble_score_exceeds_limit(
    client: AsyncClient,
    db: AsyncSession,
    test_teacher: User,
    setup_knowledge_point_data
):
    """测试AI组卷失败(总分超过试卷总分)"""
    # 创建试卷
    paper = await create_test_paper_with_knowledge_point(
        db, test_teacher.id, "数据结构", total_score=50.0
    )
    
    # 配置总分超过试卷总分
    response = await client.post(
        f"/api/v1/teacher/exam-papers/{paper.id}/ai-assemble?teacher_id={test_teacher.id}",
        json={
            "question_configs": [
                {
                    "question_type": "single_choice",
                    "count": 10,
                    "score_per_question": 10  # 10*10=100 > 50
                }
            ]
        }
    )
    assert response.status_code == 400
    assert "超过" in response.json()["detail"]


@pytest.mark.asyncio
async def test_ai_assemble_filters_existing_questions(
    client: AsyncClient,
    db: AsyncSession,
    test_teacher: User,
    setup_knowledge_point_data
):
    """测试AI组卷排除已添加的题目"""
    # 创建试卷
    paper = await create_test_paper_with_knowledge_point(
        db, test_teacher.id, "数据结构", total_score=100.0
    )
    
    # 先添加2道题目到试卷
    questions = setup_knowledge_point_data["questions"][:2]
    for i, q in enumerate(questions):
        epq = ExamPaperQuestion(
            exam_paper_id=paper.id,
            question_id=q.id,
            score=5.0,
            sort_order=i
        )
        db.add(epq)
    await db.commit()
    
    # AI组卷请求5道单选题
    response = await client.post(
        f"/api/v1/teacher/exam-papers/{paper.id}/ai-assemble?teacher_id={test_teacher.id}",
        json={
            "question_configs": [
                {
                    "question_type": "single_choice",
                    "count": 5,
                    "score_per_question": 10
                }
            ]
        }
    )
    assert response.status_code == 200
    data = response.json()
    
    # 验证返回的题目不包含已添加的题目
    returned_question_ids = [q["id"] for q in data["questions"]]
    existing_question_ids = [q.id for q in questions]
    for qid in existing_question_ids:
        assert qid not in returned_question_ids


@pytest.mark.asyncio
async def test_ai_assemble_multiple_question_types(
    client: AsyncClient,
    db: AsyncSession,
    test_teacher: User,
    setup_knowledge_point_data
):
    """测试AI组卷多种题型配置"""
    # 创建试卷
    paper = await create_test_paper_with_knowledge_point(
        db, test_teacher.id, "数据结构", total_score=100.0
    )
    
    # 配置多种题型
    response = await client.post(
        f"/api/v1/teacher/exam-papers/{paper.id}/ai-assemble?teacher_id={test_teacher.id}",
        json={
            "question_configs": [
                {
                    "question_type": "single_choice",
                    "count": 5,
                    "score_per_question": 10
                },
                {
                    "question_type": "multiple_choice",
                    "count": 5,
                    "score_per_question": 10
                }
            ]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["questions"]) == 10
    assert data["total_score"] == 100.0
    
    # 验证题型分布
    single_choice_count = sum(1 for q in data["questions"] if q["question_type"] == "single_choice")
    multiple_choice_count = sum(1 for q in data["questions"] if q["question_type"] == "multiple_choice")
    assert single_choice_count == 5
    assert multiple_choice_count == 5


@pytest.mark.asyncio
async def test_confirm_ai_assemble_success(
    client: AsyncClient,
    db: AsyncSession,
    test_teacher: User,
    setup_knowledge_point_data
):
    """测试确认AI组卷结果成功添加到试卷"""
    # 创建试卷
    paper = await create_test_paper_with_knowledge_point(
        db, test_teacher.id, "数据结构", total_score=50.0
    )
    
    # 先进行AI组卷
    ai_response = await client.post(
        f"/api/v1/teacher/exam-papers/{paper.id}/ai-assemble?teacher_id={test_teacher.id}",
        json={
            "question_configs": [
                {
                    "question_type": "single_choice",
                    "count": 5,
                    "score_per_question": 10
                }
            ]
        }
    )
    assert ai_response.status_code == 200
    ai_data = ai_response.json()
    
    # 确认添加
    questions_to_add = [
        {"question_id": q["id"], "score": q["score"]}
        for q in ai_data["questions"]
    ]
    
    confirm_response = await client.post(
        f"/api/v1/teacher/exam-papers/{paper.id}/ai-assemble/confirm?teacher_id={test_teacher.id}",
        json={"questions": questions_to_add}
    )
    assert confirm_response.status_code == 200
    
    # 验证题目已添加到试卷
    result = await db.execute(
        select(ExamPaperQuestion).where(
            ExamPaperQuestion.exam_paper_id == paper.id
        )
    )
    added_questions = result.scalars().all()
    assert len(added_questions) == 5


@pytest.mark.asyncio
async def test_confirm_ai_assemble_duplicate_questions(
    client: AsyncClient,
    db: AsyncSession,
    test_teacher: User,
    setup_knowledge_point_data
):
    """测试确认时自动过滤重复题目"""
    # 创建试卷
    paper = await create_test_paper_with_knowledge_point(
        db, test_teacher.id, "数据结构", total_score=100.0
    )
    
    # 先手动添加一道题目
    first_question = setup_knowledge_point_data["questions"][0]
    epq = ExamPaperQuestion(
        exam_paper_id=paper.id,
        question_id=first_question.id,
        score=10.0,
        sort_order=0
    )
    db.add(epq)
    await db.commit()
    
    # 尝试通过AI组卷确认添加包含重复题目的列表
    questions_to_add = [
        {"question_id": first_question.id, "score": 10.0},  # 重复
        {"question_id": setup_knowledge_point_data["questions"][1].id, "score": 10.0},
        {"question_id": setup_knowledge_point_data["questions"][2].id, "score": 10.0}
    ]
    
    confirm_response = await client.post(
        f"/api/v1/teacher/exam-papers/{paper.id}/ai-assemble/confirm?teacher_id={test_teacher.id}",
        json={"questions": questions_to_add}
    )
    assert confirm_response.status_code == 200
    
    # 验证只添加了2道新题目(跳过了重复的)
    data = confirm_response.json()
    assert data["added_count"] == 2
    
    # 验证总共只有3道题目
    result = await db.execute(
        select(ExamPaperQuestion).where(
            ExamPaperQuestion.exam_paper_id == paper.id
        )
    )
    all_questions = result.scalars().all()
    assert len(all_questions) == 3

