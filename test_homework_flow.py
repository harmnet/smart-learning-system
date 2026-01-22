#!/usr/bin/env python3
"""
作业功能完整测试脚本
测试流程:
1. 老师添加作业到课程大纲
2. 学生提交作业
3. 老师批改作业
"""
import requests
import json
import sys
from typing import Optional, Dict, Any

BASE_URL = "http://localhost:8000/api/v1"

class HomeworkFlowTester:
    def __init__(self):
        self.teacher_token: Optional[str] = None
        self.student_token: Optional[str] = None
        self.teacher_id: Optional[int] = None
        self.student_id: Optional[int] = None
        self.course_id: int = 1  # 默认课程ID
        self.chapter_id: Optional[int] = None
        self.section_id: Optional[int] = None
        self.homework_id: Optional[int] = None
        self.submission_id: Optional[int] = None
        
    def login(self, username: str, password: str, role: str) -> bool:
        """登录获取token"""
        try:
            response = requests.post(
                f"{BASE_URL}/auth/login",
                data={"username": username, "password": password},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                token = data.get("access_token")
                user = data.get("user", {})
                user_id = user.get("id")
                
                if role == "teacher":
                    self.teacher_token = token
                    self.teacher_id = user_id
                    print(f"✅ 老师登录成功: {user.get('full_name', username)} (ID: {user_id})")
                else:
                    self.student_token = token
                    self.student_id = user_id
                    print(f"✅ 学生登录成功: {user.get('full_name', username)} (ID: {user_id})")
                return True
            else:
                print(f"❌ {role}登录失败: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ {role}登录异常: {str(e)}")
            return False
    
    def get_headers(self, role: str = "teacher") -> Dict[str, str]:
        """获取请求头"""
        token = self.teacher_token if role == "teacher" else self.student_token
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    
    def test_get_course_outline(self) -> bool:
        """测试1: 获取课程大纲"""
        print("\n📋 测试1: 获取课程大纲")
        try:
            response = requests.get(
                f"{BASE_URL}/course-outline/courses/{self.course_id}/outline",
                headers=self.get_headers("teacher"),
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                outline = data.get("outline", [])
                if outline:
                    # 找到第一个章节的第一个小节
                    for chapter in outline:
                        sections = chapter.get("sections", [])
                        if sections:
                            self.chapter_id = chapter.get("id")
                            self.section_id = sections[0].get("id")
                            print(f"✅ 找到章节: {chapter.get('title')} (ID: {self.chapter_id})")
                            print(f"✅ 找到小节: {sections[0].get('title')} (ID: {self.section_id})")
                            return True
                print("⚠️  课程大纲为空，无法添加作业")
                return False
            else:
                print(f"❌ 获取课程大纲失败: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ 获取课程大纲异常: {str(e)}")
            return False
    
    def test_create_homework(self) -> bool:
        """测试2: 老师创建作业"""
        print("\n📝 测试2: 老师创建作业")
        if not self.section_id:
            print("❌ 没有找到小节ID，无法创建作业")
            return False
        
        try:
            homework_data = {
                "title": "测试作业 - API测试",
                "description": "<p>这是一个通过API创建的测试作业</p>",
                "sort_order": 0
            }
            response = requests.post(
                f"{BASE_URL}/course-outline/chapters/{self.section_id}/homeworks",
                headers=self.get_headers("teacher"),
                json=homework_data,
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                self.homework_id = data.get("id")
                print(f"✅ 作业创建成功: {homework_data['title']} (ID: {self.homework_id})")
                return True
            else:
                print(f"❌ 创建作业失败: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ 创建作业异常: {str(e)}")
            return False
    
    def test_student_submit_homework(self) -> bool:
        """测试3: 学生提交作业"""
        print("\n📤 测试3: 学生提交作业")
        if not self.homework_id:
            print("❌ 没有作业ID，无法提交")
            return False
        
        try:
            submission_data = {
                "content": "这是学生通过API提交的作业内容。\n\n我完成了以下内容:\n1. 学习了课程内容\n2. 完成了练习题\n3. 提交了作业",
                "is_final": True
            }
            response = requests.post(
                f"{BASE_URL}/student/homeworks/{self.homework_id}/submit",
                headers=self.get_headers("student"),
                json=submission_data,
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                self.submission_id = data.get("id")
                print(f"✅ 作业提交成功 (提交ID: {self.submission_id})")
                print(f"   状态: {data.get('status')}")
                return True
            else:
                print(f"❌ 提交作业失败: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ 提交作业异常: {str(e)}")
            return False
    
    def test_get_submissions(self) -> bool:
        """测试4: 老师获取作业提交列表"""
        print("\n📋 测试4: 老师获取作业提交列表")
        try:
            response = requests.get(
                f"{BASE_URL}/teacher/homeworks/submissions",
                headers=self.get_headers("teacher"),
                params={"limit": 10},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                items = data.get("items", [])
                total = data.get("total", 0)
                print(f"✅ 获取提交列表成功: 共 {total} 条记录")
                if items:
                    print(f"   最新提交: {items[0].get('homework_title')} - {items[0].get('student_name')}")
                return True
            else:
                print(f"❌ 获取提交列表失败: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ 获取提交列表异常: {str(e)}")
            return False
    
    def test_get_submission_detail(self) -> bool:
        """测试5: 老师获取作业提交详情"""
        print("\n📄 测试5: 老师获取作业提交详情")
        if not self.submission_id:
            print("❌ 没有提交ID，无法获取详情")
            return False
        
        try:
            response = requests.get(
                f"{BASE_URL}/teacher/homeworks/submissions/{self.submission_id}",
                headers=self.get_headers("teacher"),
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                print(f"✅ 获取提交详情成功")
                print(f"   学生: {data.get('student', {}).get('name')}")
                print(f"   作业: {data.get('homework', {}).get('title')}")
                print(f"   状态: {data.get('status')}")
                return True
            else:
                print(f"❌ 获取提交详情失败: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ 获取提交详情异常: {str(e)}")
            return False
    
    def test_grade_homework(self) -> bool:
        """测试6: 老师批改作业"""
        print("\n✏️  测试6: 老师批改作业")
        if not self.submission_id:
            print("❌ 没有提交ID，无法批改")
            return False
        
        try:
            grade_data = {
                "score": 85,
                "teacher_comment": "作业完成得很好，内容充实，逻辑清晰。继续加油！"
            }
            response = requests.post(
                f"{BASE_URL}/teacher/homeworks/submissions/{self.submission_id}/grade",
                headers=self.get_headers("teacher"),
                json=grade_data,
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                print(f"✅ 批改成功")
                print(f"   评分: {data.get('score')}")
                print(f"   状态: {data.get('status')}")
                return True
            else:
                print(f"❌ 批改失败: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ 批改异常: {str(e)}")
            return False
    
    def test_get_grade_history(self) -> bool:
        """测试7: 获取评分历史"""
        print("\n📊 测试7: 获取评分历史")
        if not self.submission_id:
            print("❌ 没有提交ID，无法获取历史")
            return False
        
        try:
            response = requests.get(
                f"{BASE_URL}/teacher/homeworks/submissions/{self.submission_id}/history",
                headers=self.get_headers("teacher"),
                params={"skip": 0, "limit": 10},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                items = data.get("items", [])
                print(f"✅ 获取评分历史成功: 共 {len(items)} 条记录")
                if items:
                    print(f"   最新评分: {items[0].get('score')} 分")
                return True
            else:
                print(f"❌ 获取评分历史失败: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ 获取评分历史异常: {str(e)}")
            return False
    
    def run_all_tests(self, teacher_username: str, teacher_password: str,
                     student_username: str, student_password: str):
        """运行所有测试"""
        print("=" * 60)
        print("🧪 作业功能完整测试")
        print("=" * 60)
        
        # 登录
        if not self.login(teacher_username, teacher_password, "teacher"):
            print("\n❌ 老师登录失败，无法继续测试")
            return False
        
        if not self.login(student_username, student_password, "student"):
            print("\n❌ 学生登录失败，无法继续测试")
            return False
        
        # 执行测试
        results = []
        results.append(("获取课程大纲", self.test_get_course_outline()))
        results.append(("创建作业", self.test_create_homework()))
        results.append(("学生提交作业", self.test_student_submit_homework()))
        results.append(("获取提交列表", self.test_get_submissions()))
        results.append(("获取提交详情", self.test_get_submission_detail()))
        results.append(("批改作业", self.test_grade_homework()))
        results.append(("获取评分历史", self.test_get_grade_history()))
        
        # 输出测试结果
        print("\n" + "=" * 60)
        print("📊 测试结果汇总")
        print("=" * 60)
        passed = sum(1 for _, result in results if result)
        total = len(results)
        for name, result in results:
            status = "✅ 通过" if result else "❌ 失败"
            print(f"{status} - {name}")
        print(f"\n总计: {passed}/{total} 通过")
        print("=" * 60)
        
        return passed == total


def main():
    """主函数"""
    tester = HomeworkFlowTester()
    
    # 从命令行参数获取账号信息，或使用默认值
    if len(sys.argv) >= 5:
        teacher_user = sys.argv[1]
        teacher_pwd = sys.argv[2]
        student_user = sys.argv[3]
        student_pwd = sys.argv[4]
    else:
        print("📝 使用方法: python test_homework_flow.py <teacher_username> <teacher_password> <student_username> <student_password>")
        print("📝 示例: python test_homework_flow.py 张老师 password123 student001 password123")
        print("\n⚠️  使用默认测试账号...")
        teacher_user = "张老师"
        teacher_pwd = "password123"
        student_user = "student001"
        student_pwd = "password123"
    
    success = tester.run_all_tests(teacher_user, teacher_pwd, student_user, student_pwd)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
