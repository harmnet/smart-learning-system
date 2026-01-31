--
-- PostgreSQL database dump
--

\restrict f40VQpHrTZY2KBp8FznhW12yAcBaD8cVNNs4BNCfnptbT8wI771A3ljoOyvqtTr

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_quiz_record; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_quiz_record (
    id integer NOT NULL,
    student_id integer NOT NULL,
    resource_id integer NOT NULL,
    assessment_id integer,
    questions jsonb NOT NULL,
    user_answers jsonb,
    score numeric(5,2),
    total_score integer DEFAULT 100,
    is_submitted boolean DEFAULT false,
    llm_config_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    submitted_at timestamp without time zone
);


ALTER TABLE public.ai_quiz_record OWNER TO postgres;

--
-- Name: TABLE ai_quiz_record; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.ai_quiz_record IS 'AI测评记录表';


--
-- Name: COLUMN ai_quiz_record.student_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_quiz_record.student_id IS '学生ID';


--
-- Name: COLUMN ai_quiz_record.resource_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_quiz_record.resource_id IS '教学资源ID';


--
-- Name: COLUMN ai_quiz_record.assessment_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_quiz_record.assessment_id IS '关联的学习偏好测评ID';


--
-- Name: COLUMN ai_quiz_record.questions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_quiz_record.questions IS '测评题目（JSON格式）';


--
-- Name: COLUMN ai_quiz_record.user_answers; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_quiz_record.user_answers IS '学生答案（JSON格式）';


--
-- Name: COLUMN ai_quiz_record.score; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_quiz_record.score IS '得分';


--
-- Name: COLUMN ai_quiz_record.total_score; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_quiz_record.total_score IS '总分';


--
-- Name: COLUMN ai_quiz_record.is_submitted; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_quiz_record.is_submitted IS '是否已提交';


--
-- Name: COLUMN ai_quiz_record.llm_config_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_quiz_record.llm_config_id IS '使用的大模型配置ID';


--
-- Name: COLUMN ai_quiz_record.submitted_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_quiz_record.submitted_at IS '提交时间';


--
-- Name: ai_quiz_record_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ai_quiz_record_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ai_quiz_record_id_seq OWNER TO postgres;

--
-- Name: ai_quiz_record_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ai_quiz_record_id_seq OWNED BY public.ai_quiz_record.id;


--
-- Name: class_course_relation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.class_course_relation (
    id integer NOT NULL,
    class_id integer,
    course_id integer,
    teacher_id integer,
    semester_id integer,
    schedule_desc character varying
);


ALTER TABLE public.class_course_relation OWNER TO postgres;

--
-- Name: class_course_relation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.class_course_relation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.class_course_relation_id_seq OWNER TO postgres;

--
-- Name: class_course_relation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.class_course_relation_id_seq OWNED BY public.class_course_relation.id;


