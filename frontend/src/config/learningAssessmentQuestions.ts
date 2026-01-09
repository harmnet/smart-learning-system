/**
 * 学习偏好测评问卷配置
 */

export interface QuestionOption {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  question: string;
  options: QuestionOption[];
}

export const assessmentQuestions: Question[] = [
  {
    id: 'q1',
    question: '我喜欢在固定的时间段学习（如每天晚上8点）',
    options: [
      { id: '1', label: '1 - 完全不符合' },
      { id: '2', label: '2 - 不太符合' },
      { id: '3', label: '3 - 一般' },
      { id: '4', label: '4 - 比较符合' },
      { id: '5', label: '5 - 完全符合' }
    ]
  },
  {
    id: 'q2',
    question: '我能够长时间保持专注学习（超过1小时不休息）',
    options: [
      { id: '1', label: '1 - 完全不符合' },
      { id: '2', label: '2 - 不太符合' },
      { id: '3', label: '3 - 一般' },
      { id: '4', label: '4 - 比较符合' },
      { id: '5', label: '5 - 完全符合' }
    ]
  },
  {
    id: 'q3',
    question: '我喜欢通过视频学习新知识，而不是阅读文字材料',
    options: [
      { id: '1', label: '1 - 完全不符合' },
      { id: '2', label: '2 - 不太符合' },
      { id: '3', label: '3 - 一般' },
      { id: '4', label: '4 - 比较符合' },
      { id: '5', label: '5 - 完全符合' }
    ]
  },
  {
    id: 'q4',
    question: '学习新内容后，我会主动做练习题来巩固知识',
    options: [
      { id: '1', label: '1 - 完全不符合' },
      { id: '2', label: '2 - 不太符合' },
      { id: '3', label: '3 - 一般' },
      { id: '4', label: '4 - 比较符合' },
      { id: '5', label: '5 - 完全符合' }
    ]
  },
  {
    id: 'q5',
    question: '我喜欢做笔记来整理和记忆学习内容',
    options: [
      { id: '1', label: '1 - 完全不符合' },
      { id: '2', label: '2 - 不太符合' },
      { id: '3', label: '3 - 一般' },
      { id: '4', label: '4 - 比较符合' },
      { id: '5', label: '5 - 完全符合' }
    ]
  },
  {
    id: 'q6',
    question: '我更喜欢有挑战性的学习内容，而不是简单易懂的',
    options: [
      { id: '1', label: '1 - 完全不符合' },
      { id: '2', label: '2 - 不太符合' },
      { id: '3', label: '3 - 一般' },
      { id: '4', label: '4 - 比较符合' },
      { id: '5', label: '5 - 完全符合' }
    ]
  },
  {
    id: 'q7',
    question: '我会制定详细的学习计划并严格执行',
    options: [
      { id: '1', label: '1 - 完全不符合' },
      { id: '2', label: '2 - 不太符合' },
      { id: '3', label: '3 - 一般' },
      { id: '4', label: '4 - 比较符合' },
      { id: '5', label: '5 - 完全符合' }
    ]
  },
  {
    id: 'q8',
    question: '我喜欢与同学讨论学习内容，而不是独自学习',
    options: [
      { id: '1', label: '1 - 完全不符合' },
      { id: '2', label: '2 - 不太符合' },
      { id: '3', label: '3 - 一般' },
      { id: '4', label: '4 - 比较符合' },
      { id: '5', label: '5 - 完全符合' }
    ]
  },
  {
    id: 'q9',
    question: '我需要安静的环境才能有效学习',
    options: [
      { id: '1', label: '1 - 完全不符合' },
      { id: '2', label: '2 - 不太符合' },
      { id: '3', label: '3 - 一般' },
      { id: '4', label: '4 - 比较符合' },
      { id: '5', label: '5 - 完全符合' }
    ]
  },
  {
    id: 'q10',
    question: '我会定期回顾之前学过的内容，避免遗忘',
    options: [
      { id: '1', label: '1 - 完全不符合' },
      { id: '2', label: '2 - 不太符合' },
      { id: '3', label: '3 - 一般' },
      { id: '4', label: '4 - 比较符合' },
      { id: '5', label: '5 - 完全符合' }
    ]
  }
];

export const openQuestion = {
  id: 'open',
  question: '请简单分享你的学习习惯或困惑（选填，50-200字）',
  placeholder: '例如：我发现自己更适合在早上学习，但经常缺乏动力开始...'
};