--
-- Name: course; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course (
    id integer NOT NULL,
    title character varying NOT NULL,
    code character varying,
    description text,
    cover_image character varying,
    credits integer,
    course_type character varying(20),
    hours integer,
    introduction text,
    objectives text,
    main_teacher_id integer,
    is_public boolean,
    major_id integer,
    course_category character varying(50),
    enrollment_type character varying(20),
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.course OWNER TO postgres;

--
-- Name: COLUMN course.course_category; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.course.course_category IS '课程类型：general（通识课）、professional_basic（专业基础课）、professional_core（专业核心课）、expansion（拓展课）、elective_course（选修课）';


--
-- Name: COLUMN course.enrollment_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.course.enrollment_type IS '选课类型：required（必修课）、elective（选修课）、retake（重修课）';


--
-- Name: COLUMN course.is_deleted; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.course.is_deleted IS '逻辑删除标记';


--
-- Name: course_chapter; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_chapter (
    id integer NOT NULL,
    course_id integer NOT NULL,
    title character varying NOT NULL,
    sort_order integer,
    parent_id integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.course_chapter OWNER TO postgres;

--
-- Name: course_chapter_exam; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_chapter_exam (
    id integer NOT NULL,
    chapter_id integer NOT NULL,
    exam_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.course_chapter_exam OWNER TO postgres;

--
-- Name: TABLE course_chapter_exam; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.course_chapter_exam IS '课程章节与考试的关联表';


--
-- Name: COLUMN course_chapter_exam.chapter_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.course_chapter_exam.chapter_id IS '课程章节ID（章或小节）';


--
-- Name: COLUMN course_chapter_exam.exam_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.course_chapter_exam.exam_id IS '考试ID';


--
-- Name: COLUMN course_chapter_exam.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.course_chapter_exam.created_at IS '创建时间';


--
-- Name: course_chapter_exam_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.course_chapter_exam_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.course_chapter_exam_id_seq OWNER TO postgres;

--
-- Name: course_chapter_exam_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.course_chapter_exam_id_seq OWNED BY public.course_chapter_exam.id;


--
-- Name: course_chapter_exam_paper; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_chapter_exam_paper (
    id integer NOT NULL,
    chapter_id integer NOT NULL,
    exam_paper_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.course_chapter_exam_paper OWNER TO postgres;

--
-- Name: course_chapter_exam_paper_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.course_chapter_exam_paper_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.course_chapter_exam_paper_id_seq OWNER TO postgres;

--
-- Name: course_chapter_exam_paper_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.course_chapter_exam_paper_id_seq OWNED BY public.course_chapter_exam_paper.id;


--
-- Name: course_chapter_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.course_chapter_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.course_chapter_id_seq OWNER TO postgres;

--
-- Name: course_chapter_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.course_chapter_id_seq OWNED BY public.course_chapter.id;


--
-- Name: course_chapter_knowledge_graph; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_chapter_knowledge_graph (
    id integer NOT NULL,
    chapter_id integer NOT NULL,
    knowledge_graph_id integer NOT NULL,
    knowledge_node_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.course_chapter_knowledge_graph OWNER TO postgres;

--
-- Name: TABLE course_chapter_knowledge_graph; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.course_chapter_knowledge_graph IS '章节知识图谱关联表';


--
-- Name: COLUMN course_chapter_knowledge_graph.knowledge_node_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.course_chapter_knowledge_graph.knowledge_node_id IS '关联的具体节点（可选）';


--
-- Name: course_chapter_knowledge_graph_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.course_chapter_knowledge_graph_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.course_chapter_knowledge_graph_id_seq OWNER TO postgres;

--
-- Name: course_chapter_knowledge_graph_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.course_chapter_knowledge_graph_id_seq OWNED BY public.course_chapter_knowledge_graph.id;


--
-- Name: course_chapter_learning_rule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_chapter_learning_rule (
    id integer NOT NULL,
    chapter_id integer NOT NULL,
    rule_type character varying(20) DEFAULT 'none'::character varying NOT NULL,
    completion_percentage integer,
    target_chapter_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.course_chapter_learning_rule OWNER TO postgres;

--
-- Name: TABLE course_chapter_learning_rule; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.course_chapter_learning_rule IS '章节学习规则表';


--
-- Name: COLUMN course_chapter_learning_rule.rule_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.course_chapter_learning_rule.rule_type IS '规则类型：none（无条件）、completion（完成度）、exam（通过测验）';


--
-- Name: COLUMN course_chapter_learning_rule.completion_percentage; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.course_chapter_learning_rule.completion_percentage IS '完成度百分比（当rule_type为completion时使用）';


--
-- Name: COLUMN course_chapter_learning_rule.target_chapter_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.course_chapter_learning_rule.target_chapter_id IS '目标章节ID（上一章/小节）';


--
-- Name: course_chapter_learning_rule_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.course_chapter_learning_rule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.course_chapter_learning_rule_id_seq OWNER TO postgres;

--
-- Name: course_chapter_learning_rule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.course_chapter_learning_rule_id_seq OWNED BY public.course_chapter_learning_rule.id;


--
-- Name: course_cover; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_cover (
    id integer NOT NULL,
    course_id integer,
    filename character varying NOT NULL,
    file_size integer,
    sort_order integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.course_cover OWNER TO postgres;

--
-- Name: course_cover_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.course_cover_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.course_cover_id_seq OWNER TO postgres;

--
-- Name: course_cover_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.course_cover_id_seq OWNED BY public.course_cover.id;


--
-- Name: course_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.course_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.course_id_seq OWNER TO postgres;

--
-- Name: course_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.course_id_seq OWNED BY public.course.id;


--
-- Name: course_resource; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_resource (
    id integer NOT NULL,
    chapter_id integer,
    title character varying NOT NULL,
    resource_type character varying NOT NULL,
    file_url character varying NOT NULL,
    duration_seconds integer
);


ALTER TABLE public.course_resource OWNER TO postgres;

--
-- Name: course_resource_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.course_resource_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.course_resource_id_seq OWNER TO postgres;

--
-- Name: course_resource_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.course_resource_id_seq OWNED BY public.course_resource.id;


--
-- Name: course_section_homework; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_section_homework (
    id integer NOT NULL,
    chapter_id integer NOT NULL,
    title character varying NOT NULL,
    description text,
    deadline timestamp without time zone,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.course_section_homework OWNER TO postgres;

--
-- Name: course_section_homework_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.course_section_homework_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.course_section_homework_id_seq OWNER TO postgres;

--
-- Name: course_section_homework_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.course_section_homework_id_seq OWNED BY public.course_section_homework.id;


--
-- Name: course_section_resource; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_section_resource (
    id integer NOT NULL,
    chapter_id integer NOT NULL,
    resource_type character varying NOT NULL,
    resource_id integer NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.course_section_resource OWNER TO postgres;

--
-- Name: course_section_resource_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.course_section_resource_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.course_section_resource_id_seq OWNER TO postgres;

--
-- Name: course_section_resource_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.course_section_resource_id_seq OWNED BY public.course_section_resource.id;


--
-- Name: dictionary_item; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dictionary_item (
    id integer NOT NULL,
    type_id integer NOT NULL,
    code character varying NOT NULL,
    label character varying NOT NULL,
    value character varying NOT NULL,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    remark character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone
);


ALTER TABLE public.dictionary_item OWNER TO postgres;

--
-- Name: dictionary_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dictionary_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.dictionary_item_id_seq OWNER TO postgres;

--
-- Name: dictionary_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dictionary_item_id_seq OWNED BY public.dictionary_item.id;


--
-- Name: dictionary_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dictionary_type (
    id integer NOT NULL,
    code character varying NOT NULL,
    name character varying NOT NULL,
    description character varying,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone
);


ALTER TABLE public.dictionary_type OWNER TO postgres;

--
-- Name: dictionary_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dictionary_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.dictionary_type_id_seq OWNER TO postgres;

--
-- Name: dictionary_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dictionary_type_id_seq OWNED BY public.dictionary_type.id;


--
-- Name: enrollment_order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enrollment_order (
    id integer NOT NULL,
    order_no character varying NOT NULL,
    student_id integer,
    major_id integer,
    amount numeric(10,2) NOT NULL,
    status character varying,
    created_at timestamp without time zone,
    paid_at timestamp without time zone
);


ALTER TABLE public.enrollment_order OWNER TO postgres;

--
-- Name: enrollment_order_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.enrollment_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.enrollment_order_id_seq OWNER TO postgres;

--
-- Name: enrollment_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.enrollment_order_id_seq OWNED BY public.enrollment_order.id;


--
-- Name: exam; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exam (
    id integer NOT NULL,
    teacher_id integer NOT NULL,
    exam_paper_id integer NOT NULL,
    exam_name character varying NOT NULL,
    exam_date timestamp without time zone NOT NULL,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone NOT NULL,
    cover_image character varying,
    early_login_minutes integer,
    late_forbidden_minutes integer,
    is_active boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    minimum_submission_minutes integer DEFAULT 15 NOT NULL
);


ALTER TABLE public.exam OWNER TO postgres;

--
-- Name: COLUMN exam.minimum_submission_minutes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.exam.minimum_submission_minutes IS '最早交卷时间（分钟）';


--
-- Name: exam_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.exam_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.exam_id_seq OWNER TO postgres;

--
-- Name: exam_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.exam_id_seq OWNED BY public.exam.id;


--
-- Name: exam_paper; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exam_paper (
    id integer NOT NULL,
    teacher_id integer NOT NULL,
    paper_name character varying NOT NULL,
    duration_minutes integer NOT NULL,
    min_submit_minutes integer NOT NULL,
    composition_mode character varying NOT NULL,
    total_score numeric(10,2) NOT NULL,
    question_order character varying NOT NULL,
    option_order character varying NOT NULL,
    is_active boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    knowledge_point character varying(255)
);


ALTER TABLE public.exam_paper OWNER TO postgres;

--
-- Name: COLUMN exam_paper.knowledge_point; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.exam_paper.knowledge_point IS '关联的知识点名称';


--
-- Name: exam_paper_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.exam_paper_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.exam_paper_id_seq OWNER TO postgres;

--
-- Name: exam_paper_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.exam_paper_id_seq OWNED BY public.exam_paper.id;


--
-- Name: exam_paper_question; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exam_paper_question (
    id integer NOT NULL,
    exam_paper_id integer NOT NULL,
    question_id integer NOT NULL,
    score numeric(10,2) NOT NULL,
    sort_order integer,
    created_at timestamp without time zone
);


ALTER TABLE public.exam_paper_question OWNER TO postgres;

--
-- Name: exam_paper_question_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.exam_paper_question_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.exam_paper_question_id_seq OWNER TO postgres;

--
-- Name: exam_paper_question_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.exam_paper_question_id_seq OWNED BY public.exam_paper_question.id;


--
-- Name: exam_student; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exam_student (
    id integer NOT NULL,
    exam_id integer NOT NULL,
    student_id integer NOT NULL,
    created_at timestamp without time zone,
    exam_status character varying(50) DEFAULT 'pending'::character varying,
    start_time timestamp without time zone,
    submit_time timestamp without time zone
);


ALTER TABLE public.exam_student OWNER TO postgres;

--
-- Name: COLUMN exam_student.exam_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.exam_student.exam_status IS '考试状态: pending-待考试, in_progress-考试中, submitted-已提交';


--
-- Name: COLUMN exam_student.start_time; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.exam_student.start_time IS '开始考试时间';


--
-- Name: COLUMN exam_student.submit_time; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.exam_student.submit_time IS '提交考试时间';


--
-- Name: exam_student_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.exam_student_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.exam_student_id_seq OWNER TO postgres;

--
-- Name: exam_student_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.exam_student_id_seq OWNED BY public.exam_student.id;


--
-- Name: knowledge_graph; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.knowledge_graph (
    id integer NOT NULL,
    teacher_id integer NOT NULL,
    graph_name character varying(255) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.knowledge_graph OWNER TO postgres;

--
-- Name: knowledge_graph_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.knowledge_graph_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.knowledge_graph_id_seq OWNER TO postgres;

--
-- Name: knowledge_graph_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.knowledge_graph_id_seq OWNED BY public.knowledge_graph.id;


--
-- Name: knowledge_node; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.knowledge_node (
    id integer NOT NULL,
    graph_id integer NOT NULL,
    parent_id integer,
    node_name character varying(255) NOT NULL,
    node_content text,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.knowledge_node OWNER TO postgres;

--
-- Name: knowledge_node_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.knowledge_node_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.knowledge_node_id_seq OWNER TO postgres;

--
-- Name: knowledge_node_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.knowledge_node_id_seq OWNED BY public.knowledge_node.id;


--
-- Name: llm_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.llm_config (
    id integer NOT NULL,
    provider_name character varying(100) NOT NULL,
    provider_key character varying(50) NOT NULL,
    api_key character varying(500) NOT NULL,
    api_secret character varying(500),
    endpoint_url character varying(500),
    model_name character varying(100),
    config_json text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.llm_config OWNER TO postgres;

--
-- Name: TABLE llm_config; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.llm_config IS 'LLM服务提供商配置表';


--
-- Name: COLUMN llm_config.provider_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.llm_config.provider_name IS '提供商名称';


--
-- Name: COLUMN llm_config.provider_key; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.llm_config.provider_key IS '提供商唯一标识';


--
-- Name: COLUMN llm_config.api_key; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.llm_config.api_key IS 'API密钥';


--
-- Name: COLUMN llm_config.api_secret; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.llm_config.api_secret IS 'API密钥（可选）';


--
-- Name: COLUMN llm_config.endpoint_url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.llm_config.endpoint_url IS 'API端点URL';


--
-- Name: COLUMN llm_config.model_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.llm_config.model_name IS '模型名称';


--
-- Name: COLUMN llm_config.config_json; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.llm_config.config_json IS '额外配置（JSON格式）';


--
-- Name: COLUMN llm_config.is_active; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.llm_config.is_active IS '是否启用';


--
-- Name: COLUMN llm_config.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.llm_config.created_at IS '创建时间';


--
-- Name: COLUMN llm_config.updated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.llm_config.updated_at IS '更新时间';


--
-- Name: llm_config_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.llm_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.llm_config_id_seq OWNER TO postgres;

--
-- Name: llm_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.llm_config_id_seq OWNED BY public.llm_config.id;


--
-- Name: major; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.major (
    id integer NOT NULL,
    name character varying NOT NULL,
    organization_id integer,
    tuition_fee numeric(10,2) NOT NULL,
    description text,
    duration_years integer DEFAULT 4,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    teacher_id integer,
    code character varying(50)
);


ALTER TABLE public.major OWNER TO postgres;

--
-- Name: major_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.major_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.major_id_seq OWNER TO postgres;

--
-- Name: major_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.major_id_seq OWNED BY public.major.id;


--
-- Name: organization; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization (
    id integer NOT NULL,
    name character varying NOT NULL,
    parent_id integer,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    updated_by integer,
    code character varying(50)
);


ALTER TABLE public.organization OWNER TO postgres;

--
-- Name: organization_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.organization_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.organization_id_seq OWNER TO postgres;

--
-- Name: organization_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.organization_id_seq OWNED BY public.organization.id;


--
-- Name: personalized_learning_content; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.personalized_learning_content (
    id integer NOT NULL,
    student_id integer NOT NULL,
    resource_id integer NOT NULL,
    content text NOT NULL,
    assessment_id integer,
    llm_config_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.personalized_learning_content OWNER TO postgres;

--
-- Name: TABLE personalized_learning_content; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.personalized_learning_content IS '个性化学习内容表';


--
-- Name: COLUMN personalized_learning_content.student_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.personalized_learning_content.student_id IS '学生ID';


--
-- Name: COLUMN personalized_learning_content.resource_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.personalized_learning_content.resource_id IS '教学资源ID';


--
-- Name: COLUMN personalized_learning_content.content; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.personalized_learning_content.content IS '个性化学习内容（Markdown格式）';


--
-- Name: COLUMN personalized_learning_content.assessment_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.personalized_learning_content.assessment_id IS '关联的学习偏好测评ID';


--
-- Name: COLUMN personalized_learning_content.llm_config_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.personalized_learning_content.llm_config_id IS '使用的大模型配置ID';


--
-- Name: personalized_learning_content_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.personalized_learning_content_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.personalized_learning_content_id_seq OWNER TO postgres;

--
-- Name: personalized_learning_content_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.personalized_learning_content_id_seq OWNED BY public.personalized_learning_content.id;


--
-- Name: question; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question (
    id integer NOT NULL,
    teacher_id integer NOT NULL,
    question_type character varying(20) NOT NULL,
    title text NOT NULL,
    title_image character varying(500),
    knowledge_point text,
    answer text,
    answer_image character varying(500),
    explanation text,
    explanation_image character varying(500),
    difficulty integer DEFAULT 1,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.question OWNER TO postgres;

--
-- Name: question_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.question_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.question_id_seq OWNER TO postgres;

--
-- Name: question_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.question_id_seq OWNED BY public.question.id;


--
-- Name: question_option; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question_option (
    id integer NOT NULL,
    question_id integer NOT NULL,
    option_label character varying(10) NOT NULL,
    option_text text NOT NULL,
    option_image character varying(500),
    is_correct boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.question_option OWNER TO postgres;

--
-- Name: question_option_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.question_option_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.question_option_id_seq OWNER TO postgres;

--
-- Name: question_option_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.question_option_id_seq OWNED BY public.question_option.id;


--
-- Name: reference_folder; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reference_folder (
    id integer NOT NULL,
    teacher_id integer NOT NULL,
    folder_name character varying(255) NOT NULL,
    parent_id integer,
    description character varying(500),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.reference_folder OWNER TO postgres;

--
-- Name: reference_folder_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reference_folder_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.reference_folder_id_seq OWNER TO postgres;

--
-- Name: reference_folder_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reference_folder_id_seq OWNED BY public.reference_folder.id;


--
-- Name: reference_material; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reference_material (
    id integer NOT NULL,
    teacher_id integer NOT NULL,
    folder_id integer,
    resource_name character varying(255) NOT NULL,
    resource_type character varying(50) NOT NULL,
    original_filename character varying(255),
    file_path character varying(500),
    file_size bigint,
    link_url character varying(1000),
    knowledge_point text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.reference_material OWNER TO postgres;

--
-- Name: reference_material_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reference_material_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.reference_material_id_seq OWNER TO postgres;

--
-- Name: reference_material_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reference_material_id_seq OWNED BY public.reference_material.id;


--
-- Name: resource_folder; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resource_folder (
    id integer NOT NULL,
    teacher_id integer NOT NULL,
    folder_name character varying(255) NOT NULL,
    parent_id integer,
    description character varying(500),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.resource_folder OWNER TO postgres;

--
-- Name: resource_folder_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resource_folder_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.resource_folder_id_seq OWNER TO postgres;

--
-- Name: resource_folder_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resource_folder_id_seq OWNED BY public.resource_folder.id;


--
-- Name: semester; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.semester (
    id integer NOT NULL,
    name character varying NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    is_current boolean
);


ALTER TABLE public.semester OWNER TO postgres;

--
-- Name: semester_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.semester_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.semester_id_seq OWNER TO postgres;

--
-- Name: semester_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.semester_id_seq OWNED BY public.semester.id;


--
-- Name: student_exam_score; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_exam_score (
    id integer NOT NULL,
    student_id integer NOT NULL,
    course_id integer NOT NULL,
    exam_paper_id integer NOT NULL,
    exam_id integer,
    score double precision NOT NULL,
    total_score double precision DEFAULT 100,
    exam_date timestamp without time zone NOT NULL,
    is_submitted boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.student_exam_score OWNER TO postgres;

--
-- Name: student_exam_score_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.student_exam_score_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.student_exam_score_id_seq OWNER TO postgres;

--
-- Name: student_exam_score_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.student_exam_score_id_seq OWNED BY public.student_exam_score.id;


--
-- Name: student_learning_assessment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_learning_assessment (
    id integer NOT NULL,
    student_id integer NOT NULL,
    answers jsonb NOT NULL,
    open_response text,
    ai_evaluation text NOT NULL,
    llm_config_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tags text[]
);


ALTER TABLE public.student_learning_assessment OWNER TO postgres;

--
-- Name: student_learning_assessment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.student_learning_assessment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.student_learning_assessment_id_seq OWNER TO postgres;

--
-- Name: student_learning_assessment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.student_learning_assessment_id_seq OWNED BY public.student_learning_assessment.id;


--
-- Name: student_learning_behavior; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_learning_behavior (
    id integer NOT NULL,
    student_id integer NOT NULL,
    course_id integer NOT NULL,
    chapter_id integer,
    resource_id integer,
    resource_type character varying(50),
    behavior_type character varying(50) NOT NULL,
    duration_seconds integer DEFAULT 0,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.student_learning_behavior OWNER TO postgres;

--
-- Name: student_learning_behavior_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.student_learning_behavior_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.student_learning_behavior_id_seq OWNER TO postgres;

--
-- Name: student_learning_behavior_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.student_learning_behavior_id_seq OWNED BY public.student_learning_behavior.id;


--
-- Name: student_learning_profile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_learning_profile (
    id integer NOT NULL,
    student_id integer NOT NULL,
    latest_assessment_id integer,
    total_assessments integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.student_learning_profile OWNER TO postgres;

--
-- Name: student_learning_profile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.student_learning_profile_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.student_learning_profile_id_seq OWNER TO postgres;

--
-- Name: student_learning_profile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.student_learning_profile_id_seq OWNED BY public.student_learning_profile.id;


--
-- Name: student_profile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_profile (
    id integer NOT NULL,
    user_id integer,
    class_id integer,
    major_id integer,
    student_no character varying,
    status character varying
);


ALTER TABLE public.student_profile OWNER TO postgres;

--
-- Name: student_profile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.student_profile_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.student_profile_id_seq OWNER TO postgres;

--
-- Name: student_profile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.student_profile_id_seq OWNED BY public.student_profile.id;


--
-- Name: student_study_duration; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_study_duration (
    id integer NOT NULL,
    student_id integer NOT NULL,
    course_id integer NOT NULL,
    study_date timestamp without time zone NOT NULL,
    duration_minutes integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.student_study_duration OWNER TO postgres;

--
-- Name: student_study_duration_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.student_study_duration_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.student_study_duration_id_seq OWNER TO postgres;

--
-- Name: student_study_duration_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.student_study_duration_id_seq OWNED BY public.student_study_duration.id;


--
-- Name: sys_class; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sys_class (
    id integer NOT NULL,
    name character varying NOT NULL,
    major_id integer,
    semester character varying,
    grade character varying,
    code character varying,
    is_active boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.sys_class OWNER TO postgres;

--
-- Name: sys_class_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sys_class_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sys_class_id_seq OWNER TO postgres;

--
-- Name: sys_class_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sys_class_id_seq OWNED BY public.sys_class.id;


--
-- Name: sys_user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sys_user (
    id integer NOT NULL,
    username character varying NOT NULL,
    hashed_password character varying NOT NULL,
    full_name character varying,
    email character varying,
    role character varying NOT NULL,
    is_active boolean DEFAULT true,
    avatar character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    phone character varying(20),
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sys_user OWNER TO postgres;

--
-- Name: sys_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sys_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sys_user_id_seq OWNER TO postgres;

--
-- Name: sys_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sys_user_id_seq OWNED BY public.sys_user.id;


--
-- Name: teacher_profile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teacher_profile (
    id integer NOT NULL,
    user_id integer,
    major_id integer,
    title character varying,
    intro text
);


ALTER TABLE public.teacher_profile OWNER TO postgres;

--
-- Name: teacher_profile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.teacher_profile_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.teacher_profile_id_seq OWNER TO postgres;

--
-- Name: teacher_profile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.teacher_profile_id_seq OWNED BY public.teacher_profile.id;


--
-- Name: teaching_resource; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teaching_resource (
    id integer NOT NULL,
    teacher_id integer NOT NULL,
    resource_name character varying(255) NOT NULL,
    original_filename character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    local_file_path character varying(500),
    file_size bigint NOT NULL,
    resource_type character varying(20) NOT NULL,
    pdf_path character varying(500),
    pdf_local_path character varying(500),
    pdf_converted_at timestamp without time zone,
    pdf_conversion_status character varying(20) DEFAULT 'pending'::character varying,
    knowledge_point text,
    folder_id integer,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.teaching_resource OWNER TO postgres;

--
-- Name: teaching_resource_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.teaching_resource_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.teaching_resource_id_seq OWNER TO postgres;

--
-- Name: teaching_resource_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.teaching_resource_id_seq OWNED BY public.teaching_resource.id;


--
-- Name: ai_quiz_record id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_quiz_record ALTER COLUMN id SET DEFAULT nextval('public.ai_quiz_record_id_seq'::regclass);


--
-- Name: class_course_relation id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_course_relation ALTER COLUMN id SET DEFAULT nextval('public.class_course_relation_id_seq'::regclass);


--
-- Name: course id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course ALTER COLUMN id SET DEFAULT nextval('public.course_id_seq'::regclass);


--
-- Name: course_chapter id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter ALTER COLUMN id SET DEFAULT nextval('public.course_chapter_id_seq'::regclass);


--
-- Name: course_chapter_exam id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter_exam ALTER COLUMN id SET DEFAULT nextval('public.course_chapter_exam_id_seq'::regclass);


--
-- Name: course_chapter_exam_paper id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter_exam_paper ALTER COLUMN id SET DEFAULT nextval('public.course_chapter_exam_paper_id_seq'::regclass);


--
-- Name: course_chapter_knowledge_graph id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter_knowledge_graph ALTER COLUMN id SET DEFAULT nextval('public.course_chapter_knowledge_graph_id_seq'::regclass);


--
-- Name: course_chapter_learning_rule id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter_learning_rule ALTER COLUMN id SET DEFAULT nextval('public.course_chapter_learning_rule_id_seq'::regclass);


--
-- Name: course_cover id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_cover ALTER COLUMN id SET DEFAULT nextval('public.course_cover_id_seq'::regclass);


--
-- Name: course_resource id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_resource ALTER COLUMN id SET DEFAULT nextval('public.course_resource_id_seq'::regclass);


--
-- Name: course_section_homework id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_section_homework ALTER COLUMN id SET DEFAULT nextval('public.course_section_homework_id_seq'::regclass);


--
-- Name: course_section_resource id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_section_resource ALTER COLUMN id SET DEFAULT nextval('public.course_section_resource_id_seq'::regclass);


--
-- Name: dictionary_item id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dictionary_item ALTER COLUMN id SET DEFAULT nextval('public.dictionary_item_id_seq'::regclass);


--
-- Name: dictionary_type id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dictionary_type ALTER COLUMN id SET DEFAULT nextval('public.dictionary_type_id_seq'::regclass);


--
-- Name: enrollment_order id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollment_order ALTER COLUMN id SET DEFAULT nextval('public.enrollment_order_id_seq'::regclass);


--
-- Name: exam id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam ALTER COLUMN id SET DEFAULT nextval('public.exam_id_seq'::regclass);


--
-- Name: exam_paper id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_paper ALTER COLUMN id SET DEFAULT nextval('public.exam_paper_id_seq'::regclass);


--
-- Name: exam_paper_question id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_paper_question ALTER COLUMN id SET DEFAULT nextval('public.exam_paper_question_id_seq'::regclass);


--
-- Name: exam_student id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_student ALTER COLUMN id SET DEFAULT nextval('public.exam_student_id_seq'::regclass);


--
-- Name: knowledge_graph id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_graph ALTER COLUMN id SET DEFAULT nextval('public.knowledge_graph_id_seq'::regclass);


--
-- Name: knowledge_node id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_node ALTER COLUMN id SET DEFAULT nextval('public.knowledge_node_id_seq'::regclass);


--
-- Name: llm_config id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.llm_config ALTER COLUMN id SET DEFAULT nextval('public.llm_config_id_seq'::regclass);


--
-- Name: major id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.major ALTER COLUMN id SET DEFAULT nextval('public.major_id_seq'::regclass);


--
-- Name: organization id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization ALTER COLUMN id SET DEFAULT nextval('public.organization_id_seq'::regclass);


--
-- Name: personalized_learning_content id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personalized_learning_content ALTER COLUMN id SET DEFAULT nextval('public.personalized_learning_content_id_seq'::regclass);


--
-- Name: question id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question ALTER COLUMN id SET DEFAULT nextval('public.question_id_seq'::regclass);


--
-- Name: question_option id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_option ALTER COLUMN id SET DEFAULT nextval('public.question_option_id_seq'::regclass);


--
-- Name: reference_folder id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reference_folder ALTER COLUMN id SET DEFAULT nextval('public.reference_folder_id_seq'::regclass);


--
-- Name: reference_material id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reference_material ALTER COLUMN id SET DEFAULT nextval('public.reference_material_id_seq'::regclass);


--
-- Name: resource_folder id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_folder ALTER COLUMN id SET DEFAULT nextval('public.resource_folder_id_seq'::regclass);


--
-- Name: semester id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.semester ALTER COLUMN id SET DEFAULT nextval('public.semester_id_seq'::regclass);


--
-- Name: student_exam_score id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_exam_score ALTER COLUMN id SET DEFAULT nextval('public.student_exam_score_id_seq'::regclass);


--
-- Name: student_learning_assessment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_learning_assessment ALTER COLUMN id SET DEFAULT nextval('public.student_learning_assessment_id_seq'::regclass);


--
-- Name: student_learning_behavior id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_learning_behavior ALTER COLUMN id SET DEFAULT nextval('public.student_learning_behavior_id_seq'::regclass);


--
-- Name: student_learning_profile id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_learning_profile ALTER COLUMN id SET DEFAULT nextval('public.student_learning_profile_id_seq'::regclass);


--
-- Name: student_profile id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_profile ALTER COLUMN id SET DEFAULT nextval('public.student_profile_id_seq'::regclass);


--
-- Name: student_study_duration id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_study_duration ALTER COLUMN id SET DEFAULT nextval('public.student_study_duration_id_seq'::regclass);


--
-- Name: sys_class id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_class ALTER COLUMN id SET DEFAULT nextval('public.sys_class_id_seq'::regclass);


--
-- Name: sys_user id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_user ALTER COLUMN id SET DEFAULT nextval('public.sys_user_id_seq'::regclass);


--
-- Name: teacher_profile id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_profile ALTER COLUMN id SET DEFAULT nextval('public.teacher_profile_id_seq'::regclass);


--
-- Name: teaching_resource id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teaching_resource ALTER COLUMN id SET DEFAULT nextval('public.teaching_resource_id_seq'::regclass);


--
-- Data for Name: ai_quiz_record; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_quiz_record (id, student_id, resource_id, assessment_id, questions, user_answers, score, total_score, is_submitted, llm_config_id, created_at, submitted_at) FROM stdin;
1	90	12	3	[{"id": 1, "type": "single", "options": ["A. Content-Type", "B. User-Agent", "C. Accept-Encoding", "D. Connection"], "question": "根据《Python数据采集教学指南》，当使用requests库进行网页请求时，为了模拟真实浏览器访问并减少被反爬机制拦截的风险，通常需要设置哪个HTTP请求头字段？", "explanation": "User-Agent请求头用于标识客户端（如浏览器）的身份。在资源4.2节中，get_realistic_headers()函数明确设置了User-Agent字段来模拟Chrome浏览器，这是规避基础反爬机制和遵守网站规范的常见做法。", "correct_answer": "B"}, {"id": 2, "type": "single", "options": ["A. BeautifulSoup", "B. requests库", "C. Selenium", "D. API调用"], "question": "在指南介绍的Python数据采集主要方式中，对于使用JavaScript动态加载内容的网页，最推荐使用以下哪个工具进行数据采集？", "explanation": "根据资源3.1节“动态网页数据采集”的介绍，BeautifulSoup和requests库无法直接处理由JavaScript动态生成的内容。Selenium可以驱动真实浏览器，执行JavaScript并等待页面加载完成，因此是处理此类动态网页的推荐工具。", "correct_answer": "C"}, {"id": 3, "type": "multiple", "options": ["A. 采集任何网站数据前都应首先检查并遵守其robots.txt协议", "B. 为了提高采集效率，应尽可能使用同步请求而非异步请求", "C. 使用代理IP池并实现重试机制可以提升采集任务的健壮性", "D. 所有API接口都无需身份验证即可自由调用"], "question": "关于指南中提到的Python数据采集最佳实践，以下哪些说法是正确的？（请选择2-3项）", "explanation": "A正确，资源4.1节专门介绍了RobotsChecker类来检查robots.txt，遵守该协议是数据采集的伦理和法律基础之一。C正确，资源4.3节和4.4节分别介绍了代理IP的使用和错误重试机制，这些都是提升采集稳定性和成功率的重要实践。B错误，资源3.2节介绍了异步采集（AsyncCollector），其优点正是通过并发提高效率。D错误，资源2.2.1节APIClient类中的api_key参数表明，许多API（尤其是商业API）需要身份验证（如API Key）。", "correct_answer": ["A", "C"]}, {"id": 4, "type": "multiple", "options": ["A. pymysql", "B. pymongo", "C. psycopg2", "D. redis"], "question": "根据《Python数据采集教学指南》，下列哪些库或工具可以用于从关系型数据库中采集数据？（请选择2-3项）", "explanation": "A和C正确。在资源2.3.1节“关系型数据库采集”的DatabaseCollector类中，明确使用了pymysql来连接MySQL数据库，使用psycopg2来连接PostgreSQL数据库。B（pymongo）是用于连接MongoDB（一种NoSQL数据库）的库，属于2.3.2节的内容。D（redis）也是一种NoSQL数据库，其采集方法在2.3.2节中另有介绍。", "correct_answer": ["A", "C"]}, {"id": 5, "type": "judge", "options": ["正确", "错误"], "question": "根据指南内容，BeautifulSoup库本身具备发送HTTP请求的功能，可以直接用于抓取网页。", "explanation": "错误。BeautifulSoup是一个HTML/XML解析库，它的核心功能是解析标记语言并从中提取数据，如资源2.1.2节代码所示。它不具备发送网络请求的能力。发送HTTP请求通常需要依赖如requests（如2.1.1节所示）或aiohttp（如3.2节所示）这样的库。", "correct_answer": "错误"}]	\N	\N	100	f	6	2026-01-09 10:32:54.069245	\N
2	90	12	3	[{"id": 1, "type": "single", "options": ["A. 使用requests库直接请求", "B. 使用BeautifulSoup解析HTML", "C. 使用Selenium模拟浏览器", "D. 使用pandas读取数据"], "question": "根据学习资源，在Python数据采集中，如果需要采集一个使用JavaScript动态加载内容的网页，最合适的工具是？", "explanation": "资源中3.1节明确指出，对于使用JavaScript动态加载的网站，需要使用Selenium等工具来模拟浏览器行为，从而获取动态渲染后的页面内容。requests和BeautifulSoup无法处理动态加载的JS内容。", "correct_answer": "C"}, {"id": 2, "type": "single", "options": ["A. 网站的HTML结构", "B. 网站的robots.txt协议", "C. 网站的API接口", "D. 网站的CSS样式表"], "question": "在编写网络爬虫时，为了遵守网站规则并避免被封禁，首先应该检查什么？", "explanation": "资源4.1节强调了数据采集最佳实践之一就是遵守robots.txt协议。该协议规定了网站哪些部分允许或禁止爬虫访问，是网络爬虫应首先遵守的规则。", "correct_answer": "B"}, {"id": 3, "type": "multiple", "options": ["A. 拥有丰富的数据采集库生态系统", "B. 语法简洁易读，学习成本较低", "C. 只能运行在Windows操作系统上", "D. 拥有强大的社区支持和问题解决方案"], "question": "根据资源内容，Python在数据采集方面具有哪些主要优势？（请选择2-3项）", "explanation": "资源1.2节详细列举了Python在数据采集中的优势：丰富的生态系统（A）、简洁易读的语法（B）、跨平台兼容性（C选项说“只能”运行在Windows上是错误的）、强大的社区支持（D）。", "correct_answer": ["A", "B", "D"]}, {"id": 4, "type": "multiple", "options": ["A. 使用装饰器实现请求失败后的自动重试机制", "B. 完全不设置请求超时，等待直到响应", "C. 使用代理IP池来分散请求来源", "D. 设置合理的请求头模拟真实浏览器"], "question": "以下哪些是资源中提到的提高数据采集任务健壮性的有效策略？（请选择2-3项）", "explanation": "资源第四章“数据采集最佳实践”涵盖了这些策略：A对应4.4节的错误处理和重试机制；C对应4.3节的代理IP使用；D对应4.2节的设置请求头模拟浏览器。B选项“完全不设置超时”是错误做法，会导致程序在无响应时永久挂起。", "correct_answer": ["A", "C", "D"]}, {"id": 5, "type": "judge", "options": ["正确", "错误"], "question": "根据资源内容，使用`aiohttp`和`asyncio`库进行异步数据采集的主要目的是为了提高数据采集的效率，特别是在需要批量请求大量URL时。", "explanation": "资源3.2节“异步数据采集”明确指出，使用异步编程（如aiohttp）可以提高数据采集效率。其原理是在等待网络响应的期间不阻塞程序，可以同时发起多个请求，从而显著缩短批量采集的总时间。", "correct_answer": "正确"}]	{"1": "A", "2": "B", "3": ["A", "B"], "4": ["B", "C. 使用代理IP池来分散请求来源"], "5": "正确"}	40.00	100	t	6	2026-01-09 10:33:06.48451	2026-01-09 10:33:24.726635
3	90	12	3	[{"id": 1, "type": "single", "options": ["A. 提高代码执行速度", "B. 模拟浏览器访问以避免被网站屏蔽", "C. 压缩返回的数据", "D. 自动解析HTML结构"], "question": "根据学习资源，在使用requests库进行网络爬虫时，设置请求头（headers）的主要目的是什么？", "explanation": "设置请求头（如User-Agent）可以模拟真实浏览器的访问行为，这是遵守网络礼仪和避免被目标网站识别为爬虫程序而遭到屏蔽的重要实践之一。", "correct_answer": "B"}, {"id": 2, "type": "single", "options": ["A. 发送HTTP网络请求", "B. 解析HTML或XML文档并提取数据", "C. 与数据库进行交互", "D. 执行异步数据采集"], "question": "在Python数据采集中，`BeautifulSoup`库的主要功能是什么？", "explanation": "BeautifulSoup是一个用于从HTML或XML文件中解析数据、提取所需信息的Python库。它本身不负责获取网页，而是解析已获取的网页内容。", "correct_answer": "B"}, {"id": 3, "type": "multiple", "options": ["A. 使用网络爬虫采集网页数据", "B. 通过调用API获取结构化数据", "C. 直接操作图形用户界面（GUI）进行复制粘贴", "D. 从关系型或NoSQL数据库中提取数据"], "question": "根据“Python数据采集的主要方式”章节，以下哪些是Python进行数据采集的常见方式？（选择2-3项）", "explanation": "根据资源内容，Python数据采集的主要方式包括：网络爬虫采集（A）、API数据采集（B）和数据库数据采集（D）。直接操作GUI（C）不是资源中介绍的自动化、程序化的主要采集方式。", "correct_answer": ["A", "B", "D"]}, {"id": 4, "type": "multiple", "options": ["A. 不设置任何时间间隔，以最快速度抓取数据", "B. 遵守网站的robots.txt协议", "C. 实现错误处理和重试机制", "D. 使用代理IP来隐藏真实请求来源"], "question": "在“数据采集最佳实践”中提到了哪些关键措施来确保爬虫的健壮性和合规性？（选择2-3项）", "explanation": "最佳实践包括：遵守robots.txt协议（B）是尊重网站规则的体现；实现错误处理和重试机制（C）能提高程序的稳定性；使用代理IP（D）可以帮助规避IP封锁。而不设间隔地高速抓取（A）是不推荐的行为，可能对目标网站造成压力并导致自身IP被封锁。", "correct_answer": ["B", "C", "D"]}, {"id": 5, "type": "judge", "options": ["正确", "错误"], "question": "对于使用JavaScript动态加载内容的网页，使用requests库结合BeautifulSoup就能完全获取到页面上显示的所有数据。", "explanation": "requests库获取的是服务器返回的初始HTML源码，无法执行其中的JavaScript代码来加载动态内容。对于这类网页，需要使用如Selenium、Playwright等能驱动浏览器的工具来模拟用户操作，获取渲染后的完整页面内容。", "correct_answer": "错误"}]	\N	\N	100	f	6	2026-01-09 10:36:50.451323	\N
4	90	12	3	[{"id": 1, "type": "single", "options": ["A. requests库", "B. BeautifulSoup库", "C. Selenium库", "D. pandas库"], "question": "在Python数据采集中，对于使用JavaScript动态加载的网页，下列哪种工具是最佳选择？", "explanation": "根据资源内容，Selenium等工具专门用于处理动态网页数据采集，因为它可以模拟浏览器行为，执行JavaScript并获取动态加载后的完整页面内容。requests和BeautifulSoup主要用于静态页面的请求和解析，pandas是数据分析库。", "correct_answer": "C"}, {"id": 2, "type": "single", "options": ["A. sitemap.xml", "B. robots.txt", "C. index.html", "D. security.conf"], "question": "在编写网络爬虫时，为了遵守网站规则并避免被封禁，首先应该检查哪个协议文件？", "explanation": "资源中明确提到了'遵守robots.txt协议'的最佳实践，这是网站用来告知爬虫哪些页面可以抓取、哪些不可以的标准协议。检查并遵守它是数据采集的基本道德和法律要求。", "correct_answer": "B"}, {"id": 3, "type": "multiple", "options": ["A. 网络爬虫采集（Web Scraping）", "B. API数据采集", "C. 手动复制粘贴", "D. 数据库数据采集"], "question": "以下哪些属于资源中提到的Python数据采集的主要方式？（请选择2-3项）", "explanation": "资源第二部分‘Python数据采集的主要方式’明确列出了三种：网络爬虫采集、API数据采集和数据库数据采集。手动复制粘贴不是一种自动化、程序化的数据采集方式。", "correct_answer": ["A", "B", "D"]}, {"id": 4, "type": "multiple", "options": ["A. 使用真实的浏览器请求头（User-Agent）", "B. 设置代理IP和错误重试机制", "C. 尽可能快地发起无限制的并发请求", "D. 忽略网站的服务条款，直接抓取所有数据"], "question": "根据资源内容，以下哪些做法属于数据采集的最佳实践？（请选择2-3项）", "explanation": "资源第四部分‘数据采集最佳实践’包含了设置请求头模拟浏览器、使用代理IP、错误处理和重试机制。C选项的做法不友好，可能导致IP被封。D选项的做法是不道德的，且可能违法。", "correct_answer": ["A", "B"]}, {"id": 5, "type": "judge", "options": ["正确", "错误"], "question": "Python的`requests`库可以直接获取并解析由JavaScript动态生成的网页内容。", "explanation": "错误。`requests`库只能获取网页的初始HTML源码，无法执行其中的JavaScript代码来获取动态生成的内容。对于动态网页，需要使用如Selenium、Playwright等能驱动浏览器的工具。", "correct_answer": "错误"}]	\N	\N	100	f	6	2026-01-09 10:40:27.461542	\N
5	90	12	3	[{"id": 1, "type": "single", "options": ["A. BeautifulSoup", "B. Selenium", "C. Requests", "D. pymysql"], "question": "针对使用JavaScript动态加载的网页，以下哪个Python库是进行数据采集的合适选择？", "explanation": "根据学习资源内容，Selenium是用于处理动态网页（JavaScript加载）的常用工具，而BeautifulSoup和Requests主要处理静态HTML，pymysql用于数据库操作。", "correct_answer": "B"}, {"id": 2, "type": "single", "options": ["A. 使用固定的‘User-Agent’请求头", "B. 忽略网站的robots.txt文件", "C. 设置模拟浏览器的请求头（如‘User-Agent’）", "D. 使用尽可能快的请求频率"], "question": "在进行网络爬虫时，为了模拟真实用户行为、避免被网站屏蔽，以下哪项是最佳实践？", "explanation": "资源中强调了设置请求头（如‘User-Agent’）来模拟真实浏览器的重要性，这是遵守道德规范和提高采集成功率的关键。忽略robots.txt和高速请求是不建议的。", "correct_answer": "C"}, {"id": 3, "type": "multiple", "options": ["A. 简洁易读的语法，降低学习成本", "B. 拥有众多成熟的数据采集库（如Requests， BeautifulSoup）", "C. 只能在Windows操作系统上运行", "D. 拥有强大的社区支持，便于问题解决"], "question": "以下哪些是Python在数据采集方面的主要优势？（请选择2-3项）", "explanation": "资源中明确指出Python的优势包括：丰富的生态系统（库多）、简洁易读的语法、跨平台兼容性以及强大的社区支持。选项C是错误的，Python具有跨平台特性。", "correct_answer": ["A", "B", "D"]}, {"id": 4, "type": "multiple", "options": ["A. 使用代理IP池", "B. 实现错误重试机制（如指数退避）", "C. 在代码中完全忽略所有异常", "D. 使用`retry`装饰器对可能失败的函数进行包装"], "question": "在数据采集的健壮性设计中，以下哪些技术或策略有助于处理网络请求失败等问题？（请选择2-3项）", "explanation": "资源中的‘错误处理和重试机制’部分介绍了使用重试装饰器（含指数退避）和代理IP来应对请求失败和反爬策略。完全忽略异常（C）是错误做法，会使得程序无法有效处理问题。", "correct_answer": ["A", "B", "D"]}, {"id": 5, "type": "judge", "options": ["正确", "错误"], "question": "使用Python的`requests`库可以直接获取并解析由JavaScript在浏览器端动态渲染生成的网页完整内容。", "explanation": "`requests`库只能获取服务器返回的初始HTML源码，对于由JavaScript动态生成的内容无法直接获取。需要借助像Selenium这样的工具来模拟浏览器行为才能获取完整渲染后的内容。", "correct_answer": "错误"}]	\N	\N	100	f	6	2026-01-09 10:40:28.266803	\N
6	90	12	3	[{"id": 1, "type": "single", "options": ["A. 'html.parser'", "B. 'encoding'", "C. 'lxml'", "D. 'find_all'"], "question": "根据学习指南，使用BeautifulSoup解析HTML时，以下哪个参数用于指定解析器？", "explanation": "在代码示例 `soup = BeautifulSoup(html_content, 'lxml')` 中，第二个参数指定了使用的解析器。虽然 `'html.parser'` 也是有效的解析器，但题目问的是示例中使用的参数，且选项C直接摘自原文代码。", "correct_answer": "C"}, {"id": 2, "type": "single", "options": ["A. 提高单个请求的速度", "B. 限制同时进行的请求数量", "C. 自动保存采集的数据", "D. 解析动态加载的网页"], "question": "在异步数据采集的 `AsyncCollector` 类中，`Semaphore` 的主要作用是？", "explanation": "根据代码 `self.semaphore = asyncio.Semaphore(max_concurrent)` 及上下文可知，`Semaphore`（信号量）用于控制最大并发数，避免对目标服务器造成过大压力或触发反爬机制。", "correct_answer": "B"}, {"id": 3, "type": "multiple", "options": ["A. 丰富的生态系统，拥有众多成熟的数据采集库", "B. 编译型语言，执行速度最快", "C. 简洁易读的语法，降低学习成本", "D. 强大的社区支持，遇到问题可以快速找到解决方案"], "question": "以下哪些是Python在数据采集方面的优势？（根据学习资源内容选择）", "explanation": "学习资源在'1.2 Python在数据采集中的优势'部分明确列出了：丰富的生态系统、简洁易读的语法、跨平台兼容性和强大的社区支持。选项B是错误描述，Python是解释型语言，且文中未提及执行速度是最快的。", "correct_answer": ["A", "C", "D"]}, {"id": 4, "type": "multiple", "options": ["A. 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; ...)'", "B. 'Accept': 'text/html,application/xhtml+xml,...'", "C. 'Content-Type': 'application/json'", "D. 'Connection': 'keep-alive'"], "question": "在数据采集的最佳实践中，为了模拟真实用户访问、避免被网站反爬机制封锁，通常需要设置合理的请求头（Headers）。以下哪些键值对是`get_realistic_headers`函数示例中可能包含的？", "explanation": "根据'4.2 设置请求头模拟浏览器'部分的`get_realistic_headers`函数代码，返回的字典中包含User-Agent、Accept、Accept-Language、Accept-Encoding、Connection、Upgrade-Insecure-Requests、Cache-Control等字段。选项A、B、D均在其中。选项C的'Content-Type': 'application/json'通常用于POST请求提交JSON数据，不属于该函数模拟浏览器访问的基本请求头。", "correct_answer": ["A", "B", "D"]}, {"id": 5, "type": "judge", "options": ["正确", "错误"], "question": "根据学习资源内容，使用`requests`库进行网络爬虫采集时，必须遵守网站的robots.txt协议，否则就是不合法的。", "explanation": "学习资源在'4.1 遵守robots.txt协议'中强调了遵守该协议是重要的最佳实践和道德规范，但并未断言不遵守就一定不合法。robots.txt是网站所有者向爬虫发出的指引，其法律效力因国家和地区、具体用途（如是否侵犯版权、违反服务条款或构成计算机滥用）而异。题目表述过于绝对。", "correct_answer": "错误"}]	\N	\N	100	f	6	2026-01-09 10:40:29.905787	\N
7	90	12	3	[{"id": 1, "type": "single", "options": ["A. 丰富的生态系统", "B. 简洁易读的语法", "C. 跨平台兼容性", "D. 强大的社区支持"], "question": "Python数据采集时，为了降低学习成本和提升开发效率，主要得益于其哪项优势？", "explanation": "资源内容指出，Python的‘简洁易读的语法’能够降低学习成本，提高开发效率，这是其在数据采集中的一项核心优势。", "correct_answer": "B"}, {"id": 2, "type": "single", "options": ["A. 查找页面中所有名为‘title’的CSS类", "B. 查找页面中所有<h1>标签，且其CSS类为‘title’", "C. 查找页面中第一个<h1>标签", "D. 查找页面中所有包含‘title’文本的标签"], "question": "使用BeautifulSoup解析HTML时，`soup.find_all('h1', class_='title')` 这行代码的主要作用是什么？", "explanation": "代码`find_all('h1', class_='title')`表示查找HTML文档中所有标签名为‘h1’且CSS类属性为‘title’的元素。", "correct_answer": "B"}, {"id": 3, "type": "multiple", "options": ["A. 在采集前检查并遵守目标网站的robots.txt协议", "B. 使用固定的、易于识别的User-Agent以便网站识别", "C. 设置模拟真实浏览器的请求头", "D. 使用代理IP池来分散请求并避免被封禁"], "question": "根据资源内容中‘数据采集最佳实践’的描述，以下哪些做法是推荐的？（请选择2-3项）", "explanation": "资源内容明确提到了遵守robots.txt协议（4.1）、设置请求头模拟浏览器（4.2）以及使用代理IP（4.3）作为最佳实践。使用固定且易识别的User-Agent（B）反而不利于规避反爬机制，因此不推荐。", "correct_answer": ["A", "C", "D"]}, {"id": 4, "type": "multiple", "options": ["A. pymysql", "B. BeautifulSoup", "C. Selenium", "D. psycopg2"], "question": "在Python中，以下哪些库或工具可以用于从数据库中采集数据？（请选择2-3项）", "explanation": "资源内容在‘2.3 数据库数据采集’中明确提到了pymysql用于连接MySQL数据库，psycopg2用于连接PostgreSQL数据库。BeautifulSoup用于解析HTML，Selenium用于动态网页采集，均不属于直接从数据库采集的工具。", "correct_answer": ["A", "D"]}, {"id": 5, "type": "judge", "options": ["正确", "错误"], "question": "对于使用JavaScript动态加载内容的网页，使用标准的requests库搭配BeautifulSoup就能有效采集到所有数据。", "explanation": "资源内容在‘3.1 动态网页数据采集’中指出，对于JavaScript动态加载的网站，需要使用Selenium等能够执行JavaScript并等待页面渲染的工具，仅用requests和BeautifulSoup无法获取动态生成的内容。", "correct_answer": "错误"}]	{"1": "A", "2": "A", "3": ["A", "B"], "4": ["A", "B"], "5": "正确"}	0.00	100	t	6	2026-01-09 10:44:46.815434	2026-01-09 10:45:00.996519
\.


--
-- Data for Name: class_course_relation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.class_course_relation (id, class_id, course_id, teacher_id, semester_id, schedule_desc) FROM stdin;
1	34	1	1	\N	\N
\.


--
-- Data for Name: course; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course (id, title, code, description, cover_image, credits, course_type, hours, introduction, objectives, main_teacher_id, is_public, major_id, course_category, enrollment_type, is_deleted) FROM stdin;
1	测试课程	31400912	\N	\N	2	required	32	课程简介内容	授课目标内容	2	f	1	general	required	f
\.


--
-- Data for Name: course_chapter; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_chapter (id, course_id, title, sort_order, parent_id, created_at, updated_at) FROM stdin;
1	1	第一章	0	\N	\N	\N
2	1	第一节	0	1	\N	\N
3	1	第二节	1	1	\N	\N
\.


--
-- Data for Name: course_chapter_exam; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_chapter_exam (id, chapter_id, exam_id, created_at) FROM stdin;
2	1	2	2026-01-09 07:25:45.369952
\.


--
-- Data for Name: course_chapter_exam_paper; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_chapter_exam_paper (id, chapter_id, exam_paper_id, created_at) FROM stdin;
2	1	1	2026-01-09 06:40:52.466289
\.


--
-- Data for Name: course_chapter_knowledge_graph; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_chapter_knowledge_graph (id, chapter_id, knowledge_graph_id, knowledge_node_id, created_at) FROM stdin;
7	1	1	\N	2026-01-09 07:13:57.925753
\.


--
-- Data for Name: course_chapter_learning_rule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_chapter_learning_rule (id, chapter_id, rule_type, completion_percentage, target_chapter_id, created_at, updated_at) FROM stdin;
1	2	none	\N	\N	2026-01-07 01:07:18.870468	2026-01-07 01:07:18.870473
\.


--
-- Data for Name: course_cover; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_cover (id, course_id, filename, file_size, sort_order, created_at, updated_at) FROM stdin;
1	\N	https://ezijingai.oss-cn-beijing.aliyuncs.com/course_covers/cf39349c-7a9c-48e0-a20b-db3d01aff1ff.png	823995	2	2026-01-06 09:55:17.870524	2026-01-07 08:35:40.710847
2	1	https://ezijingai.oss-cn-beijing.aliyuncs.com/course_covers/e7d8c774-9cde-42ea-9aa3-2f24872bd133.jpeg	131013	1	2026-01-07 08:35:36.543477	2026-01-07 08:35:40.71085
\.


--
-- Data for Name: course_resource; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_resource (id, chapter_id, title, resource_type, file_url, duration_seconds) FROM stdin;
\.


--
-- Data for Name: course_section_homework; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_section_homework (id, chapter_id, title, description, deadline, sort_order, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: course_section_resource; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_section_resource (id, chapter_id, resource_type, resource_id, sort_order, created_at) FROM stdin;
1	2	teaching_resource	12	0	2026-01-07 01:08:56.600159
\.


--
-- Data for Name: dictionary_item; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dictionary_item (id, type_id, code, label, value, sort_order, is_active, remark, created_at, updated_at) FROM stdin;
6	2	2024_fall	2024秋季	2024秋季	1	t	\N	2025-12-30 13:37:13.429889+00	\N
7	2	2024_spring	2024春季	2024春季	2	t	\N	2025-12-30 13:37:13.429889+00	\N
8	2	2023_fall	2023秋季	2023秋季	3	t	\N	2025-12-30 13:37:13.429889+00	\N
9	2	2023_spring	2023春季	2023春季	4	t	\N	2025-12-30 13:37:13.429889+00	\N
10	3	active	在读	active	1	t	\N	2025-12-30 13:37:13.430999+00	\N
11	3	graduated	已毕业	graduated	2	t	\N	2025-12-30 13:37:13.430999+00	\N
12	3	suspended	休学	suspended	3	t	\N	2025-12-30 13:37:13.430999+00	\N
13	3	expelled	退学	expelled	4	t	\N	2025-12-30 13:37:13.430999+00	\N
14	1	2028	2028级	2028	1	t	\N	2025-12-30 13:37:19.407317+00	\N
15	1	2027	2027级	2027	2	t	\N	2025-12-30 13:37:19.407317+00	\N
16	1	2026	2026级	2026	3	t	\N	2025-12-30 13:37:19.407317+00	\N
17	1	2025	2025级	2025	4	t	\N	2025-12-30 13:37:19.407317+00	\N
18	1	2024	2024级	2024	5	t	\N	2025-12-30 13:37:19.407317+00	\N
19	1	2023	2023级	2023	6	t	\N	2025-12-30 13:37:19.407317+00	\N
20	1	2022	2022级	2022	7	t	\N	2025-12-30 13:37:19.407317+00	\N
21	1	2021	2021级	2021	8	t	\N	2025-12-30 13:37:19.407317+00	\N
22	1	2020	2020级	2020	9	t	\N	2025-12-30 13:37:19.407317+00	\N
23	1	2019	2019级	2019	10	t	\N	2025-12-30 13:37:19.407317+00	\N
24	1	2018	2018级	2018	11	t	\N	2025-12-30 13:37:19.407317+00	\N
\.


--
-- Data for Name: dictionary_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dictionary_type (id, code, name, description, is_active, created_at, updated_at) FROM stdin;
1	grade	年级	学生年级分类	t	2025-12-30 13:37:13.42583+00	\N
2	semester	学期	学期分类	t	2025-12-30 13:37:13.429294+00	\N
3	student_status	学生状态	学生学籍状态	t	2025-12-30 13:37:13.430549+00	\N
\.


--
-- Data for Name: enrollment_order; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enrollment_order (id, order_no, student_id, major_id, amount, status, created_at, paid_at) FROM stdin;
\.


--
-- Data for Name: exam; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exam (id, teacher_id, exam_paper_id, exam_name, exam_date, start_time, end_time, cover_image, early_login_minutes, late_forbidden_minutes, is_active, created_at, updated_at, minimum_submission_minutes) FROM stdin;
1	1	2	期末考试	2026-01-30 00:00:00	2026-01-30 09:00:00	2026-01-30 11:00:00	\N	15	15	t	2026-01-05 05:24:19.410296	2026-01-09 07:14:09.921569	15
2	2	1	期末考试	2026-01-05 00:00:00	2026-01-30 09:00:00	2026-01-30 11:00:00	uploads/exam_covers/20260105201429_9978cb76.png	15	15	t	2026-01-05 07:52:54.948156	2026-01-05 12:14:29.330101	15
\.


--
-- Data for Name: exam_paper; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exam_paper (id, teacher_id, paper_name, duration_minutes, min_submit_minutes, composition_mode, total_score, question_order, option_order, is_active, created_at, updated_at, knowledge_point) FROM stdin;
1	2	期末考试试卷	0	0	manual	100.00	fixed	fixed	t	2026-01-05 01:06:40.500757	2026-01-05 01:06:40.500768	未分类
2	1	测试试卷	0	0	manual	100.00	random	random	t	2026-01-05 04:13:45.228383	2026-01-05 04:13:45.228392	未分类
3	2	测试试卷2	0	0	manual	100.00	fixed	fixed	t	2026-01-05 05:00:55.948641	2026-01-05 06:31:41.403261	Python数据采集
4	2	测试试卷3	0	0	auto	100.00	random	random	t	2026-01-05 06:34:47.210582	2026-01-05 06:34:47.210598	Python数据采集
\.


--
-- Data for Name: exam_paper_question; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exam_paper_question (id, exam_paper_id, question_id, score, sort_order, created_at) FROM stdin;
1	1	51	5.00	1	2026-01-05 02:56:41.879863
2	1	2	10.00	2	2026-01-05 03:00:02.170784
3	1	3	8.00	3	2026-01-05 03:03:21.246006
7	1	4	10.00	4	2026-01-05 05:03:52.331908
8	1	5	5.00	5	2026-01-05 05:04:17.568529
9	1	6	5.00	6	2026-01-05 05:04:20.634622
10	1	7	5.00	7	2026-01-05 05:04:25.300867
11	1	8	12.00	8	2026-01-05 05:04:39.621651
12	1	9	10.00	9	2026-01-05 05:04:46.825671
13	1	10	5.00	10	2026-01-05 05:04:51.834915
14	1	11	5.00	11	2026-01-05 05:04:57.426902
15	1	12	5.00	12	2026-01-05 05:05:00.323476
17	1	14	5.00	14	2026-01-05 05:05:06.423234
18	1	15	5.00	15	2026-01-05 05:05:09.071615
19	1	16	5.00	16	2026-01-05 05:05:14.773491
20	3	6	20.00	1	2026-01-05 06:34:02.092813
21	3	2	20.00	2	2026-01-05 06:34:02.098264
22	3	22	10.00	3	2026-01-05 06:34:02.100498
23	3	30	10.00	4	2026-01-05 06:34:02.102662
24	3	32	20.00	5	2026-01-05 06:34:02.104888
25	3	49	20.00	6	2026-01-05 06:34:02.106318
26	4	1	10.00	1	2026-01-05 06:35:12.790393
27	4	3	10.00	2	2026-01-05 06:35:12.7904
28	4	4	10.00	3	2026-01-05 06:35:12.790402
29	4	5	10.00	4	2026-01-05 06:35:12.790404
30	4	6	10.00	5	2026-01-05 06:35:12.790405
31	4	12	25.00	6	2026-01-05 06:35:12.818017
32	4	13	25.00	7	2026-01-05 06:35:12.818022
\.


--
-- Data for Name: exam_student; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exam_student (id, exam_id, student_id, created_at, exam_status, start_time, submit_time) FROM stdin;
\.


--
-- Data for Name: knowledge_graph; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knowledge_graph (id, teacher_id, graph_name, description, is_active, created_at, updated_at) FROM stdin;
1	2	商务数据分析	\N	t	2025-12-31 09:16:27.767238	2025-12-31 09:16:27.767244
\.


--
-- Data for Name: knowledge_node; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knowledge_node (id, graph_id, parent_id, node_name, node_content, sort_order, is_active, created_at, updated_at) FROM stdin;
1	1	\N	数据采集	\N	0	t	2025-12-31 09:16:46.820557	2025-12-31 09:16:46.820563
2	1	\N	数据清洗	\N	0	t	2025-12-31 09:16:56.88479	2025-12-31 09:16:56.884797
3	1	\N	数据治理	\N	0	t	2025-12-31 09:17:04.301765	2025-12-31 09:17:04.301773
4	1	\N	数据挖掘	\N	0	t	2025-12-31 09:17:29.172558	2025-12-31 09:17:29.172564
5	1	1	Python数据采集	\N	0	t	2025-12-31 09:35:54.916213	2025-12-31 09:35:54.916218
6	1	1	爬虫数据采集	\N	0	t	2025-12-31 09:36:06.00442	2025-12-31 09:36:06.004425
7	1	1	API数据采集	\N	0	t	2025-12-31 09:36:13.241825	2025-12-31 09:36:13.24183
8	1	1	数据库数据采集	\N	0	t	2025-12-31 09:36:20.727251	2025-12-31 09:36:20.727256
9	1	2	重复数据处理	\N	0	t	2025-12-31 09:36:30.061879	2025-12-31 09:36:30.061884
10	1	2	缺失数据处理	\N	0	t	2025-12-31 09:36:37.836799	2025-12-31 09:36:37.836805
11	1	3	数据计算	\N	0	t	2025-12-31 09:36:43.908483	2025-12-31 09:36:43.908487
12	1	3	值映射	\N	0	t	2025-12-31 09:36:48.944696	2025-12-31 09:36:48.9447
13	1	4	回归算法	\N	0	t	2025-12-31 09:37:00.396828	2025-12-31 09:37:00.396835
14	1	4	分类算法	\N	0	t	2025-12-31 09:37:06.144622	2025-12-31 09:37:06.144627
\.


--
-- Data for Name: llm_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.llm_config (id, provider_name, provider_key, api_key, api_secret, endpoint_url, model_name, config_json, is_active, created_at, updated_at) FROM stdin;
1	阿里云通义千问	aliyun_qwen	sk-your-api-key-here	\N	https://dashscope.aliyuncs.com/api/v1	qwen-max	\N	f	2025-12-31 07:16:08.322844	2025-12-31 07:16:08.322844
2	DeepSeek	deepseek	sk-your-api-key-here	\N	https://api.deepseek.com/v1	deepseek-chat	\N	f	2025-12-31 07:16:08.322844	2025-12-31 07:16:08.322844
3	KIMI (Moonshot)	kimi	sk-your-api-key-here	\N	https://api.moonshot.cn/v1	moonshot-v1-8k	\N	f	2025-12-31 07:16:08.322844	2025-12-31 07:16:08.322844
4	百度文心一言	wenxin	your-api-key-here	\N	https://aip.baidubce.com/rpc/2.0/ai_custom/v1	ernie-bot-turbo	\N	f	2025-12-31 07:16:08.322844	2025-12-31 07:16:08.322844
5	火山引擎豆包	volcengine_doubao	sk-your-api-key-here	\N	https://ark.cn-beijing.volces.com/api/v3	doubao-pro-32k	\N	f	2025-12-31 07:16:08.322844	2025-12-31 07:16:08.322844
6	硅基流动	siliconflow	sk-redacted		https://api.siliconflow.cn/v1/chat/completions	deepseek-ai/DeepSeek-V3.2		t	2025-12-31 07:16:08.322844	2025-12-31 07:35:22.04737
\.


--
-- Data for Name: major; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.major (id, name, organization_id, tuition_fee, description, duration_years, is_active, created_at, updated_at, teacher_id, code) FROM stdin;
34	市场营销	250	3800.00		3	t	2025-12-30 13:04:16.486688	2025-12-30 13:04:22.216232	3	\N
1	计算机科学与技术	251	5200.00	深入学习算法与系统	4	t	2025-12-30 06:08:14.846112	2025-12-30 14:37:04.277367	2	112345
\.


--
-- Data for Name: organization; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organization (id, name, parent_id, is_active, created_at, updated_at, created_by, updated_by, code) FROM stdin;
247	计算机学院	1	t	2025-12-30 07:59:23.931777	2025-12-30 07:59:23.931783	1	1	ORG0247
248	会计学院	1	t	2025-12-30 07:59:34.209484	2025-12-30 07:59:34.209488	1	1	ORG0248
250	管理学院	1	t	2025-12-30 08:28:55.039062	2025-12-30 08:28:55.039244	1	1	ORG0250
251	计算机应用教研室	247	t	2025-12-30 08:30:32.101285	2025-12-30 08:30:32.101291	1	1	ORG0251
249	管理会计教研室	248	t	2025-12-30 08:06:29.27429	2025-12-30 08:30:39.687088	1	1	ORG0249
252	软件工程教研室	247	t	2025-12-30 08:30:51.71119	2025-12-30 08:30:51.711194	1	1	ORG0252
254	金融服务与管理教研室	253	t	2025-12-30 08:32:45.172909	2025-12-30 08:32:45.172915	1	1	ORG0254
255	金融科技应用教研室	253	t	2025-12-30 08:32:55.791372	2025-12-30 08:32:55.791378	1	1	ORG0255
1	默认学校	\N	t	2025-12-30 06:00:53.226128	2025-12-30 13:57:53.970939	\N	1	MRXX
253	金融学院	1	t	2025-12-30 08:32:33.98618	2025-12-30 13:59:53.710837	1	1	JRXY
256	国际金融教研室	253	t	2025-12-30 08:33:05.113671	2025-12-30 14:02:18.23815	1	1	GJJRJYS
\.


--
-- Data for Name: personalized_learning_content; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.personalized_learning_content (id, student_id, resource_id, content, assessment_id, llm_config_id, created_at) FROM stdin;
1	90	12	# Python数据采集：为您量身定制的可视化学习路径\n\n同学你好，根据你的学习特点，我们为你设计了一套结构规律、以视觉演示为核心、适合在安静环境中独立学习的内容。我们将复杂的知识模块化，并安排了固定的学习阶段，帮助你循序渐进地掌握Python数据采集。\n\n## 📅 **第一阶段：建立规律性认知（第1-2周，固定时间学习）**\n\n**本周固定学习时段建议**：每周一、三、五晚8:00-9:00，在安静的书房中开始。\n\n### 1.1 核心概念的可视化理解\n考虑到你对视频和动态内容的偏好，**请务必观看配套的示意图和动态演示视频**（链接附在文末），它们会直观展示以下过程：\n\n*   **数据流动图**：展示数据从网站/API/数据库，经过Python代码，最终存储到文件的全过程。这比纯文字描述更能帮你建立宏观印象。\n*   **网络爬虫工作动画**：模拟一个爬虫程序如何访问网页、下载HTML、解析并提取目标数据。观看动画后，再回头看代码，你会更容易理解`requests`和`BeautifulSoup`每个步骤的作用。\n\n**学习建议**：每次学习新概念前，先花5分钟观看对应的原理动画，形成视觉记忆，然后再阅读文字解释。\n\n### 1.2 Python数据采集的优势（记忆锚点）\n这部分是你需要理解并记住的“为什么”。我们用一个简单的表格来对比，方便你视觉化记忆：\n\n| 对比维度 | Python的优势 | 对你的价值 |\n| :--- | :--- | :--- |\n| **学习成本** | 语法像简单英语，易于阅读 | **降低入门门槛**，你无需记忆复杂规则 |\n| **工具丰富度** | 有`requests`、`BeautifulSoup`等现成的强大“工具箱” | **无需从零造轮子**，直接使用高效工具 |\n| **解决问题** | 拥有全球最大的开发者社区之一 | **遇到报错不慌张**，几乎任何问题都能在网上找到解决方案 |\n\n**记忆技巧**：记住三个关键词：**“简单”**、**“工具箱”**、**“后援团”**。这分别对应了Python的语法、库和社区优势。\n\n---\n\n## 🛠️ **第二阶段：核心技能模块化实操（第3-5周，每周一个主题）**\n\n我们将核心内容拆解为三个独立的模块，每周集中攻克一个。每个模块都遵循 **“原理动画 → 核心代码图解 → 模仿练习”** 的固定节奏。\n\n### **模块一：静态网页爬虫（视觉解析重点）**\n这是最常见的数据采集方式。关键在于理解网页的“HTML结构”。\n\n*   **难点与视觉化突破**：\n    *   **难点**：理解抽象的HTML文档树结构。\n    *   **视觉方案**：**观看“HTML标签树”解析视频**。视频会将一个复杂的网页简化为一个由`<html>`、`<body>`、`<div>`、`<p>`等标签构成的树形图，并高亮显示你需要提取的数据所在的分支。\n*   **核心代码图解（替代复杂笔记）**：\n    ```python\n    # 1. 获取网页（像用浏览器输入网址）\n    response = requests.get(url)\n    \n    # 2. 解析网页（把HTML变成可查找的结构化“树”）\n    soup = BeautifulSoup(html, 'lxml') # 想象成给网页拍了个X光片，骨骼清晰可见\n    \n    # 3. 提取数据（根据标签名和属性“定位”数据）\n    titles = soup.find_all('h1', class_='title') # 找到所有class为‘title’的h1标签\n    ```\n    **学习建议**：不要死记硬背代码。将这三步视为一个固定的**流水线**：**下载 → 解析 → 提取**。每次写爬虫都按这个顺序思考。\n\n### **模块二：API数据采集（结构化接口）**\nAPI提供了更规整的数据。这里的关键是理解“请求”和“响应”的格式。\n\n*   **视觉辅助**：观看 **“API请求响应模型”动画**，它将展示你的程序如何发送一个带有地址（URL）和身份凭证（API Key）的标准化“请求包”，以及服务器如何返回一个整齐的JSON“数据包”。\n*   **核心模式**：\n    ```python\n    # 模式非常固定，几乎可以套用\n    url = "基础地址/端点路径"\n    headers = {"认证信息": "你的密钥"} # 如果需要的话\n    params = {"参数名": "值"} # 过滤数据，比如获取第10页\n    \n    data = requests.get(url, headers=headers, params=params).json()\n    # 得到的data通常就是字典或列表，可以直接使用\n    ```\n    **记忆技巧**：把API想象成一个**自动售货机**。你选择商品（端点）、投币（API Key）、按下按钮（发送请求），它就会吐出你想要的饮料（JSON数据）。这个过程是标准化的。\n\n### **模块三：数据库采集（内部数据源）**\n这部分逻辑最直接，因为你是在“查询”已经存在的数据。\n\n*   **视觉流程图**：观看 **“数据库连接与查询”流程图**，它清晰展示：建立连接 → 执行SQL语句 → 获取结果 → 关闭连接。这是一个单向、清晰的流程。\n*   **代码模板**：\n    ```python\n    # 步骤固定，只需替换连接信息和SQL语句\n    conn = 创建连接(主机, 用户, 密码, 数据库名) # 第一步：开门\n    df = pd.read_sql("SELECT * FROM 表名", conn) # 第二步：取东西\n    conn.close() # 第三步：关门（重要！）\n    ```\n    **学习建议**：此模块的重点是“安全操作”。记住 **“开门 → 办事 → 关门”** 这个固定流程，尤其不要忘记最后关闭连接。\n\n---\n\n## ⚙️ **第三阶段：高级技巧与最佳实践（第6-7周，选择性深入）**\n\n这部分内容用于提升程序的**稳定性和效率**，你可以在掌握前三周内容后，根据自己的兴趣选择性学习。\n\n### **动态页面采集（应对JavaScript）**\n*   **视觉对比**：观看 **“静态 vs 动态页面加载”对比视频**。你会直观地看到，动态页面的内容是在浏览器中由JavaScript“画”出来的，所以需要`Selenium`这样的工具来“模拟浏览器行为”。\n*   **核心思想**：当你发现`requests`获取的网页源码中没有数据时，就该想到这个工具。\n\n### **让你的爬虫更健壮（重要实践）**\n这部分内容能极大减少程序运行中的意外中断。\n\n1.  **伪装请求头**：直接复制使用提供的`get_realistic_headers()`函数即可，无需深究每个字段。\n2.  **错误重试机制**：**强烈建议你直接使用提供的`@retry`装饰器**。像贴标签一样把它加在可能失败的函数上方，它就会自动帮你重试。这是性价比最高的稳定性提升技巧。\n    ```python\n    @retry(max_attempts=3, delay=2) # 贴上这个“护身符”\n    def your_collect_function(url):\n        # 你的采集代码\n    ```\n\n### **规律性复习与巩固建议**\n根据你“中等程度主动复习”的特点，建议采用以下低强度但规律的复习方式：\n*   **每周日晚上用30分钟**，回顾本周学习的**核心流程图**和**三行核心代码模板**。\n*   **动手练习不求多，但求有规律**：每周完成一个小任务即可，例如：用模块一的方法爬取一个新闻网站的标题列表。关键在于重复和熟悉流程。\n*   **建立你的“代码片段库”**：将上面每个模块的“核心代码模板”保存在一个单独的Python文件里（如`my_templates.py`）。下次需要时，直接复制粘贴并修改关键参数，而不是从头重写。这能有效降低你的认知负担。\n\n**配套视觉资源索引**：\n1.  数据采集全流程动画\n2.  HTML文档树解析演示\n3.  API请求响应模型动画\n4.  数据库连接查询流程图\n5.  静/动态网页加载对比视频\n\n请按照这个结构化的路径，在你自己喜欢的安静时段，结合视觉化材料进行学习。每一步的目标都很明确，你只需要跟随这个节奏，就能稳步建立对Python数据采集的扎实理解。祝你学习顺利！	3	6	2026-01-09 10:11:17.36409
2	90	12	# Python数据采集：视觉化学习指南\n\n## 一、开篇导览：数据采集的“视觉地图”\n\n想象一下，你是一位数字世界的探险家，而数据就是你寻找的宝藏。**Python数据采集**就是你手中的地图和工具，帮助你在浩瀚的互联网中系统地发现、收集这些宝藏。\n\n> 💡 **提示：** 你偏好规律学习，可以尝试将本指南的内容分配到固定的学习时段（例如每周二、四晚8点），每次专注于一个章节，建立稳定的学习节奏。\n\n### 1.1 为什么数据采集如此重要？\n可以把数据想象成现代社会的“新石油”。无论是你手机里的推荐歌曲、电商网站猜你喜欢的商品，还是天气预报的精准预测，背后都需要大量的数据作为燃料。\n\n*   **企业的眼睛**：通过采集市场数据，企业能看清消费者喜好。\n*   **研究的基石**：学术研究需要大量实验数据作为支撑。\n*   **智能的核心**：人工智能模型就像需要大量“食物”（数据）才能成长的大脑。\n\n### 1.2 为什么选择Python作为采集工具？\n如果把数据采集比作钓鱼，Python就是一个**多功能、易上手且拥有各种高级鱼饵和鱼竿的钓鱼工具箱**。\n\n*   **工具箱丰富（库多）**：`requests`（鱼竿）、`BeautifulSoup`（鱼饵处理器）、`Selenium`（自动钓鱼机）等，应有尽有。\n*   **说明书易懂（语法简单）**：Python代码像简明的说明书，让你快速理解工具如何使用。\n*   **去哪都能用（跨平台）**：无论在哪种电脑系统上，你的工具箱都能打开使用。\n*   **有问必答（社区强大）**：遇到问题，全球有数百万开发者可以为你提供解答。\n\n> 💡 **提示：** 你偏好视觉学习，在学习时，可以将每个库想象成一个具体的工具图标，在脑海中构建你的“Python采集工具箱”视觉图。\n\n## 二、核心采集方式：三种不同的“寻宝路径”\n\n数据采集主要有三条路径，就像去不同的地方寻找不同的宝藏。\n\n### 2.1 网络爬虫：在“网页矿山”中挖掘\n这是最经典的采集方式，目标是从网页上提取公开信息。\n\n**视觉化场景**：想象你正在浏览一个新闻网站，爬虫的工作就是**自动、快速地复制下所有文章的标题和链接**，并整齐地整理到你的笔记本（Excel或数据库）里。\n\n**核心工具与代码示例**：\n```python\n# 1. 发出请求：就像在浏览器地址栏输入网址并回车\nimport requests\nresponse = requests.get('https://example.com/news')\n\n# 2. 解析内容：像用高亮笔标出你需要的信息（标题和链接）\nfrom bs4 import BeautifulSoup\nsoup = BeautifulSoup(response.text, 'html.parser')\n\ntitles = soup.find_all('h2', class_='news-title') # 找到所有新闻标题\nfor title in titles:\n    print(title.text) # 打印出纯文本标题\n    link = title.find('a')['href'] # 提取链接\n    print(link)\n```\n> 💡 **提示：** 对于偏好安静环境的你，运行这段代码时，它会在后台静默工作，不会产生任何干扰你的噪音，完美契合你的学习环境需求。\n\n### 2.2 API接口：从“数据水龙头”接水\n许多网站和服务提供了官方的数据接口（API），允许你按规则获取结构规整的数据，这比从网页上“挖矿”更高效、更稳定。\n\n**视觉化场景**：就像你家的自来水龙头，API是网站官方安装的“数据水龙头”。你只需要知道怎么“拧开”（发送请求），并准备好“水桶”（接收数据的程序），就能获得干净、流动的数据流。\n\n**核心工具与代码示例**：\n```python\nimport requests\nimport json\n\n# 假设有一个提供天气数据的API\napi_url = "https://api.weather.com/v3/current"\nparams = {\n    'location': 'Beijing',\n    'apikey': 'your_api_key_here' # 通常需要密钥\n}\n\n# 发送请求到“数据水龙头”\nresponse = requests.get(api_url, params=params)\nweather_data = response.json() # 接住流出的“数据水”\n\n# 数据已经是规整的JSON格式，可以直接使用\nprint(f"北京当前温度：{weather_data['temperature']}℃")\nprint(f"天气状况：{weather_data['conditions']}")\n```\n\n### 2.3 数据库直连：进入“数据仓库”搬运\n当数据已经存储在公司的数据库里时，你可以直接用Python连接并查询，进行深度分析。\n\n**视觉化类比**：这就像你拥有权限直接进入一个巨大的**自动化仓库（数据库）**。你可以用SQL语句告诉仓库机器人（Python程序）：“请把上个月所有销量大于1000的商品记录给我搬出来。” 数据会以整齐的表格形式呈现。\n\n**核心工具概览**：\n*   **MySQL/PostgreSQL**：像是结构严谨、分门别类的货架仓库。\n*   **MongoDB**：像是可以灵活堆放各种形状货物（非结构化数据）的集装箱堆场。\n*   **Redis**：像是高速传递带，存放最常用、需要快速存取的数据。\n\n## 三、应对复杂挑战：高级采集技术\n\n### 3.1 动态网页采集：对付“会变脸的网页”\n有些网页内容（如评论区、滚动加载的图片）是打开后由JavaScript动态生成的，简单的`requests`获取不到。这时需要**自动化浏览器工具**。\n\n**视觉化场景**：你需要采集一个需要滚动到底部才会加载更多内容的社交媒体页面。`Selenium`可以模拟真人操作——**自动滚动页面、点击按钮、等待新内容出现**，然后再采集。\n\n### 3.2 异步采集：开启“多线程下载”\n当你要采集成百上千个网页时，一个个等太慢。异步采集就像**同时派出多个机器人去不同的地方取快递**，极大提升效率。\n\n**核心思想类比**：同步采集是“取完一个快递，再回家拿地址去取下一个”。异步采集是“把所有的取件码同时发给一队机器人，它们同时出发，谁先取到谁先回来”。\n\n## 四、成为负责任的采集者：最佳实践\n\n在数字世界“寻宝”，必须遵守规则，否则可能触犯法律或网站规定。\n\n*   **尊重robots.txt**：这是网站放在门口的“访客须知”。爬虫前先检查，被告知“禁止入内”的地方就不要强行闯入。\n*   **伪装成浏览器**：通过设置`User-Agent`等请求头，让你的爬虫看起来像一个普通的浏览器访问，避免被网站屏蔽。\n*   **使用代理IP**：如果采集频率过高，你的真实IP地址可能会被暂时封禁。代理IP就像使用不同的“面具”或“通道”来分散请求。\n*   **优雅地处理错误**：网络可能不稳定。好的程序应该有**重试机制**，就像敲门没人应，等一会儿再敲几次，而不是直接砸门。\n\n```python\n# 一个简单的重试机制示例\nimport time\nfrom functools import wraps\n\ndef retry(times=3, delay=2):\n    def decorator(func):\n        @wraps(func)\n        def wrapper(*args, **kwargs):\n            for attempt in range(times):\n                try:\n                    return func(*args, **kwargs)\n                except Exception as e:\n                    print(f"第{attempt+1}次尝试失败: {e}")\n                    if attempt < times - 1:\n                        time.sleep(delay) # 等待一会儿再试\n                    else:\n                        raise # 最后一次失败，抛出异常\n        return wrapper\n    return decorator\n\n@retry(times=3, delay=2)\ndef safe_fetch(url):\n    # 这是一个可能会失败的请求函数\n    response = requests.get(url, timeout=5)\n    return response.text\n```\n\n## 五、妥善保管宝藏：数据存储\n\n采集到的数据需要妥善保存，就像把寻获的宝藏分门别类放进不同的宝箱。\n\n*   **JSON文件**：适合保存结构化的配置或嵌套数据，易于人和程序阅读。\n*   **CSV/Excel文件**：适合保存表格数据，便于用Excel打开查看和做简单分析。\n*   **数据库**：适合海量数据、需要频繁查询和更新的场景，是专业的“数据仓库”。\n\n> 💡 **提示：** 你主动做笔记的习惯中等，但视觉偏好强。建议在学习时，使用思维导图软件（如XMind）来绘制本指南的知识结构图，将抽象概念化为视觉节点，这比纯文字笔记更能辅助你记忆和理解整个知识体系。\n\n通过以上视觉化的类比和结构清晰的讲解，希望你能在固定的时间、安静的环境中，更轻松、更有规律地掌握Python数据采集的核心脉络。记住，每个概念都可以尝试在脑海中构建一幅图像，这将极大地帮助你的学习和记忆。	3	6	2026-01-09 10:26:58.182168
3	90	12	## Python数据采集：视觉化入门指南\n\n你好！这份学习材料将为你系统、直观地讲解Python数据采集的核心知识与方法。根据你的学习特点——**规律性、视觉偏好、需要安静环境**——内容将采用清晰的阶段性结构，并运用大量比喻和场景描述来帮助你构建视觉化理解。建议你在每天固定的、安静的时间段内，按顺序学习每个部分。\n\n### 第一章：全景概览：数据采集是什么？\n\n想象一下，你是一名数字时代的“探险家”或“采集者”。网络世界就是一片浩瀚的信息森林，里面有文本、图片、数据等各种“果实”和“矿产”。**Python数据采集**，就是你用来高效、自动地从这片森林中收集所需资源的工具套装。\n\n> 💡 **提示：** 你可以把整个学习过程想象成解锁一张“数据采集地图”。每学完一节，就点亮地图的一个区域。规律性的学习能帮你稳步推进这张地图。\n\n#### 1.1 为什么选择Python作为“采集工具”？\nPython之所以成为数据采集的首选，就像拥有一套多功能、易上手的瑞士军刀：\n*   **丰富的工具库（生态系统）：** 不需要你从零开始造工具。`requests`（获取网页）、`BeautifulSoup`（解析网页结构）、`Selenium`（操作浏览器）等库都是现成的、强大的组件。\n*   **简洁的语法（易读易写）：** 代码更像英语句子，让你能更专注于“采集逻辑”本身，而不是复杂的语法规则。\n    ```python\n    # 对比：用Python获取网页，直观如“打开水龙头”\n    import requests\n    网页内容 = requests.get('网址').text\n    ```\n*   **强大的社区支持：** 遇到任何“采集路障”，几乎都能在网上找到其他探险家分享的解决方案。\n\n### 第二章：核心采集方式：三种不同的“采集场景”\n\n数据采集主要有三种途径，对应三种不同的数据源场景。\n\n#### 2.1 网络爬虫：采集“静态展览馆”（网页）\n大多数网页就像一个布置好的静态展览馆，所有展品（数据）都直接摆在HTML代码里。\n\n**核心工具与流程比喻：**\n1.  **发送请求（敲门）：** 使用 `requests` 库，模拟浏览器“敲门”问网站要网页文件。\n2.  **解析内容（识别展品）：** 使用 `BeautifulSoup` 库，帮你快速在杂乱的HTML代码中，找到并提取标题、段落、链接等“展品”。\n\n**视觉化代码示例：**\n```python\nimport requests\nfrom bs4 import BeautifulSoup\n\n# 1. 敲门并获取展览手册（网页源代码）\nurl = 'https://example.com/news'\nresponse = requests.get(url)\nhtml_doc = response.text  # 这就是展馆的完整手册\n\n# 2. 用BeautifulSoup解析手册，找出所有“新闻标题”展品\nsoup = BeautifulSoup(html_doc, 'html.parser')\nnews_titles = soup.find_all('h2', class_='news-title')  # 找到所有<h2 class="news-title">标签\n\nfor title in news_titles:\n    print(title.text.strip())  # 提取并打印出纯净的文字内容\n```\n\n> 💡 **提示：** 对于视觉型学习者，可以把HTML文档想象成一棵“标签树”。`BeautifulSoup` 帮助你在这棵树上沿着枝干（标签嵌套）轻松地采摘叶子（数据）。\n\n#### 2.2 API采集：访问“标准化数据接口”\n许多现代网站和平台（如微博、天气应用）提供**API**，这就像一个专门为你设立的、格式标准的“数据服务窗口”。从这里获取数据，效率更高，也更稳定。\n\n**核心过程：**\n*   **请求：** 向一个特定的API网址（端点）发送请求。\n*   **返回：** API直接返回结构化的数据（通常是JSON格式，非常规整，类似Python的字典和列表）。\n\n**场景化示例：**\n假设一个天气API。\n```python\nimport requests\n# 向天气数据服务窗口询问北京的气温\napi_url = "https://api.weather.com/v3/北京/current"\nresponse = requests.get(api_url)\nweather_data = response.json()  # 得到一份规整的JSON数据字典\n\nprint(f"北京当前温度：{weather_data['temperature']}度")\nprint(f"天气状况：{weather_data['condition']}")\n```\n\n#### 2.3 数据库采集：直接进入“数据仓库”\n如果数据已经存储在公司的MySQL、MongoDB等数据库里，那么采集就像获得许可后，直接进入仓库，用SQL“查询语句”精准提货。\n\n**关系型数据库（如MySQL）示例：**\n```python\nimport pymysql\nimport pandas as pd\n\n# 1. 连接数据库仓库\nconnection = pymysql.connect(host='localhost', user='name', password='pass', database='sales_db')\n\n# 2. 写下提货单（SQL查询语句）\nsql_query = "SELECT product_name, sales_amount FROM orders WHERE date = '2023-10-01';"\n\n# 3. 执行提货，并用pandas整理成规整的表格\ndf = pd.read_sql(sql_query, connection)\nprint(df.head())\n\n# 4. 关闭仓库门\nconnection.close()\n```\n\n### 第三章：应对复杂场景：高级“采集技巧”\n\n#### 3.1 动态网页采集：与“会动的展览馆”交互\n有些网页像“会动的展览馆”，展品（数据）需要你点击按钮、滚动页面后，才会通过JavaScript加载出来。这时，我们需要能模拟真人操作的自动化工具——**Selenium**。\n\n**Selenium工作流程比喻：**\n它就像一个**机器人浏览器**，能：\n*   打开真实浏览器。\n*   等待页面元素出现。\n*   模拟点击、滚动、输入等操作。\n*   在页面完全加载后，再获取最终的“完整展览手册”。\n\n> 💡 **提示：** 你可以将Selenium脚本看作是在录制和回放一套你在浏览器中的手动操作。这对于理解脚本每一步的目的非常有帮助。\n\n#### 3.2 遵守规则与保持礼貌：采集伦理\n作为一名有道德的“数据探险家”，必须遵守规则：\n*   **查看 `robots.txt`：** 这是网站放在入口处的“参观须知”。使用 `urllib.robotparser` 可以自动读取并判断哪些区域允许采集。\n*   **设置友好请求头：** 让你的采集请求看起来更像一个普通浏览器在访问，而不是机器人。\n*   **控制访问频率：** 在请求间添加短暂延迟（如 `time.sleep(1)`），避免对目标网站服务器造成过大压力。\n\n### 第四章：采集之后：数据的“收纳与整理”\n采集到的数据需要妥善保存，就像把采集到的果实分门别类放入不同的保鲜盒。\n\n**常用存储格式：**\n*   **JSON文件：** 适合存储嵌套的、结构灵活的数据。像把不同形状的工艺品放进有格子的收纳盒。\n    ```python\n    import json\n    data = [{'name': '产品A', 'price': 100}, {'name': '产品B', 'price': 200}]\n    with open('products.json', 'w') as f:\n        json.dump(data, f, indent=2)  # indent让文件有缩进，更易读\n    ```\n*   **CSV文件：** 适合存储表格型的规整数据。像把苹果、梨子整齐地排成行和列。\n    ```python\n    import csv\n    with open('products.csv', 'w', newline='') as f:\n        writer = csv.writer(f)\n        writer.writerow(['产品名', '价格'])  # 写入表头\n        writer.writerow(['产品A', 100])\n        writer.writerow(['产品B', 200])\n    ```\n*   **数据库：** 适合海量、需要频繁查询和关联的数据。直接存回专业的“数据仓库”。\n\n### 总结：你的数据采集工具箱\n现在，你的“探险地图”已基本点亮。回顾一下你的核心工具箱：\n1.  **基础采集：** `requests` + `BeautifulSoup` 用于静态网页。\n2.  **高效接口：** `requests` 调用JSON API。\n3.  **动态交互：** `Selenium` 用于需要操作的JavaScript网页。\n4.  **数据整理：** `pandas` 和各类文件（JSON/CSV）操作库。\n\n> 💡 **提示：** 规律性学习的关键在于“小步快走”。每次学习后，可以尝试运行一个本节的小代码示例，亲眼看到代码如何产生数据结果，这种即时的视觉反馈能极大地巩固你的理解和记忆。在安静的环境中，这种专注的实践会更加有效。\n\n这份指南为你搭建了一个结构清晰、视觉化的学习框架。接下来，你可以选择最感兴趣的一个场景（如网络爬虫），在自己的电脑上，选择一个简单的目标网站，开始你的第一次数据采集实践。祝你探险顺利！	3	6	2026-01-09 10:33:02.17584
\.


--
-- Data for Name: question; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question (id, teacher_id, question_type, title, title_image, knowledge_point, answer, answer_image, explanation, explanation_image, difficulty, is_active, created_at, updated_at) FROM stdin;
1	2	single_choice	在Python中，当尝试从模块导入特定功能时遇到错误 'cannot import name 'get_oss_client' from 'app.utils.oss_client''，最可能的原因是什么？	\N	Python数据采集	\N	\N	ImportError: cannot import name错误通常表示在指定的模块中找不到尝试导入的特定名称（函数、类、变量等）。因此，最可能的原因是模块'oss_client.py'中确实没有定义名为'get_oss_client'的对象。其他选项如路径问题通常会导致ModuleNotFoundError，编码问题或版本问题也可能导致错误，但不是此特定错误信息的最直接原因。	\N	2	t	2026-01-04 06:30:26.220261	2026-01-04 06:30:26.220267
3	2	single_choice	在商务数据分析中，ROI代表什么？	\N	商务数据分析		\N	ROI（Return on Investment）是投资回报率，用于衡量投资的效益。	\N	1	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
4	2	single_choice	在数据清洗过程中，处理缺失值的方法不包括？	\N	数据清洗		\N	处理缺失值的常见方法包括删除、填充（均值、中位数、众数等）和插值，增加数据行数不是处理缺失值的方法。	\N	2	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
5	2	single_choice	SQL中用于查询的关键字是？	\N	数据库数据采集		\N	SELECT是SQL中用于查询数据的关键字。	\N	1	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
6	2	single_choice	在Python中，哪个方法用于读取CSV文件？	\N	Python数据采集		\N	pandas库使用read_csv()方法读取CSV文件。	\N	1	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
7	2	single_choice	在数据可视化中，用于展示数据分布的图表类型是？	\N	数据可视化		\N	直方图（Histogram）是展示数据分布的最常用图表类型。	\N	2	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
8	2	single_choice	在Python中，requests库的主要用途是？	\N	API数据采集		\N	requests是Python中用于发送HTTP请求的库，常用于API调用和网页爬取。	\N	1	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
9	2	single_choice	在统计学中，标准差用于衡量什么？	\N	统计分析		\N	标准差是衡量数据离散程度的重要指标，标准差越大，数据越分散。	\N	2	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
10	2	single_choice	在商务分析中，SWOT分析的S代表什么？	\N	商务数据分析		\N	SWOT分析中，S代表Strengths（优势），W代表Weaknesses（劣势），O代表Opportunities（机会），T代表Threats（威胁）。	\N	1	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
11	2	single_choice	在数据挖掘中，哪种算法属于监督学习？	\N	数据挖掘		\N	决策树是一种监督学习算法，需要标注的训练数据。K-means和DBSCAN是无监督学习的聚类算法，PCA是降维技术。	\N	2	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
12	2	multiple_choice	以下哪些是常见的数据清洗操作？（多选）	\N	数据清洗		\N	数据清洗包括处理缺失值、删除重复数据、数据类型转换等操作，创建新数据库不属于数据清洗。	\N	2	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
13	2	multiple_choice	以下哪些是Python中常用的数据可视化库？（多选）	\N	数据可视化		\N	matplotlib、seaborn和plotly都是Python中常用的数据可视化库，requests是HTTP请求库。	\N	1	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
14	2	multiple_choice	以下哪些属于描述性统计指标？（多选）	\N	统计分析		\N	平均值、中位数、标准差都是描述性统计指标，假设检验属于推断统计。	\N	1	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
15	2	multiple_choice	在商务数据分析中，哪些指标属于用户行为分析？（多选）	\N	商务数据分析		\N	用户留存率、活跃度和转化率都是用户行为分析指标，固定资产是财务指标。	\N	2	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
16	2	multiple_choice	以下哪些是常见的机器学习算法类型？（多选）	\N	数据挖掘		\N	分类、回归、聚类都是机器学习算法类型，排序算法属于计算机算法范畴。	\N	2	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
17	2	multiple_choice	在数据库查询中，以下哪些是聚合函数？（多选）	\N	数据库数据采集		\N	COUNT()、SUM()、AVG()都是SQL聚合函数，WHERE是条件子句。	\N	1	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
18	2	multiple_choice	以下哪些是数据采集的常见来源？（多选）	\N	Python数据采集		\N	网页爬虫、API接口和数据库都是常见的数据采集来源。	\N	1	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
19	2	multiple_choice	在Python爬虫中，以下哪些库可以用于发送HTTP请求？（多选）	\N	爬虫数据采集		\N	requests、urllib和httpx都可以用于发送HTTP请求，pandas是数据分析库。	\N	2	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
20	2	multiple_choice	以下哪些是数据可视化的原则？（多选）	\N	数据可视化		\N	数据可视化应遵循简洁明了、准确性和美观性原则，并非数据量越大越好。	\N	2	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
21	2	multiple_choice	在数据治理中，以下哪些是重要的概念？（多选）	\N	数据治理		\N	数据质量、安全和标准是数据治理的核心概念，数据删除只是操作之一。	\N	2	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
22	2	true_false	在Python中，列表（list）是可变的数据类型。	\N	Python数据采集	{"answer": "true"}	\N	正确。Python中的列表是可变的（mutable），可以在创建后修改其内容。	\N	1	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
23	2	true_false	数据清洗是数据分析流程中可以省略的步骤。	\N	数据清洗	{"answer": "false"}	\N	错误。数据清洗是数据分析中非常重要且不可省略的步骤，直接影响分析结果的准确性。	\N	1	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
24	2	true_false	相关性分析可以证明因果关系。	\N	统计分析	{"answer": "false"}	\N	错误。相关性不等于因果关系，两个变量相关并不意味着一个变量的变化导致了另一个变量的变化。	\N	2	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
25	2	true_false	在SQL中，JOIN操作用于合并两个或多个表的数据。	\N	数据库数据采集	{"answer": "true"}	\N	正确。JOIN操作用于根据两个或多个表之间的关联列来合并数据。	\N	1	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
26	2	true_false	机器学习中的过拟合是指模型在训练集上表现很好，但在测试集上表现较差。	\N	数据挖掘	{"answer": "true"}	\N	正确。过拟合是指模型过度学习了训练数据的特征，导致泛化能力差。	\N	2	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
27	2	true_false	在商务数据分析中，所有数据都应该被纳入分析范围。	\N	商务数据分析	{"answer": "false"}	\N	错误。应该根据分析目标选择相关数据，不相关的数据可能引入噪音，影响分析效果。	\N	2	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
28	2	true_false	网页爬虫可以无限制地爬取任何网站的数据。	\N	爬虫数据采集	{"answer": "false"}	\N	错误。爬虫应遵守网站的robots.txt协议和相关法律法规，不能无限制地爬取数据。	\N	1	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
29	2	true_false	数据可视化只是为了让图表看起来更美观。	\N	数据可视化	{"answer": "false"}	\N	错误。数据可视化的主要目的是帮助人们更好地理解数据、发现规律和洞察。	\N	1	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
30	2	true_false	在Python中，pandas的DataFrame可以包含不同类型的数据。	\N	Python数据采集	{"answer": "true"}	\N	正确。DataFrame的不同列可以包含不同类型的数据（整数、浮点数、字符串等）。	\N	1	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
31	2	true_false	API接口调用不需要身份验证。	\N	API数据采集	{"answer": "false"}	\N	错误。大多数API接口需要身份验证（如API Key、Token等）来控制访问权限。	\N	1	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
32	2	fill_blank	在Python中，使用______库可以方便地进行数据分析和处理。	\N	Python数据采集	{"blanks": ["pandas"]}	\N	pandas是Python中最常用的数据分析库，提供了DataFrame等强大的数据结构。	\N	1	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
33	2	fill_blank	SQL查询语句中，______子句用于指定查询条件。	\N	数据库数据采集	{"blanks": ["WHERE"]}	\N	WHERE子句用于在SQL查询中指定过滤条件。	\N	1	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
34	2	fill_blank	在统计学中，______是描述数据集中趋势的重要指标之一。	\N	统计分析	{"blanks": ["平均值"]}	\N	平均值（均值）是最常用的集中趋势度量指标。	\N	1	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
35	2	fill_blank	在商务分析中，______分析用于评估企业的优势、劣势、机会和威胁。	\N	商务数据分析	{"blanks": ["SWOT"]}	\N	SWOT分析是战略规划的经典工具。	\N	1	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
36	2	fill_blank	Python中的______库用于发送HTTP请求，是网页爬虫的基础工具。	\N	爬虫数据采集	{"blanks": ["requests"]}	\N	requests是Python中最流行的HTTP请求库。	\N	1	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
37	2	fill_blank	在数据可视化中，______图适合展示数据的趋势变化。	\N	数据可视化	{"blanks": ["折线图"]}	\N	折线图能够直观地展示数据随时间或其他连续变量的变化趋势。	\N	1	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
38	2	fill_blank	在机器学习中，______学习需要使用标注的训练数据。	\N	数据挖掘	{"blanks": ["监督"]}	\N	监督学习需要标注数据来训练模型，而无监督学习不需要。	\N	2	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
39	2	fill_blank	数据清洗中，处理______数据是保证数据质量的重要步骤。	\N	数据清洗	{"blanks": ["缺失"]}	\N	缺失数据、重复数据和异常数据都是数据清洗需要处理的重要内容。	\N	1	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
40	2	fill_blank	在Excel中，______函数用于查找和返回数据。	\N	Excel数据分析	{"blanks": ["VLOOKUP"]}	\N	VLOOKUP是Excel中最常用的查找函数。	\N	1	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
41	2	fill_blank	在数据库设计中，______用于唯一标识表中的每一条记录。	\N	数据库数据采集	{"blanks": ["主键"]}	\N	主键用于唯一标识表中的每一条记录。	\N	1	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
42	2	short_answer	请简述数据清洗的主要步骤。	\N	数据清洗	{"key_points": ["1. 处理缺失值：删除或填充", "2. 删除重复数据", "3. 处理异常值：识别和处理离群点", "4. 数据类型转换：确保数据类型正确", "5. 数据标准化/归一化"]}	\N	数据清洗包括处理缺失值、删除重复、处理异常值、类型转换和标准化等步骤，目的是提高数据质量。	\N	2	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
43	2	short_answer	什么是API？在数据采集中有什么作用？	\N	API数据采集	{"key_points": ["API是Application Programming Interface的缩写", "是不同软件系统之间交互的接口", "在数据采集中可以直接获取结构化数据", "相比爬虫更稳定、合法、高效"]}	\N	API是应用程序编程接口，提供了一种标准化的数据交互方式，是现代数据采集的重要途径。	\N	2	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
44	2	short_answer	请列举至少三种常见的数据可视化图表类型及其适用场景。	\N	数据可视化	{"key_points": ["1. 折线图：展示数据趋势变化", "2. 柱状图：比较不同类别的数据", "3. 饼图：展示数据的占比关系", "4. 散点图：展示两个变量之间的相关关系", "5. 热力图：展示数据的分布密度"]}	\N	不同的图表类型适用于不同的数据展示需求，选择合适的图表可以更有效地传达信息。	\N	2	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
45	2	short_answer	什么是机器学习中的过拟合？如何避免？	\N	数据挖掘	{"key_points": ["过拟合是指模型在训练集上表现很好，但泛化能力差", "避免方法：1. 增加训练数据量", "2. 使用正则化技术", "3. 简化模型复杂度", "4. 使用交叉验证", "5. 提前停止训练"]}	\N	过拟合是机器学习中的常见问题，需要通过多种技术手段来预防和控制。	\N	3	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
46	2	short_answer	请说明商务数据分析中用户留存率的计算方法及其重要性。	\N	商务数据分析	{"key_points": ["留存率 = 特定时期后仍活跃的用户数 / 初始用户数 × 100%", "重要性：1. 衡量产品的用户粘性", "2. 反映用户满意度", "3. 预测长期价值", "4. 指导产品优化方向"]}	\N	用户留存率是衡量产品成功与否的关键指标，直接影响企业的长期发展。	\N	2	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
47	2	short_answer	在网页爬虫中，如何设置请求头来模拟浏览器行为？为什么需要这样做？	\N	爬虫数据采集	{"key_points": ["设置User-Agent字段模拟浏览器", "可添加Accept、Accept-Language等字段", "原因：1. 绕过反爬虫机制", "2. 提高请求成功率", "3. 遵守网站规则"]}	\N	设置合适的请求头可以让爬虫更像真实用户，提高数据采集的成功率。	\N	2	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
48	2	short_answer	请简述SQL中JOIN的几种类型及其区别。	\N	数据库数据采集	{"key_points": ["1. INNER JOIN：返回两表匹配的记录", "2. LEFT JOIN：返回左表所有记录及右表匹配记录", "3. RIGHT JOIN：返回右表所有记录及左表匹配记录", "4. FULL JOIN：返回两表所有记录", "区别在于处理不匹配记录的方式"]}	\N	不同类型的JOIN适用于不同的数据合并场景，理解它们的区别对数据查询很重要。	\N	3	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
49	2	short_answer	请说明Python中列表（list）和元组（tuple）的区别。	\N	Python数据采集	{"key_points": ["1. 可变性：列表是可变的，元组是不可变的", "2. 语法：列表用[]，元组用()", "3. 性能：元组比列表更快", "4. 用途：列表用于可修改的序列，元组用于固定数据"]}	\N	列表和元组是Python中最常用的序列类型，各有其特点和适用场景。	\N	2	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
50	2	short_answer	什么是数据可视化的5秒法则？	\N	数据可视化	{"key_points": ["5秒法则：观众应该在5秒内理解图表的核心信息", "原则：1. 简洁明了", "2. 突出重点", "3. 避免冗余信息", "4. 使用适当的颜色和标注"]}	\N	5秒法则是数据可视化的重要原则，强调图表应该快速传达关键信息。	\N	2	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
51	2	short_answer	请说明什么是A/B测试及其在商务分析中的应用。	\N	商务数据分析	{"key_points": ["A/B测试是对比两个版本效果的实验方法", "应用场景：1. 网站设计优化", "2. 营销活动效果评估", "3. 产品功能测试", "4. 用户体验改进"]}	\N	A/B测试是商务分析中常用的实验方法，帮助企业做出数据驱动的决策。	\N	2	t	2026-01-04 06:43:13.628586	2026-01-04 06:43:13.628586
2	2	single_choice	在Python中，哪个库最常用于数据分析和处理？	\N	Python数据采集		\N	pandas是Python中最常用的数据分析库，提供了DataFrame等强大的数据结构。	\N	1	t	2026-01-04 06:43:13.628586	2026-01-05 03:39:38.3864
\.


--
-- Data for Name: question_option; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question_option (id, question_id, option_label, option_text, option_image, is_correct, sort_order, created_at) FROM stdin;
1	1	A	模块路径不在Python的搜索路径中	\N	f	0	2026-01-04 06:30:26.232025
2	1	B	模块oss_client.py中没有定义名为get_oss_client的函数或变量	\N	t	1	2026-01-04 06:30:26.232031
3	1	C	文件oss_client.py的编码格式不正确	\N	f	2	2026-01-04 06:30:26.232032
4	1	D	运行该代码的Python版本过低	\N	f	3	2026-01-04 06:30:26.232033
5	2	A	pandas	\N	t	0	2026-01-05 03:39:38.396515
6	2	B	numpy	\N	f	1	2026-01-05 03:39:38.39652
7	2	C	matplotlib	\N	f	2	2026-01-05 03:39:38.396522
8	2	D	requests	\N	f	3	2026-01-05 03:39:38.396523
\.


--
-- Data for Name: reference_folder; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reference_folder (id, teacher_id, folder_name, parent_id, description, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: reference_material; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reference_material (id, teacher_id, folder_id, resource_name, resource_type, original_filename, file_path, file_size, link_url, knowledge_point, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: resource_folder; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resource_folder (id, teacher_id, folder_name, parent_id, description, is_active, created_at, updated_at) FROM stdin;
1	2	商务数据分析	\N	\N	f	2026-01-02 10:16:30.257965	2026-01-02 10:16:53.962807
2	2	商务数据分析	\N	\N	t	2026-01-02 10:21:15.597761	2026-01-02 10:21:15.597772
3	2	测试文件夹	2	\N	t	2026-01-02 11:34:36.970768	2026-01-02 11:34:36.970775
\.


--
-- Data for Name: semester; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.semester (id, name, start_date, end_date, is_current) FROM stdin;
\.


--
-- Data for Name: student_exam_score; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_exam_score (id, student_id, course_id, exam_paper_id, exam_id, score, total_score, exam_date, is_submitted, created_at) FROM stdin;
\.


--
-- Data for Name: student_learning_assessment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_learning_assessment (id, student_id, answers, open_response, ai_evaluation, llm_config_id, created_at, tags) FROM stdin;
1	90	{"q1": "option_a", "q2": "option_d", "q3": "option_a", "q4": "option_a", "q5": "option_a", "q6": "option_a", "q7": "option_a", "q8": "option_a", "q9": "option_b", "q10": "option_a", "q11": "option_a", "q12": "option_a"}	\N	**致同学的学习偏好分析与发展建议**\n\n同学，你好！\n\n基于你的学习偏好测评结果，我们为你生成了这份个性化的学习报告。这份报告旨在帮助你更清晰地认识自己的学习风格，并在此基础上，将现有习惯转化为持续进步的优势。\n\n**一、 学习习惯与偏好分析**\n\n你展现出一种**高效、务实且目标清晰**的学习风格。你偏好在晚上安静的环境中（如图书馆），进行短时高效（15-30分钟）的学习，这符合深度专注的规律。在学习过程中，你倾向于通过**视频教程快速抓取重点**，并习惯**立即通过练习来巩固新知**，这表明你注重知识的即时应用与转化，是一位“实践型”学习者。你的学习动机直接（完成学分要求），目标明确（所有课程及格），这使你的学习行为具有很强的任务导向性。\n\n**二、 核心学习优势**\n\n1.  **高效的时间管理与专注力**：你能在有限的单位时间内保持高度专注，并选择最安静、干扰最少的环境，这极大提升了学习效率。\n2.  **强大的信息筛选与整合能力**：“快速浏览，抓重点”的节奏表明你擅长从大量信息中快速识别核心内容，这是一种非常宝贵的信息时代学习能力。\n3.  **“学练结合”的实践型思维**：你“立即做练习题”的巩固方式，能有效将短时记忆转化为应用理解，有助于知识的内化，避免“一看就会，一考就废”的情况。\n4.  **提前规划的稳定性**：“提前一周复习”的考试准备方式，显示了你良好的规划意识，避免了临时抱佛脚的压力，为平稳发挥奠定了基础。\n\n**三、 针对性学习建议**\n\n为帮助你更上一层楼，在现有坚实基础上优化学习体验与成果，我们提供以下建议：\n\n1.  **结构化短时学习**：鉴于你偏好短时长学习，建议将晚上的学习时间划分为2-3个专注模块（如：19:30-20:00，20:15-20:45），每个模块专注于一个具体知识点或章节，模块间短暂休息。这能让你“快速掌握”的优势在多个知识点上循环生效。\n2.  **建立“视频-笔记-练习”微循环**：在利用视频教程时，可准备简易的电子或纸质笔记，仅记录最核心的关键词、公式或框架图（抓重点的延伸）。看完一个核心知识点后，暂停视频，立即完成相关练习。这能将你的优势习惯整合成一个更强大的学习闭环。\n3.  **利用反馈，进行微调**：你期望每日反馈，这非常有助于保持方向。建议你每天学习结束时，用几分钟简单回顾：今天掌握最牢的一个点是什么？练习中哪个地方稍有卡顿？这相当于为自己提供即时反馈，用于微调第二天的学习重点。\n4.  **逐步拓展“舒适区”**：在确保主体内容“简单易懂”以建立信心的同时，可以每周尝试为1-2个已掌握的重点知识点，寻找一道略有挑战性的综合题进行拓展练习。这有助于深化理解，并可能为获得超出“及格”的更好成绩埋下种子。\n\n总的来说，你已具备成为一名高效学习者的出色习惯。你的方法务实、高效，且充满个人特色。继续信任并优化这些习惯，同时有意识地进行微小调整，你的学习之路将会更加平稳、自信且富有成果。\n\n祝你学习顺利，不断超越自我设定的目标！\n\n你的教育顾问\n[日期可在此处添加]	6	2026-01-09 08:44:55.022893	\N
2	90	{"q1": "option_a", "q2": "option_d", "q3": "option_a", "q4": "option_a", "q5": "option_a", "q6": "option_a", "q7": "option_a", "q8": "option_a", "q9": "option_b", "q10": "option_a", "q11": "option_a", "q12": "option_a"}	\N	**致同学的学习风格评价与规划报告**\n\n尊敬的同學：\n\n您好！根據您提供的學習偏好測評結果，我們為您進行了專業分析，並制定了本份個性化報告，旨在幫助您更清晰地認識自己的學習模式，並在此基礎上實現高效學習與穩步成長。\n\n**一、 學習習慣與偏好分析**\n您展現出了一套**高效、務實且結構清晰**的學習系統。您偏好在**晚上（19-23點）** 於**安靜的圖書館**進行學習，這表明您善於規劃時間，並能主動選擇有助於深度專注的環境，具備良好的自我管理意識。在學習過程中，您傾向於通過**視頻教程**進行**快速瀏覽、抓取重點**，並喜歡在學習後**立即做練習題**來鞏固知識。這是一種典型的「輸入-快速應用」高效循環模式，說明您注重學習的即時效率和實踐轉化，能夠迅速將理論與實踐相結合。\n\n**二、 核心學習優勢**\n1.  **效率驅動型學習者**：您「抓重點、快掌握」的節奏感，以及「學後即練」的習慣，使您能在單位時間內獲得顯著的學習產出，這在應對多任務和基礎知識積累時是一大優勢。\n2.  **計劃性與穩定性強**：您有固定的學習時段、環境偏好，並採取「提前一周複習」的考試準備策略，這體現了您穩健、有計劃的學習態度，能有效降低臨時抱佛腳的焦慮。\n3.  **明確的自我認知與反饋需求**：您清楚自己偏好「簡單易懂」的入門路徑，並希望獲得**每日反饋**，這說明您注重學習過程的流暢性和可視化的進步軌跡，這有助於您及時調整、保持動力。\n\n**三、 個性化學習建議**\n基於您的優勢與偏好，我們提供以下建議以供參考，旨在幫助您將現有的高效模式發揮得更加出色：\n\n1.  **優化「快速瀏覽」策略**：在觀看視頻教程快速抓取重點時，建議嘗試使用「暫停-摘要」法。每遇到一個核心概念，暫停片刻，用幾句話在筆記中概括要點。這能將被動瀏覽輕度轉化為主動加工，進一步提升重點記憶的牢固度。\n2.  **建立「微目標-每日反饋」系統**：將「所有課程及格」這個大目標，分解為與您15-30分鐘學習時長相匹配的「微目標」（例如：今日掌握某個定理並完成5道相關練習）。每日結束時，簡單復盤微目標完成情況，這既能滿足您對每日反饋的需求，又能積累持續的成就感。\n3.  **將「提前一周複習」系統化**：建議將最後一周的複習時間細分為「知識點回顧（前4天）」和「綜合模擬/錯題重做（後3天）」兩個階段。在回顧階段，可以充分利用您之前做的重點摘要和練習題，進行高效重溫。\n4.  **探索互動的替代形式**：理解您偏好專注內容、減少即時互動。可以考慮利用課程論壇的非即時提問功能，或在積累一定問題後集中尋求解答。這種「非同步互動」既能解決疑惑，又不打斷您習慣的學習流暢性。\n\n總而言之，您已具備成為一名**自主、高效學習者**的堅實基礎。您的學習方式貼合「任務導向」與「效率優先」的原則。請相信，通過有意識地運用和微調上述策略，您不僅能順利達成「所有課程及格」的當前目標，更能為未來應對更複雜的學習挑戰積累寶貴的方法與信心。\n\n祝您學習順利，不斷進步！\n\n您專屬的教育顧問\n[可根據實際情況署名或省略]	6	2026-01-09 08:45:47.731251	\N
3	90	{"q1": "5", "q2": "1", "q3": "4", "q4": "3", "q5": "1", "q6": "2", "q7": "2", "q8": "1", "q9": "4", "q10": "3"}	\N	根据测评结果分析，该学生的学习习惯和偏好呈现出几个明显特点。首先，该学生表现出极强的学习规律性，非常习惯于在固定的时间段进行学习，这有利于建立稳定的学习节奏。\n\n其次，该学生对学习媒介有明确的偏好，比较倾向于通过视频等动态、直观的形式获取新知识，而非传统的文字阅读。同时，其对学习环境有特定要求，在安静的环境中更能保证学习效果。\n\n在学习行为模式上，该学生能够进行中等程度的主动巩固与复习，但在长时间保持专注、做笔记辅助记忆以及制定并执行详细计划方面主动性较弱。此外，该学生更倾向于独立学习，对小组讨论和社交性学习方式兴趣较低，且对学习内容的挑战性追求并不突出。\n\n总体而言，该学生的学习模式呈现出依赖外部结构（固定时间、安静环境）和特定媒介，同时以独立、中等努力程度完成学习任务的特点。	6	2026-01-09 09:33:31.132211	{规律型,视觉偏好,安静环境需求}
\.


--
-- Data for Name: student_learning_behavior; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_learning_behavior (id, student_id, course_id, chapter_id, resource_id, resource_type, behavior_type, duration_seconds, description, created_at) FROM stdin;
1	90	1	\N	12	teaching_resource	view_resource	0	查看资源: Python数据采集教学指南	2026-01-09 09:34:43.221601
2	90	1	\N	12	teaching_resource	view_resource	0	查看资源: Python数据采集教学指南	2026-01-09 10:07:28.634657
3	90	1	2	12	personalized_learning_content	view_personalized_content	13	查看个性化学习内容 (ID: 3)	2026-01-09 12:03:15.655282
4	90	1	2	12	personalized_learning_content	view_personalized_content	81	查看个性化学习内容 (ID: 3)	2026-01-09 12:08:49.15446
\.


--
-- Data for Name: student_learning_profile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_learning_profile (id, student_id, latest_assessment_id, total_assessments, created_at, updated_at) FROM stdin;
1	90	3	3	2026-01-09 08:44:55.056681	2026-01-09 09:33:31.152168
\.


--
-- Data for Name: student_profile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_profile (id, user_id, class_id, major_id, student_no, status) FROM stdin;
54	58	35	34	S20241056	active
53	57	35	34	S20241053	active
4	4	35	34	S2024001	active
5	5	35	34	S2024002	active
13	17	36	34	S20241010	active
14	18	36	34	S20241011	active
16	20	36	34	S20241013	active
17	21	36	34	S20241015	active
20	24	36	34	S20241018	active
21	25	36	34	S20241019	active
25	29	36	34	S20241024	active
26	30	36	34	S20241026	active
29	33	35	34	S20241029	active
39	43	35	34	S20241039	active
42	46	35	34	S20241042	active
46	50	35	34	S20241046	active
52	56	35	34	S20241052	active
58	62	35	34	S20241060	active
59	63	34	1	S20241061	active
63	67	34	1	S20241065	active
65	69	34	1	S20241068	active
69	73	34	1	S20241072	active
73	77	34	1	S20241080	active
74	78	34	1	S20241083	active
76	80	34	1	S20241086	active
77	81	34	1	S20241087	active
79	83	34	1	S20241089	active
80	84	34	1	S20241091	active
82	86	34	1	S20241093	active
83	87	34	1	S20241094	active
84	88	34	1	S20241095	active
86	90	34	1	S20241097	active
87	91	34	1	S20241098	active
88	92	34	1	S20241099	active
85	89	34	1	S20241096	active
81	85	34	1	S20241092	active
78	82	34	1	S20241088	active
75	79	34	1	S20241085	active
72	76	34	1	S20241079	active
71	75	34	1	S20241078	active
70	74	34	1	S20241075	active
68	72	34	1	S20241071	active
67	71	34	1	S20241070	active
66	70	34	1	S20241069	active
64	68	34	1	S20241066	active
62	66	34	1	S20241064	active
61	65	34	1	S20241063	active
60	64	34	1	S20241062	active
57	61	35	34	S20241059	active
56	60	35	34	S20241058	active
55	59	35	34	S20241057	active
51	55	35	34	S20241051	active
50	54	35	34	S20241050	active
49	53	35	34	S20241049	active
48	52	35	34	S20241048	active
47	51	35	34	S20241047	active
45	49	35	34	S20241045	active
44	48	35	34	S20241044	active
43	47	35	34	S20241043	active
41	45	35	34	S20241041	active
40	44	35	34	S20241040	active
38	42	35	34	S20241038	active
37	41	35	34	S20241037	active
36	40	35	34	S20241036	active
35	39	35	34	S20241035	active
34	38	35	34	S20241034	active
33	37	35	34	S20241033	active
32	36	35	34	S20241032	active
31	35	35	34	S20241031	active
30	34	35	34	S20241030	active
28	32	36	34	S20241028	active
27	31	36	34	S20241027	active
24	28	36	34	S20241023	active
23	27	36	34	S20241022	active
22	26	36	34	S20241020	active
19	23	36	34	S20241017	active
18	22	36	34	S20241016	active
15	19	36	34	S20241012	active
12	16	36	34	S20241009	active
11	15	36	34	S20241008	active
10	14	36	34	S20241007	active
9	13	36	34	S20241006	active
8	12	36	34	S20241005	active
7	11	36	34	S20241003	active
6	10	36	34	S20241002	active
\.


--
-- Data for Name: student_study_duration; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_study_duration (id, student_id, course_id, study_date, duration_minutes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sys_class; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sys_class (id, name, major_id, semester, grade, code, is_active, created_at, updated_at) FROM stdin;
34	计算机2501	1	\N	2025	\N	t	2025-12-30 13:40:39.53229	2025-12-30 13:40:39.53229
32	计算机2501	1	\N	2025	\N	f	2025-12-30 13:38:28.939628	2025-12-30 13:40:43.363585
33	计算机2501	1	\N	2025	\N	f	2025-12-30 13:38:50.835615	2025-12-30 13:40:49.900385
36	市场营销2402	34	\N	2024	\N	t	2025-12-31 01:16:24.424442	2025-12-31 01:16:24.424442
35	市场营销2401	34	\N	2024		t	2025-12-31 01:16:08.07459	2025-12-31 01:16:29.432514
\.


--
-- Data for Name: sys_user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sys_user (id, username, hashed_password, full_name, email, role, is_active, avatar, created_at, phone, updated_at) FROM stdin;
1	admin	$2b$12$pVvpQop9o0A0TaXGfiaRmuEs.e..3PGj7wKtaGOrR01YNg6IU9302	System Admin	admin@example.com	admin	t	\N	2025-12-30 05:12:03.051346	\N	2025-12-30 05:31:05.343726
6	testadmin	$2b$12$pVvpQop9o0A0TaXGfiaRmuEs.e..3PGj7wKtaGOrR01YNg6IU9302	测试管理员	testadmin@example.com	admin	t	\N	2025-12-30 05:31:52.868486	\N	2025-12-30 05:31:52.868486
2	张老师	$2b$12$pVvpQop9o0A0TaXGfiaRmuEs.e..3PGj7wKtaGOrR01YNg6IU9302	张老师	teacher1@example.com	teacher	t	\N	2025-12-30 05:12:54.057986	13800138002	2025-12-30 12:18:41.848936
3	李老师	$2b$12$pVvpQop9o0A0TaXGfiaRmuEs.e..3PGj7wKtaGOrR01YNg6IU9302	李老师	teacher2@example.com	teacher	t	\N	2025-12-30 05:12:54.057986	13800138003	2025-12-30 12:18:46.47206
7	王教授	$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyE3H.oqgvIS	\N	wang@example.com	teacher	t	\N	2025-12-30 12:31:29.222569	13900139001	2025-12-30 12:31:29.222569
8	陈博士	$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyE3H.oqgvIS	\N	chen@example.com	teacher	t	\N	2025-12-30 12:31:29.222569	13900139002	2025-12-30 12:31:29.222569
9	刘副教授	$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyE3H.oqgvIS	\N	liu@example.com	teacher	t	\N	2025-12-30 12:31:29.222569	13900139003	2025-12-30 12:31:29.222569
4	student001	$2b$12$pVvpQop9o0A0TaXGfiaRmuEs.e..3PGj7wKtaGOrR01YNg6IU9302	王同学	student1@example.com	student	t	\N	2025-12-30 05:12:54.059978	13800138001	2025-12-31 06:03:33.089642
5	student002	$2b$12$pVvpQop9o0A0TaXGfiaRmuEs.e..3PGj7wKtaGOrR01YNg6IU9302	刘同学	student2@example.com	student	t	\N	2025-12-30 05:12:54.059978	13800138002	2025-12-31 06:23:24.004775
42	student1038	$2b$12$yj918ywm1qHotuxyKCVOq.o79Ei/tIChlncEqkL20sARQwhM2K.06	余丹春梅	student1038@example.com	student	t	\N	2025-12-31 06:26:33.990426	15508898013	2025-12-31 06:30:45.147615
41	student1037	$2b$12$NW9RpsvREGyuBeYVT7dHp.OBib2IXoefZ7ghrXlC7YXRalsAl0rz6	董玉梅涛	student1037@example.com	student	t	\N	2025-12-31 06:26:33.613628	13481452657	2025-12-31 06:30:45.228945
40	student1036	$2b$12$EKyASqYyUGZcZlg0SniB/OiMr9B7M9I3LvREAtqZjQD4nTcp.iOp6	吴燕伟	student1036@example.com	student	t	\N	2025-12-31 06:26:33.226207	13065981463	2025-12-31 06:30:45.311933
39	student1035	$2b$12$0D6zXMmjz94iteMgI3kviu9cjZcvTpsTeiasxkU/HCr7zszWpIpTu	吴芳萍	student1035@example.com	student	t	\N	2025-12-31 06:26:32.852908	16035077600	2025-12-31 06:30:45.396538
38	student1034	$2b$12$V2gk0C7pseA1uYJDfxKvwe9qY9YGM1UyK2vtLYlKJI.27bwHHDt36	梁玉英春梅	student1034@example.com	student	t	\N	2025-12-31 06:26:32.484607	14815800330	2025-12-31 06:30:45.479451
37	student1033	$2b$12$dBdgIpk52fmJ50z3og0RYOdz9rGsisqWt1XX.1UjU7h2LktkFfOBG	朱倩强	student1033@example.com	student	t	\N	2025-12-31 06:26:32.10569	17969463499	2025-12-31 06:30:45.561353
36	student1032	$2b$12$1msDqSB3J.LY1zJtkv4hbuIcKieFExumttNvsubDQMSLdny0njqLm	潘莉娜	student1032@example.com	student	t	\N	2025-12-31 06:26:31.710726	13054859064	2025-12-31 06:30:45.647363
35	student1031	$2b$12$MIrN9Ou6UAO.aUENcoHBVONom5APHkQsjrR0dJG8YdEZT4bPuV61S	李颖燕	student1031@example.com	student	t	\N	2025-12-31 06:26:31.328642	18380920914	2025-12-31 06:30:45.719153
34	student1030	$2b$12$qC4HymziqQ9Fz5CyXgIglO1GnwqfWsLz2tF.Qo22/eTjeM63Ra5ai	徐丽伟	student1030@example.com	student	t	\N	2025-12-31 06:26:30.961657	13305976785	2025-12-31 06:30:45.786532
33	student1029	$2b$12$4UE9ankapw90txhcDfOJe.QbqoMomKvqcGTrHTFvQ/e196xO72b6C	刘晓玉英	student1029@example.com	student	t	\N	2025-12-31 06:26:30.591168	13292520994	2025-12-31 06:30:45.857715
32	student1028	$2b$12$QJxXvxCbZNTbSNj/bKw.iOJBSMPDTuT32trEYVkM/C0.EeVDEDrHu	蒋辰燕	student1028@example.com	student	t	\N	2025-12-31 06:26:30.218474	17924149372	2025-12-31 06:30:45.930346
31	student1027	$2b$12$y6OWxa9Q5HP6df2tuX7Stefm.qf4qayup22x7W4kmPZ2Ya5duNt.e	马刚华	student1027@example.com	student	t	\N	2025-12-31 06:26:29.842761	15768881456	2025-12-31 06:30:46.001748
30	student1026	$2b$12$/cufkl8GZUKkMYDqM0ay3Ot4I/b0rJrd1VqoLCfEiLST/ExSJ4aXa	邓丹晓	student1026@example.com	student	t	\N	2025-12-31 06:26:29.475023	13388800359	2025-12-31 06:30:46.074029
28	student1023	$2b$12$4fgVGuPmT7ihCiRMXcWruOEIXpYLyaMPBJFk4Qh6m6ZP0bBUi0P7u	许强蕾	student1023@example.com	student	t	\N	2025-12-31 06:26:28.601851	13126588411	2025-12-31 06:30:46.240811
27	student1022	$2b$12$uJZiHc7WBhb9QMQW6mB0vu70n7wD5h8U10AoaGUjeh9v2XCLvAIh.	郭晨伟	student1022@example.com	student	t	\N	2025-12-31 06:26:28.229541	13829407115	2025-12-31 06:30:46.315071
26	student1020	$2b$12$gp3yFNXGQTXSiUcdPlOutOP/CHOnRKRYLEdBnPoQ7j/0p0k5rrJ0W	蒋华桂英	student1020@example.com	student	t	\N	2025-12-31 06:26:27.736422	16811768184	2025-12-31 06:30:46.389258
25	student1019	$2b$12$hFbU9a2FErSbhnM4SS37Yuo/oB6Ulyd5Fi6o6qKbwq52gSibAOJZW	黄艳蕾	student1019@example.com	student	t	\N	2025-12-31 06:26:27.36138	17552363890	2025-12-31 06:30:46.457632
24	student1018	$2b$12$6ZPUCVAD4Hn4jwoEm71XQuW7WsIwroT7uHoMzf2SDUYm1M7sz9lQ.	陈素英华	student1018@example.com	student	t	\N	2025-12-31 06:26:26.991659	16893730737	2025-12-31 06:30:46.526779
23	student1017	$2b$12$kTT1jrgtKn9zTFbHlnelVuIMVHXzUL07cSG5lyrRl7Bg4LE/nXAYW	孙莉明	student1017@example.com	student	t	\N	2025-12-31 06:26:26.616172	15944854795	2025-12-31 06:30:46.596505
22	student1016	$2b$12$dAur6fXdg4y6Z1nBSXa3U.2aULOkmFsqT.qkPBMpDNNauJZbtUdRu	罗玉英思	student1016@example.com	student	t	\N	2025-12-31 06:26:26.241851	16796382496	2025-12-31 06:30:46.670116
21	student1015	$2b$12$i6N2xeAH6XJe01uLKSAcPOQ5UhXPGbKLT6PUsP.WJZCce1Tfe7iZ.	赵秀英敏	student1015@example.com	student	t	\N	2025-12-31 06:26:25.870129	14587800922	2025-12-31 06:30:46.788261
20	student1013	$2b$12$9qMhQJmZx7UmYCb3RwTx..AifOmm4CSlTVB63hnFS5ox8XweqoNeG	陈欢明	student1013@example.com	student	t	\N	2025-12-31 06:26:25.386043	13784695666	2025-12-31 06:30:47.377138
19	student1012	$2b$12$DfeJ42kj0EHgKZxMT99WA.Ex.kpcPs2VGPaLjlkcA2j0ngVFzLt0i	杜杰欢	student1012@example.com	student	t	\N	2025-12-31 06:26:24.979313	17145356500	2025-12-31 06:30:47.514971
18	student1011	$2b$12$sg1UQe2DGb/dKdWxKCHs.ePuFJqgz28v3Jk46zJXMQJeWTUfH8s/.	杨思秀英	student1011@example.com	student	t	\N	2025-12-31 06:26:23.83555	14043556187	2025-12-31 06:30:47.606643
17	student1010	$2b$12$OWusS/JXWn02WpPxsBa4Fupur3UYFu48.m8GHUxz7QyRcqIx2NQi6	吕倩玉梅	student1010@example.com	student	t	\N	2025-12-31 06:26:23.419754	16483184153	2025-12-31 06:30:47.677171
16	student1009	$2b$12$NW3sffki6kYVXl0I./GJpu58qZpki383yTxIzuzgeF2O5EB7Bz3gG	彭颖军	student1009@example.com	student	t	\N	2025-12-31 06:26:23.046824	15999571422	2025-12-31 06:30:47.746474
15	student1008	$2b$12$P9f1v.oSpacrAJmnkFgwSO6wh0eeoYO/L2A2L/9Uk8c/xtOsG9Meq	彭文婷	student1008@example.com	student	t	\N	2025-12-31 06:26:22.676749	13263777811	2025-12-31 06:30:47.819124
14	student1007	$2b$12$5ZsDYE/GKvpMmUyeaXvx..a/VAmQEQhIOnVdEFlKSyi2fHwmqQTFy	李芳佳	student1007@example.com	student	t	\N	2025-12-31 06:26:22.305321	16971388287	2025-12-31 06:30:47.891747
13	student1006	$2b$12$4MwtUz9XVatI7I8IHV.Cn.A36ETWO9aryfRW52V98aenOvWVD41ze	田思燕	student1006@example.com	student	t	\N	2025-12-31 06:26:21.926272	17209058337	2025-12-31 06:30:47.962492
12	student1005	$2b$12$d0g1MiinwB8JZDpHOQl5LOglncgNIHLmx0tr9hFRvAmgdx.lfhu5m	姜颖超	student1005@example.com	student	t	\N	2025-12-31 06:26:21.557521	13745925993	2025-12-31 06:30:48.034034
11	student1003	$2b$12$WXTEoc0IBrv9yoi9V538te.1er1RmIAtFEcRRGk.3dGFEW556rcly	罗勇桂英	student1003@example.com	student	t	\N	2025-12-31 06:26:21.052743	14677715865	2025-12-31 06:30:48.107822
10	student1002	$2b$12$9TJnE26MO7fAFPNCMZuPgerkPGFw1qEHXfFBlEXN.gct8Bt1LA0cm	萧欢婷	student1002@example.com	student	t	\N	2025-12-31 06:26:20.676495	15543235601	2025-12-31 06:30:48.185574
84	student1091	$2b$12$VkAGH9EyPCvoDvYn9gqR5ujNNoVKBEzPpmJvSiWzT4xvnGz9fXeC.	邓明丽	student1091@example.com	student	t	\N	2025-12-31 06:26:51.549747	17674971227	2025-12-31 06:30:41.943812
83	student1089	$2b$12$2ymyZ.oawncLYxV82rkVzuTxz4q3DqwWMygVw5V/DGSHM42g246Nq	徐秀英辰	student1089@example.com	student	t	\N	2025-12-31 06:26:51.056792	17452492722	2025-12-31 06:30:42.016057
82	student1088	$2b$12$J8cellXpf0dVHZS5nqfnHupNxudxSE71Tp9EJrwwKgwQB02t1E5qy	高琳颖	student1088@example.com	student	t	\N	2025-12-31 06:26:50.679079	14742808482	2025-12-31 06:30:42.091844
81	student1087	$2b$12$82lXcAw5syZ0blQAGfAxfO7cFZAJIbQvxp9l6gUkKU3PWMQ3rp2Qy	高玉英颖	student1087@example.com	student	t	\N	2025-12-31 06:26:50.30593	18111017186	2025-12-31 06:30:42.162717
80	student1086	$2b$12$S2FQVk./rsMHf/Dp2VKaOevw6d73WWYh9M5xzUGOt3snVM9ga24HO	吴玉兰琳	student1086@example.com	student	t	\N	2025-12-31 06:26:49.878927	18697280026	2025-12-31 06:30:42.233266
79	student1085	$2b$12$nDl61IkRs2LTAAiPpYTyaeuMCeJCTFeh2HrjJHEi4keso.ud2vYvC	杨瑶思	student1085@example.com	student	t	\N	2025-12-31 06:26:49.361692	16915579879	2025-12-31 06:30:42.304523
78	student1083	$2b$12$.ORG9XTQeG2e3NjNcvMUfu9H4KjsHTPjX8OKsOaEjWfaaIfjJ.7fG	韩强玉梅	student1083@example.com	student	t	\N	2025-12-31 06:26:48.79949	16504552257	2025-12-31 06:30:42.380002
77	student1080	$2b$12$yS59Y3x0jPVUhgujFoo6tuogaFDRz4xGUCdYZzA4m02QY/DFOWMvm	马萍莉	student1080@example.com	student	t	\N	2025-12-31 06:26:48.173096	14320404099	2025-12-31 06:30:42.455726
76	student1079	$2b$12$cZElSnPmEIeTefzAFfzw1.I1uFwn9eSZz6/.qQkYVTYJRXVHNM5Ey	蒋欢晨	student1079@example.com	student	t	\N	2025-12-31 06:26:47.792937	16924662623	2025-12-31 06:30:42.533981
75	student1078	$2b$12$lcim.7A99m3vC6Axs1BnUeuN6H7z7EkmQZ39sDx/bCPws8EUNdb1W	潘军颖	student1078@example.com	student	t	\N	2025-12-31 06:26:47.421137	18428964293	2025-12-31 06:30:42.612088
74	student1075	$2b$12$Lj60/EfBKqqqK5j6VonnXeVQlBeCWGQHndRDT8Ck5IH1PefwJXbge	曾辰辰	student1075@example.com	student	t	\N	2025-12-31 06:26:46.802432	14432962869	2025-12-31 06:30:42.69825
73	student1072	$2b$12$apjc.SeIDM4TmD1TlJYHH.4z7.iRQ9LKf9V318DJ86ITg.8P/vfMO	王欢洋	student1072@example.com	student	t	\N	2025-12-31 06:26:46.184109	14479278206	2025-12-31 06:30:42.766796
72	student1071	$2b$12$0hBlTiHSvCY5POxbV7lnEukhaVkWJiDlg1cqYzP5ut20hC7sWWs/u	魏琳娜	student1071@example.com	student	t	\N	2025-12-31 06:26:45.815309	17045446507	2025-12-31 06:30:42.838974
71	student1070	$2b$12$S35LHnO/Vtsc7sgesNIohukDtm30TmSqwP9GjkVHpdKW2Uay2tTQS	曾璐璐	student1070@example.com	student	t	\N	2025-12-31 06:26:45.442619	17450611963	2025-12-31 06:30:42.916698
70	student1069	$2b$12$RqUDLBnHI03E5KH754lAReayNzqPP2pMzguRnKtgBlQl.mRROMsLu	郭素英静	student1069@example.com	student	t	\N	2025-12-31 06:26:45.069973	16925210810	2025-12-31 06:30:42.996618
69	student1068	$2b$12$n9QTSh.zKumyjoMkYhTPpOslblbiSb2tbbwGXeggY.sBKL/YvZ75K	程琳旭	student1068@example.com	student	t	\N	2025-12-31 06:26:44.707841	17127715923	2025-12-31 06:30:43.076338
68	student1066	$2b$12$9m5uoi3Rnts9.dOMfYgoa.bG7.Dfn3iZQbW0XoYB9Jt7rM47UDnH6	胡莉平	student1066@example.com	student	t	\N	2025-12-31 06:26:44.205211	15764760292	2025-12-31 06:30:43.150381
67	student1065	$2b$12$0qGBCkQIToHi2VXGBwcQ5eEHinOXvMNRNp/jhaDteKizMCoNvFYxO	张思明	student1065@example.com	student	t	\N	2025-12-31 06:26:43.813754	14440491415	2025-12-31 06:30:43.229059
66	student1064	$2b$12$10f7p6Ey/CgWp7LqqWvDXu7jSQV0lBftYg8q8pIJ63AB4BJtaL1i.	韩金凤晨	student1064@example.com	student	t	\N	2025-12-31 06:26:43.255	13271942999	2025-12-31 06:30:43.306444
65	student1063	$2b$12$S3qbL5r9nFD2m/1xTpRuAubU0ABCNYh3YZaY/cPYjDSUzeGV2ewf.	徐璐晓	student1063@example.com	student	t	\N	2025-12-31 06:26:42.868429	14900390122	2025-12-31 06:30:43.384262
64	student1062	$2b$12$.JFuA6jUFTcdnocay1srVeXrR95E9pqeU3ovmnULAfxUzMtz1P60W	何玉兰婷	student1062@example.com	student	t	\N	2025-12-31 06:26:42.493454	15123313450	2025-12-31 06:30:43.464071
63	student1061	$2b$12$uOWW9lQBMg7nnZunqocQy.l6blHyqiaFUkgO4WdTMstJARohoXcmO	何静玉英	student1061@example.com	student	t	\N	2025-12-31 06:26:42.127814	13498368452	2025-12-31 06:30:43.542377
62	student1060	$2b$12$qrBka0tjRrsm2p5r8ldtV.AQn/zuW/FYnUUU0w1y0psgFFT2/HEtu	苏伟晨	student1060@example.com	student	t	\N	2025-12-31 06:26:41.748613	18556943376	2025-12-31 06:30:43.617492
61	student1059	$2b$12$MJggTVbuEFB6qQ278PCcd.StPUe7/08ejg155qQIZ7ijUZ4K18OIy	萧勇晓	student1059@example.com	student	t	\N	2025-12-31 06:26:41.376529	14089442465	2025-12-31 06:30:43.691045
60	student1058	$2b$12$1UqFqeSrYEAgDfRPmZtee.oYvSx/hEaJgyr7hJDEa3luizkPLKGwS	苏娜磊	student1058@example.com	student	t	\N	2025-12-31 06:26:41.002298	15182108239	2025-12-31 06:30:43.768263
59	student1057	$2b$12$xZNMJ.70XlFSfCvbF9nKgeruGejCGSSEHPp42O3fuI9T2/L9oDMa6	许倩华	student1057@example.com	student	t	\N	2025-12-31 06:26:40.630186	15689907329	2025-12-31 06:30:43.841821
58	student1056	$2b$12$Q6Ycvm/ntpWdYps6uedrkeZEOXqe4f.er3wkvBNdVmghvyy/dEzOy	袁莉素英	student1056@example.com	student	t	\N	2025-12-31 06:26:40.253121	16471116491	2025-12-31 06:30:43.912783
57	student1053	$2b$12$PobAQsxV3NXCPBDRMf7x5.q3AKDublxayS/xWqLF7IFgKhblz./iy	冯雪秀英	student1053@example.com	student	t	\N	2025-12-31 06:26:39.640771	14287538150	2025-12-31 06:30:44.009633
56	student1052	$2b$12$fjV1Y9GOaGlOIJsYIR40B.HBR6JNuhEYB8sqL6gDfBxrI2WMYjtqK	吴勇蕾	student1052@example.com	student	t	\N	2025-12-31 06:26:39.202393	14021990897	2025-12-31 06:30:44.086374
55	student1051	$2b$12$b/FykBHgEvM3WG5JIDo94efQpmJIVusz/b2lygwaGMuA91QYuN5JC	宋金凤燕	student1051@example.com	student	t	\N	2025-12-31 06:26:38.831722	17701914583	2025-12-31 06:30:44.164833
54	student1050	$2b$12$ufQYN.cFeg5HIvDFmXTxH.amWE.Vf87C5JCKsvHsXjXRUgMhGYqK.	刘玉兰萍	student1050@example.com	student	t	\N	2025-12-31 06:26:38.462761	16864675896	2025-12-31 06:30:44.247329
53	student1049	$2b$12$xO5vKRRvANmF8Daux.lf1OHg3Tp52caUFArkvAXcT0Zl3MkVIOO.m	蒋军琳	student1049@example.com	student	t	\N	2025-12-31 06:26:38.090811	14098079422	2025-12-31 06:30:44.323639
52	student1048	$2b$12$bGtgOlYe9JSSO/UVWH.pouK30NduWzcvdWV.RSQxNp1v04.Ee9I5.	董佳玉兰	student1048@example.com	student	t	\N	2025-12-31 06:26:37.719112	16242009318	2025-12-31 06:30:44.396756
51	student1047	$2b$12$xQvfS9400sBI8D9JKFC/xeLCfuAQAWlD.VWMwH0U3vgROvcfq/wsK	袁洋玉梅	student1047@example.com	student	t	\N	2025-12-31 06:26:37.345498	17392776997	2025-12-31 06:30:44.471906
50	student1046	$2b$12$glZZef87cq0XXIthOY70iulZx/Ch6ZgfWDC69quXjqjYnqMthqO/a	蔡宇思	student1046@example.com	student	t	\N	2025-12-31 06:26:36.969269	16280118536	2025-12-31 06:30:44.550304
49	student1045	$2b$12$0pX3u/F74YWPsePAz1GZa.cahjR0sXmdAgLzz8eUIZPev9BgsHb4O	周伟璐	student1045@example.com	student	t	\N	2025-12-31 06:26:36.594688	18030089259	2025-12-31 06:30:44.625581
48	student1044	$2b$12$mWxHW7WuryvwgLriqpaTdOFOUVUbh98fyicewZEZyUh/S9T7kdsrC	许超晨	student1044@example.com	student	t	\N	2025-12-31 06:26:36.222056	16687016048	2025-12-31 06:30:44.703395
47	student1043	$2b$12$DSyJ4Ys3t7OXUuKKxcgmaOde80jXHkSgblHuatGHEjiP6IGesW3i6	陈晓璐	student1043@example.com	student	t	\N	2025-12-31 06:26:35.854776	13744779502	2025-12-31 06:30:44.78027
46	student1042	$2b$12$wF2y6FvDPsiUjpt7ycZ8.ea/Ukij9QRL3jUOmxT3sww6U5zABJOv2	孙芳伟	student1042@example.com	student	t	\N	2025-12-31 06:26:35.484706	13083779186	2025-12-31 06:30:44.859744
45	student1041	$2b$12$1W5FLEqCBDA5R1tjgwcme.ddcTWs121wsxpyhUWmhrnCBMmCRsf0u	冯萍琳	student1041@example.com	student	t	\N	2025-12-31 06:26:35.10683	13501688803	2025-12-31 06:30:44.933894
92	student1099	$2b$12$SRYn3fnQUEqkDzS.s8Hy4eBJ6V/90eCov50634u73q6j6E08FlpXG	袁宇宇	student1099@example.com	student	t	\N	2025-12-31 06:26:55.12476	15617513986	2025-12-31 06:30:41.359115
91	student1098	$2b$12$5Uk4OYmfpmZ.2ZTGi/uZFeVwu2mZzcmTWO.YwnQtWVLKRcWoaQgwq	曾伟素英	student1098@example.com	student	t	\N	2025-12-31 06:26:54.751858	15372738400	2025-12-31 06:30:41.441599
89	student1096	$2b$12$l8/He/C2PM.umyViDQlmceliXugR8wnQumj05Tfn057cYkOyQTrkO	魏欢艳	student1096@example.com	student	t	\N	2025-12-31 06:26:53.981332	14308496783	2025-12-31 06:30:41.58264
88	student1095	$2b$12$/iv9gIryvGPjq1bqdoejxu08EMocOYc2y1GHJsMDMWsjs85i4L6NS	姜莉超	student1095@example.com	student	t	\N	2025-12-31 06:26:53.466822	13789381995	2025-12-31 06:30:41.655645
87	student1094	$2b$12$v6p2jobmlhPjQVXY9KunCO6gJGBySD97HY.98dGEzSIOpjAKODJPm	王旭莉	student1094@example.com	student	t	\N	2025-12-31 06:26:52.829768	15080702929	2025-12-31 06:30:41.72683
86	student1093	$2b$12$AqDU110IAHcUKiyQLG6Q7uAouZ31WivvRvnVivKmTuisbw.R0WNQG	徐颖文	student1093@example.com	student	t	\N	2025-12-31 06:26:52.360622	14146939995	2025-12-31 06:30:41.800022
85	student1092	$2b$12$rXMR1nT./YOcA/bvihD2hOXKSmkWGhWiYb3VXjBjFrDS2skFKqNwm	田辰玉英	student1092@example.com	student	t	\N	2025-12-31 06:26:51.919545	15537474984	2025-12-31 06:30:41.870892
44	student1040	$2b$12$29wrly/qzOlGwBgbKr4JYuMsK0W9KVAfDU.w6uqk8lspPUFspMELm	孙璐艳	student1040@example.com	student	t	\N	2025-12-31 06:26:34.744169	18144434840	2025-12-31 06:30:45.00267
43	student1039	$2b$12$k5DTvsYgnm3pPqm18GCuEO8I8g1/gP17YM6OyQWlFLHHOqvvOrVfi	吕敏婷	student1039@example.com	student	t	\N	2025-12-31 06:26:34.374362	16448784176	2025-12-31 06:30:45.073575
29	student1024	$2b$12$o.HaHAabUpD794DQNEzo5OautPin1lDtRsTP3.a.B2DTVVslaJMvy	蒋秀兰燕	student1024@example.com	student	t	\N	2025-12-31 06:26:28.974919	13788659193	2025-12-31 06:30:46.166658
90	student1097	$2b$12$SgfN19IroClRuqCIf9UAfe.2OhQqqt2FbQgxRPv/E4.AxiKAAoPvO	郭刚辰	student1097@example.com	student	t	\N	2025-12-31 06:26:54.375298	17619956410	2026-01-07 07:11:05.75682
\.


--
-- Data for Name: teacher_profile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teacher_profile (id, user_id, major_id, title, intro) FROM stdin;
1	2	1	\N	\N
2	3	1	\N	\N
\.


--
-- Data for Name: teaching_resource; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teaching_resource (id, teacher_id, resource_name, original_filename, file_path, local_file_path, file_size, resource_type, pdf_path, pdf_local_path, pdf_converted_at, pdf_conversion_status, knowledge_point, folder_id, is_active, created_at, updated_at) FROM stdin;
1	2	test	test.xlsx	uploads/teaching_resources/excel/3067c1cd-dc17-4534-9179-3873143fa894.xlsx	uploads/teaching_resources/excel/3067c1cd-dc17-4534-9179-3873143fa894.xlsx	13	excel	/Users/duanxiaofei/Desktop/数珩智学/backend/uploads/teaching_resources/pdfs/excel/3067c1cd-dc17-4534-9179-3873143fa894.pdf	/Users/duanxiaofei/Desktop/数珩智学/backend/uploads/teaching_resources/pdfs/excel/3067c1cd-dc17-4534-9179-3873143fa894.pdf	2026-01-02 11:16:44.957329	success	\N	\N	f	2026-01-02 11:16:44.961866	2026-01-02 11:19:36.890533
4	2	01-信用卡营销：案例原文 2	01-信用卡营销：案例原文 .pdf	uploads/teaching_resources/pdf/e02ceecf-7418-46c2-8e7a-5a5eb67ca0ef.pdf	uploads/teaching_resources/pdf/e02ceecf-7418-46c2-8e7a-5a5eb67ca0ef.pdf	317636	pdf	\N	\N	\N	pending	Python数据采集	\N	f	2026-01-02 11:21:39.001814	2026-01-02 11:27:21.971411
6	2	北京OSS测试	test_beijing.xlsx	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/excel/d37cb2e0-5108-4528-8004-4dcfdb66dd84.xlsx	uploads/teaching_resources/excel/d37cb2e0-5108-4528-8004-4dcfdb66dd84.xlsx	13	excel	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/pdfs/excel/d37cb2e0-5108-4528-8004-4dcfdb66dd84.pdf	/Users/duanxiaofei/Desktop/数珩智学/backend/uploads/teaching_resources/pdfs/excel/d37cb2e0-5108-4528-8004-4dcfdb66dd84.pdf	2026-01-02 11:27:07.535594	success	\N	\N	f	2026-01-02 11:27:07.645127	2026-01-02 11:27:24.745012
5	2	OSS测试Excel	test_oss.xlsx	uploads/teaching_resources/excel/c787c44c-dfae-4cb8-9567-55d87a5f7992.xlsx	uploads/teaching_resources/excel/c787c44c-dfae-4cb8-9567-55d87a5f7992.xlsx	7	excel	/Users/duanxiaofei/Desktop/数珩智学/backend/uploads/teaching_resources/pdfs/excel/c787c44c-dfae-4cb8-9567-55d87a5f7992.pdf	/Users/duanxiaofei/Desktop/数珩智学/backend/uploads/teaching_resources/pdfs/excel/c787c44c-dfae-4cb8-9567-55d87a5f7992.pdf	2026-01-02 11:25:18.030666	success	\N	\N	f	2026-01-02 11:25:18.1396	2026-01-02 11:27:26.991245
3	2	01-信用卡营销：案例原文 	01-信用卡营销：案例原文 .docx	uploads/teaching_resources/word/80529e0b-9fd7-4cdf-9bae-38c9bfee663b.docx	uploads/teaching_resources/word/80529e0b-9fd7-4cdf-9bae-38c9bfee663b.docx	57682	word	/Users/duanxiaofei/Desktop/数珩智学/backend/uploads/teaching_resources/pdfs/word/80529e0b-9fd7-4cdf-9bae-38c9bfee663b.pdf	/Users/duanxiaofei/Desktop/数珩智学/backend/uploads/teaching_resources/pdfs/word/80529e0b-9fd7-4cdf-9bae-38c9bfee663b.pdf	2026-01-02 11:20:58.964072	success	Python数据采集	\N	f	2026-01-02 11:20:58.968094	2026-01-02 11:27:29.38759
2	2	config_table	config_table.xlsx	uploads/teaching_resources/excel/763956b5-08c5-4c2a-bc84-ba78082cb1c3.xlsx	uploads/teaching_resources/excel/763956b5-08c5-4c2a-bc84-ba78082cb1c3.xlsx	5375	excel	/Users/duanxiaofei/Desktop/数珩智学/backend/uploads/teaching_resources/pdfs/excel/763956b5-08c5-4c2a-bc84-ba78082cb1c3.pdf	/Users/duanxiaofei/Desktop/数珩智学/backend/uploads/teaching_resources/pdfs/excel/763956b5-08c5-4c2a-bc84-ba78082cb1c3.pdf	2026-01-02 11:19:55.091203	success	Python数据采集	\N	f	2026-01-02 11:19:55.095178	2026-01-02 11:27:33.984186
8	2	01-信用卡营销：案例原文 .docx	01-信用卡营销：案例原文 .docx	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/word/c5d4c79a-3d43-4a39-aee1-ac23a555d867.docx	uploads/teaching_resources/word/c5d4c79a-3d43-4a39-aee1-ac23a555d867.docx	57682	word	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/pdfs/word/c5d4c79a-3d43-4a39-aee1-ac23a555d867.pdf	/Users/duanxiaofei/Desktop/数珩智学/backend/uploads/teaching_resources/pdfs/word/c5d4c79a-3d43-4a39-aee1-ac23a555d867.pdf	2026-01-02 12:37:35.208569	success	\N	\N	t	2026-01-02 12:37:35.218426	2026-01-02 12:37:35.218432
9	2	config_table.xlsx	config_table.xlsx	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/excel/7f4d564e-4588-4694-be0d-dc11e69fac52.xlsx	uploads/teaching_resources/excel/7f4d564e-4588-4694-be0d-dc11e69fac52.xlsx	5375	excel	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/pdfs/excel/7f4d564e-4588-4694-be0d-dc11e69fac52.pdf	/Users/duanxiaofei/Desktop/数珩智学/backend/uploads/teaching_resources/pdfs/excel/7f4d564e-4588-4694-be0d-dc11e69fac52.pdf	2026-01-02 12:37:56.890315	success	\N	\N	t	2026-01-02 12:37:56.900041	2026-01-02 12:37:56.900047
10	2	iShot_2026-01-02_17.59.02.png	iShot_2026-01-02_17.59.02.png	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/image/4b6eb50c-a855-4b75-ab2a-d0bb7d561b77.png	uploads/teaching_resources/image/4b6eb50c-a855-4b75-ab2a-d0bb7d561b77.png	258721	image	\N	\N	\N	pending	\N	\N	t	2026-01-02 12:38:16.602776	2026-01-02 12:38:16.602779
7	2	01-信用卡营销：案例原文 	01-信用卡营销：案例原文 .pdf	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/pdf/739d3d10-e87a-460f-b18b-d8f947265592.pdf	uploads/teaching_resources/pdf/739d3d10-e87a-460f-b18b-d8f947265592.pdf	317636	pdf	\N	\N	\N	pending	Python数据采集	2	t	2026-01-02 11:27:47.58941	2026-01-04 01:06:17.043409
11	2	3-理解数据.docx	3-理解数据.docx	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/word/1fe87e50-3791-4006-ae80-1fb7d95ec67a.docx	uploads/teaching_resources/word/1fe87e50-3791-4006-ae80-1fb7d95ec67a.docx	785411	word	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/pdfs/word/1fe87e50-3791-4006-ae80-1fb7d95ec67a.pdf	/Users/duanxiaofei/Desktop/数珩智学/backend/uploads/teaching_resources/pdfs/word/1fe87e50-3791-4006-ae80-1fb7d95ec67a.pdf	2026-01-04 01:18:45.595289	success	数据清洗	2	t	2026-01-04 01:18:45.605623	2026-01-04 01:18:45.605633
12	2	Python数据采集教学指南	Python数据采集教学指南.docx	ai-creation/2/6ff2d171579e43a3a2920d01fbbfb0a9_Python数据采集教学指南.docx	\N	43255	word	\N	\N	\N	pending	Python数据采集	2	t	2026-01-04 06:24:33.700868	2026-01-04 06:24:33.700879
\.


--
-- Name: ai_quiz_record_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ai_quiz_record_id_seq', 7, true);


--
-- Name: class_course_relation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.class_course_relation_id_seq', 1, true);


--
-- Name: course_chapter_exam_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_chapter_exam_id_seq', 2, true);


--
-- Name: course_chapter_exam_paper_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_chapter_exam_paper_id_seq', 2, true);


--
-- Name: course_chapter_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_chapter_id_seq', 3, true);


--
-- Name: course_chapter_knowledge_graph_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_chapter_knowledge_graph_id_seq', 7, true);


--
-- Name: course_chapter_learning_rule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_chapter_learning_rule_id_seq', 1, true);


--
-- Name: course_cover_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_cover_id_seq', 2, true);


--
-- Name: course_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_id_seq', 1, true);


--
-- Name: course_resource_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_resource_id_seq', 1, false);


--
-- Name: course_section_homework_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_section_homework_id_seq', 1, false);


--
-- Name: course_section_resource_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_section_resource_id_seq', 1, true);


--
-- Name: dictionary_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dictionary_item_id_seq', 24, true);


--
-- Name: dictionary_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dictionary_type_id_seq', 3, true);


--
-- Name: enrollment_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.enrollment_order_id_seq', 1, false);


--
-- Name: exam_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.exam_id_seq', 2, true);


--
-- Name: exam_paper_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.exam_paper_id_seq', 4, true);


--
-- Name: exam_paper_question_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.exam_paper_question_id_seq', 32, true);


--
-- Name: exam_student_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.exam_student_id_seq', 1, false);


--
-- Name: knowledge_graph_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.knowledge_graph_id_seq', 1, true);


--
-- Name: knowledge_node_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.knowledge_node_id_seq', 14, true);


--
-- Name: llm_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.llm_config_id_seq', 6, true);


--
-- Name: major_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.major_id_seq', 34, true);


--
-- Name: organization_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.organization_id_seq', 256, true);


--
-- Name: personalized_learning_content_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.personalized_learning_content_id_seq', 3, true);


--
-- Name: question_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.question_id_seq', 51, true);


--
-- Name: question_option_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.question_option_id_seq', 8, true);


--
-- Name: reference_folder_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reference_folder_id_seq', 1, false);


--
-- Name: reference_material_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reference_material_id_seq', 1, false);


--
-- Name: resource_folder_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resource_folder_id_seq', 3, true);


--
-- Name: semester_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.semester_id_seq', 1, false);


--
-- Name: student_exam_score_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_exam_score_id_seq', 1, false);


--
-- Name: student_learning_assessment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_learning_assessment_id_seq', 3, true);


--
-- Name: student_learning_behavior_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_learning_behavior_id_seq', 4, true);


--
-- Name: student_learning_profile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_learning_profile_id_seq', 1, true);


--
-- Name: student_profile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_profile_id_seq', 88, true);


--
-- Name: student_study_duration_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_study_duration_id_seq', 1, false);


--
-- Name: sys_class_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sys_class_id_seq', 36, true);


--
-- Name: sys_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sys_user_id_seq', 92, true);


--
-- Name: teacher_profile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.teacher_profile_id_seq', 2, true);


--
-- Name: teaching_resource_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.teaching_resource_id_seq', 12, true);


--
-- Name: ai_quiz_record ai_quiz_record_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_quiz_record
    ADD CONSTRAINT ai_quiz_record_pkey PRIMARY KEY (id);


--
-- Name: class_course_relation class_course_relation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_course_relation
    ADD CONSTRAINT class_course_relation_pkey PRIMARY KEY (id);


--
-- Name: course_chapter_exam_paper course_chapter_exam_paper_chapter_id_exam_paper_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter_exam_paper
    ADD CONSTRAINT course_chapter_exam_paper_chapter_id_exam_paper_id_key UNIQUE (chapter_id, exam_paper_id);


--
-- Name: course_chapter_exam_paper course_chapter_exam_paper_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter_exam_paper
    ADD CONSTRAINT course_chapter_exam_paper_pkey PRIMARY KEY (id);


--
-- Name: course_chapter_exam course_chapter_exam_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter_exam
    ADD CONSTRAINT course_chapter_exam_pkey PRIMARY KEY (id);


--
-- Name: course_chapter_knowledge_graph course_chapter_knowledge_graph_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter_knowledge_graph
    ADD CONSTRAINT course_chapter_knowledge_graph_pkey PRIMARY KEY (id);


--
-- Name: course_chapter_learning_rule course_chapter_learning_rule_chapter_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter_learning_rule
    ADD CONSTRAINT course_chapter_learning_rule_chapter_id_key UNIQUE (chapter_id);


--
-- Name: course_chapter_learning_rule course_chapter_learning_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter_learning_rule
    ADD CONSTRAINT course_chapter_learning_rule_pkey PRIMARY KEY (id);


--
-- Name: course_chapter course_chapter_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter
    ADD CONSTRAINT course_chapter_pkey PRIMARY KEY (id);


--
-- Name: course course_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course
    ADD CONSTRAINT course_code_key UNIQUE (code);


--
-- Name: course_cover course_cover_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_cover
    ADD CONSTRAINT course_cover_pkey PRIMARY KEY (id);


--
-- Name: course course_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course
    ADD CONSTRAINT course_pkey PRIMARY KEY (id);


--
-- Name: course_resource course_resource_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_resource
    ADD CONSTRAINT course_resource_pkey PRIMARY KEY (id);


--
-- Name: course_section_homework course_section_homework_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_section_homework
    ADD CONSTRAINT course_section_homework_pkey PRIMARY KEY (id);


--
-- Name: course_section_resource course_section_resource_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_section_resource
    ADD CONSTRAINT course_section_resource_pkey PRIMARY KEY (id);


--
-- Name: dictionary_item dictionary_item_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dictionary_item
    ADD CONSTRAINT dictionary_item_pkey PRIMARY KEY (id);


--
-- Name: dictionary_type dictionary_type_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dictionary_type
    ADD CONSTRAINT dictionary_type_code_key UNIQUE (code);


--
-- Name: dictionary_type dictionary_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dictionary_type
    ADD CONSTRAINT dictionary_type_pkey PRIMARY KEY (id);


--
-- Name: enrollment_order enrollment_order_order_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollment_order
    ADD CONSTRAINT enrollment_order_order_no_key UNIQUE (order_no);


--
-- Name: enrollment_order enrollment_order_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollment_order
    ADD CONSTRAINT enrollment_order_pkey PRIMARY KEY (id);


--
-- Name: exam_paper exam_paper_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_paper
    ADD CONSTRAINT exam_paper_pkey PRIMARY KEY (id);


--
-- Name: exam_paper_question exam_paper_question_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_paper_question
    ADD CONSTRAINT exam_paper_question_pkey PRIMARY KEY (id);


--
-- Name: exam exam_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam
    ADD CONSTRAINT exam_pkey PRIMARY KEY (id);


--
-- Name: exam_student exam_student_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_student
    ADD CONSTRAINT exam_student_pkey PRIMARY KEY (id);


--
-- Name: knowledge_graph knowledge_graph_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_graph
    ADD CONSTRAINT knowledge_graph_pkey PRIMARY KEY (id);


--
-- Name: knowledge_node knowledge_node_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_node
    ADD CONSTRAINT knowledge_node_pkey PRIMARY KEY (id);


--
-- Name: llm_config llm_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.llm_config
    ADD CONSTRAINT llm_config_pkey PRIMARY KEY (id);


--
-- Name: llm_config llm_config_provider_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.llm_config
    ADD CONSTRAINT llm_config_provider_key_key UNIQUE (provider_key);


--
-- Name: major major_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.major
    ADD CONSTRAINT major_code_key UNIQUE (code);


--
-- Name: major major_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.major
    ADD CONSTRAINT major_pkey PRIMARY KEY (id);


--
-- Name: organization organization_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization
    ADD CONSTRAINT organization_code_key UNIQUE (code);


--
-- Name: organization organization_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);


--
-- Name: personalized_learning_content personalized_learning_content_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personalized_learning_content
    ADD CONSTRAINT personalized_learning_content_pkey PRIMARY KEY (id);


--
-- Name: question_option question_option_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_option
    ADD CONSTRAINT question_option_pkey PRIMARY KEY (id);


--
-- Name: question question_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question
    ADD CONSTRAINT question_pkey PRIMARY KEY (id);


--
-- Name: reference_folder reference_folder_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reference_folder
    ADD CONSTRAINT reference_folder_pkey PRIMARY KEY (id);


--
-- Name: reference_material reference_material_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reference_material
    ADD CONSTRAINT reference_material_pkey PRIMARY KEY (id);


--
-- Name: resource_folder resource_folder_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_folder
    ADD CONSTRAINT resource_folder_pkey PRIMARY KEY (id);


--
-- Name: semester semester_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.semester
    ADD CONSTRAINT semester_pkey PRIMARY KEY (id);


--
-- Name: student_exam_score student_exam_score_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_exam_score
    ADD CONSTRAINT student_exam_score_pkey PRIMARY KEY (id);


--
-- Name: student_learning_assessment student_learning_assessment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_learning_assessment
    ADD CONSTRAINT student_learning_assessment_pkey PRIMARY KEY (id);


--
-- Name: student_learning_behavior student_learning_behavior_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_learning_behavior
    ADD CONSTRAINT student_learning_behavior_pkey PRIMARY KEY (id);


--
-- Name: student_learning_profile student_learning_profile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_learning_profile
    ADD CONSTRAINT student_learning_profile_pkey PRIMARY KEY (id);


--
-- Name: student_profile student_profile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_profile
    ADD CONSTRAINT student_profile_pkey PRIMARY KEY (id);


--
-- Name: student_profile student_profile_student_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_profile
    ADD CONSTRAINT student_profile_student_no_key UNIQUE (student_no);


--
-- Name: student_study_duration student_study_duration_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_study_duration
    ADD CONSTRAINT student_study_duration_pkey PRIMARY KEY (id);


--
-- Name: sys_class sys_class_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_class
    ADD CONSTRAINT sys_class_pkey PRIMARY KEY (id);


--
-- Name: sys_user sys_user_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_user
    ADD CONSTRAINT sys_user_email_key UNIQUE (email);


--
-- Name: sys_user sys_user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_user
    ADD CONSTRAINT sys_user_pkey PRIMARY KEY (id);


--
-- Name: sys_user sys_user_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_user
    ADD CONSTRAINT sys_user_username_key UNIQUE (username);


--
-- Name: teacher_profile teacher_profile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_profile
    ADD CONSTRAINT teacher_profile_pkey PRIMARY KEY (id);


--
-- Name: teaching_resource teaching_resource_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teaching_resource
    ADD CONSTRAINT teaching_resource_pkey PRIMARY KEY (id);


--
-- Name: personalized_learning_content unique_student_resource_version; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personalized_learning_content
    ADD CONSTRAINT unique_student_resource_version UNIQUE (student_id, resource_id, created_at);


--
-- Name: course_chapter_exam uq_chapter_exam; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter_exam
    ADD CONSTRAINT uq_chapter_exam UNIQUE (chapter_id, exam_id);


--
-- Name: course_chapter_knowledge_graph uq_chapter_knowledge_graph; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter_knowledge_graph
    ADD CONSTRAINT uq_chapter_knowledge_graph UNIQUE (chapter_id);


--
-- Name: student_learning_profile uq_student_profile; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_learning_profile
    ADD CONSTRAINT uq_student_profile UNIQUE (student_id);


--
-- Name: idx_assessment_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assessment_created ON public.student_learning_assessment USING btree (created_at DESC);


--
-- Name: idx_assessment_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assessment_student ON public.student_learning_assessment USING btree (student_id);


--
-- Name: idx_chapter_kg_chapter; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chapter_kg_chapter ON public.course_chapter_knowledge_graph USING btree (chapter_id);


--
-- Name: idx_chapter_kg_graph; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chapter_kg_graph ON public.course_chapter_knowledge_graph USING btree (knowledge_graph_id);


--
-- Name: idx_chapter_kg_node; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chapter_kg_node ON public.course_chapter_knowledge_graph USING btree (knowledge_node_id);


--
-- Name: idx_course_chapter_exam_chapter; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_course_chapter_exam_chapter ON public.course_chapter_exam USING btree (chapter_id);


--
-- Name: idx_course_chapter_exam_exam; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_course_chapter_exam_exam ON public.course_chapter_exam USING btree (exam_id);


--
-- Name: idx_exam_score_student_course; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_exam_score_student_course ON public.student_exam_score USING btree (student_id, course_id);


--
-- Name: idx_learning_behavior_student_course; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_learning_behavior_student_course ON public.student_learning_behavior USING btree (student_id, course_id);


--
-- Name: idx_learning_rule_chapter; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_learning_rule_chapter ON public.course_chapter_learning_rule USING btree (chapter_id);


--
-- Name: idx_learning_rule_target; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_learning_rule_target ON public.course_chapter_learning_rule USING btree (target_chapter_id);


--
-- Name: idx_personalized_content_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_personalized_content_created ON public.personalized_learning_content USING btree (created_at DESC);


--
-- Name: idx_personalized_content_resource; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_personalized_content_resource ON public.personalized_learning_content USING btree (resource_id);


--
-- Name: idx_personalized_content_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_personalized_content_student ON public.personalized_learning_content USING btree (student_id);


--
-- Name: idx_quiz_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quiz_created ON public.ai_quiz_record USING btree (created_at DESC);


--
-- Name: idx_quiz_resource; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quiz_resource ON public.ai_quiz_record USING btree (resource_id);


--
-- Name: idx_quiz_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quiz_student ON public.ai_quiz_record USING btree (student_id);


--
-- Name: idx_study_duration_student_course; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_study_duration_student_course ON public.student_study_duration USING btree (student_id, course_id);


--
-- Name: ix_class_course_relation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_class_course_relation_id ON public.class_course_relation USING btree (id);


--
-- Name: ix_course_chapter_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_course_chapter_id ON public.course_chapter USING btree (id);


--
-- Name: ix_course_cover_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_course_cover_id ON public.course_cover USING btree (id);


--
-- Name: ix_course_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_course_id ON public.course USING btree (id);


--
-- Name: ix_course_resource_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_course_resource_id ON public.course_resource USING btree (id);


--
-- Name: ix_enrollment_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_enrollment_order_id ON public.enrollment_order USING btree (id);


--
-- Name: ix_exam_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_exam_id ON public.exam USING btree (id);


--
-- Name: ix_exam_paper_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_exam_paper_id ON public.exam_paper USING btree (id);


--
-- Name: ix_exam_paper_question_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_exam_paper_question_id ON public.exam_paper_question USING btree (id);


--
-- Name: ix_exam_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_exam_student_id ON public.exam_student USING btree (id);


--
-- Name: ix_semester_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_semester_id ON public.semester USING btree (id);


--
-- Name: ix_student_profile_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_student_profile_id ON public.student_profile USING btree (id);


--
-- Name: ix_sys_class_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_sys_class_id ON public.sys_class USING btree (id);


--
-- Name: ix_teacher_profile_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_teacher_profile_id ON public.teacher_profile USING btree (id);


--
-- Name: ai_quiz_record ai_quiz_record_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_quiz_record
    ADD CONSTRAINT ai_quiz_record_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.student_learning_assessment(id);


--
-- Name: ai_quiz_record ai_quiz_record_llm_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_quiz_record
    ADD CONSTRAINT ai_quiz_record_llm_config_id_fkey FOREIGN KEY (llm_config_id) REFERENCES public.llm_config(id);


--
-- Name: ai_quiz_record ai_quiz_record_resource_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_quiz_record
    ADD CONSTRAINT ai_quiz_record_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.teaching_resource(id) ON DELETE CASCADE;


--
-- Name: ai_quiz_record ai_quiz_record_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_quiz_record
    ADD CONSTRAINT ai_quiz_record_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.sys_user(id) ON DELETE CASCADE;


--
-- Name: class_course_relation class_course_relation_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_course_relation
    ADD CONSTRAINT class_course_relation_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.sys_class(id);


--
-- Name: class_course_relation class_course_relation_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_course_relation
    ADD CONSTRAINT class_course_relation_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.course(id);


--
-- Name: class_course_relation class_course_relation_semester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_course_relation
    ADD CONSTRAINT class_course_relation_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semester(id);


--
-- Name: class_course_relation class_course_relation_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_course_relation
    ADD CONSTRAINT class_course_relation_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teacher_profile(id);


--
-- Name: course_chapter course_chapter_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter
    ADD CONSTRAINT course_chapter_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.course(id) ON DELETE CASCADE;


--
-- Name: course_chapter_exam course_chapter_exam_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter_exam
    ADD CONSTRAINT course_chapter_exam_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.course_chapter(id) ON DELETE CASCADE;


--
-- Name: course_chapter_exam course_chapter_exam_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter_exam
    ADD CONSTRAINT course_chapter_exam_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exam(id) ON DELETE CASCADE;


--
-- Name: course_chapter_exam_paper course_chapter_exam_paper_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter_exam_paper
    ADD CONSTRAINT course_chapter_exam_paper_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.course_chapter(id) ON DELETE CASCADE;


--
-- Name: course_chapter_exam_paper course_chapter_exam_paper_exam_paper_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter_exam_paper
    ADD CONSTRAINT course_chapter_exam_paper_exam_paper_id_fkey FOREIGN KEY (exam_paper_id) REFERENCES public.exam_paper(id) ON DELETE CASCADE;


--
-- Name: course_chapter_knowledge_graph course_chapter_knowledge_graph_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter_knowledge_graph
    ADD CONSTRAINT course_chapter_knowledge_graph_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.course_chapter(id) ON DELETE CASCADE;


--
-- Name: course_chapter_knowledge_graph course_chapter_knowledge_graph_knowledge_graph_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter_knowledge_graph
    ADD CONSTRAINT course_chapter_knowledge_graph_knowledge_graph_id_fkey FOREIGN KEY (knowledge_graph_id) REFERENCES public.knowledge_graph(id) ON DELETE CASCADE;


--
-- Name: course_chapter_knowledge_graph course_chapter_knowledge_graph_knowledge_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter_knowledge_graph
    ADD CONSTRAINT course_chapter_knowledge_graph_knowledge_node_id_fkey FOREIGN KEY (knowledge_node_id) REFERENCES public.knowledge_node(id) ON DELETE CASCADE;


--
-- Name: course_chapter_learning_rule course_chapter_learning_rule_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter_learning_rule
    ADD CONSTRAINT course_chapter_learning_rule_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.course_chapter(id) ON DELETE CASCADE;


--
-- Name: course_chapter_learning_rule course_chapter_learning_rule_target_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter_learning_rule
    ADD CONSTRAINT course_chapter_learning_rule_target_chapter_id_fkey FOREIGN KEY (target_chapter_id) REFERENCES public.course_chapter(id) ON DELETE SET NULL;


--
-- Name: course_chapter course_chapter_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter
    ADD CONSTRAINT course_chapter_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.course_chapter(id) ON DELETE CASCADE;


--
-- Name: course_cover course_cover_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_cover
    ADD CONSTRAINT course_cover_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.course(id);


--
-- Name: course course_main_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course
    ADD CONSTRAINT course_main_teacher_id_fkey FOREIGN KEY (main_teacher_id) REFERENCES public.sys_user(id);


--
-- Name: course course_major_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course
    ADD CONSTRAINT course_major_id_fkey FOREIGN KEY (major_id) REFERENCES public.major(id);


--
-- Name: course_resource course_resource_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_resource
    ADD CONSTRAINT course_resource_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.course_chapter(id);


--
-- Name: course_section_homework course_section_homework_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_section_homework
    ADD CONSTRAINT course_section_homework_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.course_chapter(id) ON DELETE CASCADE;


--
-- Name: course_section_resource course_section_resource_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_section_resource
    ADD CONSTRAINT course_section_resource_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.course_chapter(id) ON DELETE CASCADE;


--
-- Name: dictionary_item dictionary_item_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dictionary_item
    ADD CONSTRAINT dictionary_item_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.dictionary_type(id) ON DELETE CASCADE;


--
-- Name: enrollment_order enrollment_order_major_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollment_order
    ADD CONSTRAINT enrollment_order_major_id_fkey FOREIGN KEY (major_id) REFERENCES public.major(id);


--
-- Name: enrollment_order enrollment_order_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollment_order
    ADD CONSTRAINT enrollment_order_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.student_profile(id);


--
-- Name: exam exam_exam_paper_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam
    ADD CONSTRAINT exam_exam_paper_id_fkey FOREIGN KEY (exam_paper_id) REFERENCES public.exam_paper(id);


--
-- Name: exam_paper_question exam_paper_question_exam_paper_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_paper_question
    ADD CONSTRAINT exam_paper_question_exam_paper_id_fkey FOREIGN KEY (exam_paper_id) REFERENCES public.exam_paper(id);


--
-- Name: exam_paper_question exam_paper_question_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_paper_question
    ADD CONSTRAINT exam_paper_question_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.question(id);


--
-- Name: exam_paper exam_paper_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_paper
    ADD CONSTRAINT exam_paper_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.sys_user(id);


--
-- Name: exam_student exam_student_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_student
    ADD CONSTRAINT exam_student_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exam(id);


--
-- Name: exam_student exam_student_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_student
    ADD CONSTRAINT exam_student_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.student_profile(id);


--
-- Name: exam exam_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam
    ADD CONSTRAINT exam_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.sys_user(id);


--
-- Name: knowledge_graph knowledge_graph_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_graph
    ADD CONSTRAINT knowledge_graph_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.sys_user(id);


--
-- Name: knowledge_node knowledge_node_graph_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_node
    ADD CONSTRAINT knowledge_node_graph_id_fkey FOREIGN KEY (graph_id) REFERENCES public.knowledge_graph(id) ON DELETE CASCADE;


--
-- Name: knowledge_node knowledge_node_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_node
    ADD CONSTRAINT knowledge_node_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.knowledge_node(id);


--
-- Name: major major_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.major
    ADD CONSTRAINT major_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organization(id);


--
-- Name: major major_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.major
    ADD CONSTRAINT major_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.sys_user(id);


--
-- Name: organization organization_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization
    ADD CONSTRAINT organization_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.sys_user(id);


--
-- Name: organization organization_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization
    ADD CONSTRAINT organization_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.organization(id);


--
-- Name: organization organization_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization
    ADD CONSTRAINT organization_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.sys_user(id);


--
-- Name: personalized_learning_content personalized_learning_content_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personalized_learning_content
    ADD CONSTRAINT personalized_learning_content_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.student_learning_assessment(id);


--
-- Name: personalized_learning_content personalized_learning_content_llm_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personalized_learning_content
    ADD CONSTRAINT personalized_learning_content_llm_config_id_fkey FOREIGN KEY (llm_config_id) REFERENCES public.llm_config(id);


--
-- Name: personalized_learning_content personalized_learning_content_resource_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personalized_learning_content
    ADD CONSTRAINT personalized_learning_content_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.teaching_resource(id) ON DELETE CASCADE;


--
-- Name: personalized_learning_content personalized_learning_content_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personalized_learning_content
    ADD CONSTRAINT personalized_learning_content_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.sys_user(id) ON DELETE CASCADE;


--
-- Name: question_option question_option_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_option
    ADD CONSTRAINT question_option_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.question(id) ON DELETE CASCADE;


--
-- Name: question question_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question
    ADD CONSTRAINT question_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.sys_user(id);


--
-- Name: reference_folder reference_folder_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reference_folder
    ADD CONSTRAINT reference_folder_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.reference_folder(id);


--
-- Name: reference_folder reference_folder_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reference_folder
    ADD CONSTRAINT reference_folder_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.sys_user(id);


--
-- Name: reference_material reference_material_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reference_material
    ADD CONSTRAINT reference_material_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.reference_folder(id);


--
-- Name: reference_material reference_material_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reference_material
    ADD CONSTRAINT reference_material_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.sys_user(id);


--
-- Name: resource_folder resource_folder_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_folder
    ADD CONSTRAINT resource_folder_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.resource_folder(id);


--
-- Name: resource_folder resource_folder_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_folder
    ADD CONSTRAINT resource_folder_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.sys_user(id);


--
-- Name: student_exam_score student_exam_score_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_exam_score
    ADD CONSTRAINT student_exam_score_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.course(id);


--
-- Name: student_exam_score student_exam_score_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_exam_score
    ADD CONSTRAINT student_exam_score_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exam(id);


--
-- Name: student_exam_score student_exam_score_exam_paper_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_exam_score
    ADD CONSTRAINT student_exam_score_exam_paper_id_fkey FOREIGN KEY (exam_paper_id) REFERENCES public.exam_paper(id);


--
-- Name: student_exam_score student_exam_score_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_exam_score
    ADD CONSTRAINT student_exam_score_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.sys_user(id);


--
-- Name: student_learning_assessment student_learning_assessment_llm_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_learning_assessment
    ADD CONSTRAINT student_learning_assessment_llm_config_id_fkey FOREIGN KEY (llm_config_id) REFERENCES public.llm_config(id);


--
-- Name: student_learning_assessment student_learning_assessment_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_learning_assessment
    ADD CONSTRAINT student_learning_assessment_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.sys_user(id) ON DELETE CASCADE;


--
-- Name: student_learning_behavior student_learning_behavior_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_learning_behavior
    ADD CONSTRAINT student_learning_behavior_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.course_chapter(id);


--
-- Name: student_learning_behavior student_learning_behavior_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_learning_behavior
    ADD CONSTRAINT student_learning_behavior_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.course(id);


--
-- Name: student_learning_behavior student_learning_behavior_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_learning_behavior
    ADD CONSTRAINT student_learning_behavior_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.sys_user(id);


--
-- Name: student_learning_profile student_learning_profile_latest_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_learning_profile
    ADD CONSTRAINT student_learning_profile_latest_assessment_id_fkey FOREIGN KEY (latest_assessment_id) REFERENCES public.student_learning_assessment(id);


--
-- Name: student_learning_profile student_learning_profile_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_learning_profile
    ADD CONSTRAINT student_learning_profile_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.sys_user(id) ON DELETE CASCADE;


--
-- Name: student_profile student_profile_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_profile
    ADD CONSTRAINT student_profile_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.sys_class(id);


--
-- Name: student_profile student_profile_major_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_profile
    ADD CONSTRAINT student_profile_major_id_fkey FOREIGN KEY (major_id) REFERENCES public.major(id);


--
-- Name: student_profile student_profile_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_profile
    ADD CONSTRAINT student_profile_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.sys_user(id);


--
-- Name: student_study_duration student_study_duration_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_study_duration
    ADD CONSTRAINT student_study_duration_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.course(id);


--
-- Name: student_study_duration student_study_duration_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_study_duration
    ADD CONSTRAINT student_study_duration_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.sys_user(id);


--
-- Name: sys_class sys_class_major_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_class
    ADD CONSTRAINT sys_class_major_id_fkey FOREIGN KEY (major_id) REFERENCES public.major(id);


--
-- Name: teacher_profile teacher_profile_major_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_profile
    ADD CONSTRAINT teacher_profile_major_id_fkey FOREIGN KEY (major_id) REFERENCES public.major(id);


--
-- Name: teacher_profile teacher_profile_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_profile
    ADD CONSTRAINT teacher_profile_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.sys_user(id);


--
-- Name: teaching_resource teaching_resource_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teaching_resource
    ADD CONSTRAINT teaching_resource_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.resource_folder(id);


--
-- Name: teaching_resource teaching_resource_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teaching_resource
    ADD CONSTRAINT teaching_resource_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.sys_user(id);


--
-- PostgreSQL database dump complete
--

\unrestrict f40VQpHrTZY2KBp8FznhW12yAcBaD8cVNNs4BNCfnptbT8wI771A3ljoOyvqtTr
