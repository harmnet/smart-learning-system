--
-- PostgreSQL database dump
--

\restrict ucdNaee0cf14kmqgxACyVddpR8IlXbHQy279ucvsFw3w1A5r7jeM7ItcTKGX30O

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
    is_public boolean DEFAULT false,
    major_id integer
);


ALTER TABLE public.course OWNER TO postgres;

--
-- Name: course_chapter; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_chapter (
    id integer NOT NULL,
    course_id integer,
    title character varying NOT NULL,
    sort_order integer,
    parent_id integer
);


ALTER TABLE public.course_chapter OWNER TO postgres;

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
-- Name: course_cover; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_cover (
    id integer NOT NULL,
    course_id integer,
    filename character varying NOT NULL,
    sort_order integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    file_size integer
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
    updated_at timestamp without time zone
);


ALTER TABLE public.exam OWNER TO postgres;

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
    updated_at timestamp without time zone
);


ALTER TABLE public.exam_paper OWNER TO postgres;

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
    created_at timestamp without time zone
);


ALTER TABLE public.exam_student OWNER TO postgres;

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
    is_active boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.llm_config OWNER TO postgres;

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
    updated_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    is_active boolean DEFAULT true
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
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    is_active boolean DEFAULT true
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
-- Name: registrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.registrations (
    id integer NOT NULL,
    application_date date DEFAULT CURRENT_DATE NOT NULL,
    student_name_chinese character varying(100) NOT NULL,
    student_name_english character varying(100),
    gender character varying(20),
    date_of_birth date,
    nationality character varying(50),
    id_number character varying(50),
    phone character varying(50),
    email character varying(100),
    address text,
    city character varying(100),
    province character varying(100),
    postal_code character varying(20),
    current_school character varying(200),
    current_grade character varying(50),
    previous_schools text,
    english_level character varying(50),
    other_languages text,
    intended_grade character varying(50),
    intended_program character varying(100),
    start_date date,
    hobbies_interests text,
    special_skills text,
    awards_achievements text,
    health_conditions text,
    allergies text,
    special_needs text,
    emergency_contact_name character varying(100),
    emergency_contact_relationship character varying(50),
    emergency_contact_phone character varying(50),
    how_did_you_hear character varying(200),
    additional_comments text,
    photo_url character varying(500),
    id_document_url character varying(500),
    transcript_url character varying(500),
    other_documents_url text,
    status character varying(50) DEFAULT 'pending'::character varying,
    reviewed_by integer,
    reviewed_at timestamp without time zone,
    review_notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true,
    father_name_chinese character varying(100),
    father_name_english character varying(100),
    father_nationality character varying(50),
    father_id_number character varying(50),
    father_phone character varying(50),
    father_email character varying(100),
    father_occupation character varying(100),
    father_company character varying(200),
    father_company_address text,
    father_company_phone character varying(50),
    mother_name_chinese character varying(100),
    mother_name_english character varying(100),
    mother_nationality character varying(50),
    mother_id_number character varying(50),
    mother_phone character varying(50),
    mother_email character varying(100),
    mother_occupation character varying(100),
    mother_company character varying(200),
    mother_company_address text,
    mother_company_phone character varying(50),
    guardian_name character varying(100),
    guardian_relationship character varying(50),
    guardian_phone character varying(50),
    guardian_email character varying(100),
    guardian_address text,
    age integer,
    permanent_address text,
    race character varying(50),
    religion character varying(50),
    parents_marital_status character varying(50),
    guardian_nationality character varying(50),
    guardian_id_number character varying(50),
    guardian_company_phone character varying(50),
    guardian_occupation character varying(100),
    guardian_company character varying(200),
    siblings jsonb,
    emergency_contact_office_phone character varying(50),
    emergency_contact_email character varying(100),
    previous_schools_structured jsonb,
    double_promotion_offered boolean,
    double_promotion_details text,
    discipline_issues boolean,
    discipline_issues_details text,
    sports_activities jsonb,
    clubs_activities jsonb,
    diet_type character varying(50),
    taking_medication boolean,
    medication_details text,
    has_impairment boolean,
    impairment_details text,
    medical_conditions jsonb,
    infectious_diseases jsonb,
    vaccinations jsonb,
    bill_to character varying(50),
    payment_individual jsonb,
    payment_company jsonb,
    agent_details jsonb
);


ALTER TABLE public.registrations OWNER TO postgres;

--
-- Name: registrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.registrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.registrations_id_seq OWNER TO postgres;

--
-- Name: registrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.registrations_id_seq OWNED BY public.registrations.id;


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
-- Name: student_profile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_profile (
    id integer NOT NULL,
    user_id integer,
    class_id integer,
    major_id integer,
    student_no character varying,
    status character varying DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
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
    code character varying,
    major_id integer,
    grade character varying,
    semester character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone,
    is_active boolean DEFAULT true
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
    phone character varying,
    updated_at timestamp without time zone DEFAULT now()
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
    file_size bigint NOT NULL,
    resource_type character varying(20) NOT NULL,
    knowledge_point text,
    is_active boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    folder_id integer,
    local_file_path character varying(500),
    pdf_path character varying(500),
    pdf_local_path character varying(500),
    pdf_converted_at timestamp without time zone,
    pdf_conversion_status character varying(20) DEFAULT 'pending'::character varying
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
-- Name: course_chapter_exam_paper id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter_exam_paper ALTER COLUMN id SET DEFAULT nextval('public.course_chapter_exam_paper_id_seq'::regclass);


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
-- Name: registrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registrations ALTER COLUMN id SET DEFAULT nextval('public.registrations_id_seq'::regclass);


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
-- Name: student_learning_behavior id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_learning_behavior ALTER COLUMN id SET DEFAULT nextval('public.student_learning_behavior_id_seq'::regclass);


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
-- Data for Name: class_course_relation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.class_course_relation (id, class_id, course_id, teacher_id, semester_id, schedule_desc) FROM stdin;
1	1	2	2	\N	\N
2	2	1	\N	\N	\N
3	2	2	\N	\N	\N
4	1	1	2	\N	\N
5	1	3	2	\N	\N
6	2	3	2	\N	\N
\.


--
-- Data for Name: course; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course (id, title, code, description, cover_image, credits, course_type, hours, introduction, objectives, main_teacher_id, is_public, major_id) FROM stdin;
2	测试课程 2	\N	\N	\N	2	required	16	111	222	9	f	1
1	测试课程1	\N	\N	\N	2	required	16	121 饿 13123erte	而特让他不不不	9	f	1
3	商务数据分析基础	\N	\N	\N	2	required	24	课程简介 123	授课目标 123	9	t	1
\.


--
-- Data for Name: course_chapter; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_chapter (id, course_id, title, sort_order, parent_id) FROM stdin;
2	2	第一章	0	\N
3	2	123	0	\N
1	2	第一章 1	0	\N
12	2	123	0	1
13	1	职业基础知识	0	\N
14	1	商务数据分析师职业概述	0	13
15	1	数据采集	1	\N
16	1	数据采集方法	0	15
17	1	数据采集工具	1	15
18	1	数据治理	2	\N
19	1	数据挖掘	3	\N
20	1	数据可视化	4	\N
21	1	数据安全与法律法规	5	\N
22	3	项目一 初识商务数据分析	0	\N
23	3	项目二 商务数据分析准备工作	1	\N
24	3	任务一 数据化时代	0	22
25	3	任务二 数据隐私与数据安全	1	22
26	3	任务三 商务数据分析认知	2	22
27	3	任务四 商务数据分析流程	3	22
28	3	任务五 商务数据分析工具	4	22
\.


--
-- Data for Name: course_chapter_exam_paper; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_chapter_exam_paper (id, chapter_id, exam_paper_id, created_at) FROM stdin;
\.


--
-- Data for Name: course_cover; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_cover (id, course_id, filename, sort_order, created_at, updated_at, file_size) FROM stdin;
1	\N	b4020c0d-292a-49b7-9d44-77797fdc56e1.jpeg	3	2025-11-30 03:22:08.895245	2025-12-06 02:27:18.74346	\N
5	2	https://ezijingai.oss-cn-beijing.aliyuncs.com/course_covers/c43afeac-433f-4409-aa59-9847c14abd9b.jpeg	1	2025-12-06 02:27:06.584124	2025-12-06 15:29:44.29837	254499
4	1	https://ezijingai.oss-cn-beijing.aliyuncs.com/course_covers/3e2a98b0-1767-4a8c-9a1d-c5c2436edba4.jpeg	3	2025-12-06 02:20:22.462317	2025-12-06 15:29:59.433761	254499
6	\N	https://ezijingai.oss-cn-beijing.aliyuncs.com/course_covers/f0069e57-4261-45a6-b031-f523b34aaed3.png	5	2025-12-08 02:20:00.156242	2025-12-08 02:24:04.741788	1257274
7	3	https://ezijingai.oss-cn-beijing.aliyuncs.com/course_covers/faa97b90-adfe-4224-8ec7-65d75a45e70e.png	4	2025-12-08 02:24:02.239075	2025-12-08 02:24:04.741789	1257274
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
2	12	teaching_resource	1	0	2025-12-02 15:25:26.02822
3	14	teaching_resource	19	0	2025-12-06 15:34:10.034299
4	14	teaching_resource	16	0	2025-12-06 15:34:15.947882
5	24	teaching_resource	24	0	2025-12-08 02:31:09.027256
6	25	teaching_resource	25	0	2025-12-08 02:31:16.672948
7	26	teaching_resource	26	0	2025-12-08 02:31:25.170815
8	27	teaching_resource	27	0	2025-12-08 02:31:33.318774
9	28	teaching_resource	28	0	2025-12-08 02:31:45.336259
10	24	teaching_resource	30	0	2025-12-08 02:31:55.47208
\.


--
-- Data for Name: dictionary_item; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dictionary_item (id, type_id, code, label, value, sort_order, is_active, remark, created_at, updated_at) FROM stdin;
1	1	2024	2024级	2024	1	t	\N	2025-11-27 02:37:18.612035+00	\N
2	1	2023	2023级	2023	2	t	\N	2025-11-27 02:37:18.612035+00	\N
3	1	2022	2022级	2022	3	t	\N	2025-11-27 02:37:18.612035+00	\N
4	1	2021	2021级	2021	4	t	\N	2025-11-27 02:37:18.612035+00	\N
5	1	2020	2020级	2020	5	t	\N	2025-11-27 02:37:18.612035+00	\N
6	2	2024_fall	2024秋季	2024秋季	1	t	\N	2025-11-27 02:37:18.613546+00	\N
7	2	2024_spring	2024春季	2024春季	2	t	\N	2025-11-27 02:37:18.613546+00	\N
8	2	2023_fall	2023秋季	2023秋季	3	t	\N	2025-11-27 02:37:18.613546+00	\N
9	2	2023_spring	2023春季	2023春季	4	t	\N	2025-11-27 02:37:18.613546+00	\N
10	3	active	在读	active	1	t	\N	2025-11-27 02:37:18.613979+00	\N
11	3	graduated	已毕业	graduated	2	t	\N	2025-11-27 02:37:18.613979+00	\N
12	3	suspended	休学	suspended	3	t	\N	2025-11-27 02:37:18.613979+00	\N
13	3	expelled	退学	expelled	4	t	\N	2025-11-27 02:37:18.613979+00	\N
\.


--
-- Data for Name: dictionary_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dictionary_type (id, code, name, description, is_active, created_at, updated_at) FROM stdin;
1	grade	年级	学生年级分类	t	2025-11-27 02:37:18.611356+00	\N
2	semester	学期	学期分类	t	2025-11-27 02:37:18.613295+00	\N
3	student_status	学生状态	学生学籍状态	t	2025-11-27 02:37:18.613807+00	\N
4	o1	课程类型		t	2025-11-30 02:15:08.552301+00	\N
\.


--
-- Data for Name: enrollment_order; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enrollment_order (id, order_no, student_id, major_id, amount, status, created_at, paid_at) FROM stdin;
\.


--
-- Data for Name: exam; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exam (id, teacher_id, exam_paper_id, exam_name, exam_date, start_time, end_time, cover_image, early_login_minutes, late_forbidden_minutes, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: exam_paper; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exam_paper (id, teacher_id, paper_name, duration_minutes, min_submit_minutes, composition_mode, total_score, question_order, option_order, is_active, created_at, updated_at) FROM stdin;
1	1	123	120	30	manual	100.00	fixed	fixed	t	2025-12-01 12:53:04.551539	2025-12-01 12:53:04.551547
\.


--
-- Data for Name: exam_paper_question; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exam_paper_question (id, exam_paper_id, question_id, score, sort_order, created_at) FROM stdin;
1	1	9	5.00	1	2025-12-01 13:01:07.157932
2	1	7	5.00	2	2025-12-01 13:06:23.575166
3	1	8	5.00	3	2025-12-01 13:06:44.462324
4	1	10	5.00	4	2025-12-01 13:06:54.646273
\.


--
-- Data for Name: exam_student; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exam_student (id, exam_id, student_id, created_at) FROM stdin;
\.


--
-- Data for Name: knowledge_graph; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knowledge_graph (id, teacher_id, graph_name, description, is_active, created_at, updated_at) FROM stdin;
1	1	更新后的知识图谱	更新后的描述	f	2025-11-30 15:12:22.596549	2025-11-30 15:12:22.650425
2	1	政治经济学	\N	f	2025-12-01 00:21:49.412093	2025-12-06 14:16:19.143157
3	9	商务数据分析师-四级	\N	f	2025-12-06 14:16:41.075941	2025-12-08 02:01:11.184077
4	9	2025年湖北工匠杯全媒体运营师技能大赛	基于PDF文档自动生成的知识图谱，涵盖大赛的项目概要、基本知识与能力要求、试题及评判标准、竞赛细则、赛场安排以及安全健康规定。	f	2025-12-06 15:18:03.0016	2025-12-08 02:01:16.484964
5	9	商务数据分析基础	\N	t	2025-12-08 02:01:27.04387	2025-12-08 02:01:27.043875
\.


--
-- Data for Name: knowledge_node; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knowledge_node (id, graph_id, parent_id, node_name, node_content, sort_order, is_active, created_at, updated_at) FROM stdin;
1	1	\N	更新后的根节点1	更新后的内容	0	t	2025-11-30 15:12:22.618166	2025-11-30 15:12:22.634116
2	1	1	子节点1	这是子节点	0	f	2025-11-30 15:12:22.626799	2025-11-30 15:12:22.647171
3	2	\N	第一章	\N	0	t	2025-12-01 00:22:10.123988	2025-12-01 00:22:10.123994
4	2	\N	第二章	\N	0	t	2025-12-01 00:22:18.778393	2025-12-01 00:22:18.7784
5	2	3	第一节	\N	0	t	2025-12-01 00:22:30.714937	2025-12-01 00:22:30.71494
6	2	5	经济的概念	\N	0	t	2025-12-01 00:22:48.201868	2025-12-01 00:22:48.20187
7	3	\N	职业基础知识	\N	0	t	2025-12-06 14:17:04.825911	2025-12-06 14:17:04.825918
8	3	\N	数据采集	\N	0	t	2025-12-06 14:17:15.11885	2025-12-06 14:17:15.11885
9	3	\N	数据治理	\N	0	t	2025-12-06 14:17:23.939387	2025-12-06 14:17:23.939388
10	3	\N	数据挖掘	\N	0	t	2025-12-06 14:17:31.33688	2025-12-06 14:17:31.336881
11	3	\N	数据可视化	\N	0	t	2025-12-06 14:17:38.739034	2025-12-06 14:17:38.739039
12	3	\N	数据安全与法律法规	\N	0	t	2025-12-06 14:17:48.275268	2025-12-06 14:17:48.27527
13	3	7	商务数据分析师职业概述	\N	0	t	2025-12-06 14:18:03.046608	2025-12-06 14:18:03.046609
14	3	8	数据采集方法	\N	0	t	2025-12-06 14:18:18.845758	2025-12-06 14:18:18.84576
15	3	8	数据采集工具	\N	0	t	2025-12-06 14:18:36.563268	2025-12-06 14:18:36.563269
16	3	15	网络爬虫	\N	0	t	2025-12-06 14:18:49.174342	2025-12-06 14:18:49.174344
17	4	\N	技术描述	包括项目概要和基本知识与能力要求两部分，概述了大赛的目标、参赛者需具备的职业道德、基础知识、市场分析、数据分析和数据优化等方面的能力。	0	t	2025-12-06 15:18:03.021842	2025-12-06 15:18:03.021847
18	4	17	项目概要	评估参赛者在数据采集、导入、治理、分析以及可视化报告制作等关键技能方面的专业能力，并考察其逻辑思维、团队协作和时间管理等综合职业素质。旨在加深社会对数字化新兴职业的理解，推广全媒体运营师所需的专业技能。	0	t	2025-12-06 15:18:03.030571	2025-12-06 15:18:03.030577
19	4	17	基本知识与能力要求	从职业道德到具体的数据分析技能，详细列出了参赛选手需要掌握的各项理论知识和实践能力的具体内容及其权重比例。	1	t	2025-12-06 15:18:03.035401	2025-12-06 15:18:03.035403
20	4	19	职业道德	包括遵纪守法、诚实守信、恪尽职守、勇于创新、钻研业务、团结协作、严控质量和服务热情等内容。	0	t	2025-12-06 15:18:03.039343	2025-12-06 15:18:03.039345
21	4	19	基础知识	涵盖传播学、营销、广告、全媒体运营、电商的基本概念及相关法律、法规知识。	1	t	2025-12-06 15:18:03.043047	2025-12-06 15:18:03.04305
22	4	19	市场分析	涉及行业分析、平台分析，要求能够收集行业报告素材、编撰行业分析报告、选择主要传播平台。	2	t	2025-12-06 15:18:03.047095	2025-12-06 15:18:03.047097
23	4	19	数据分析	包括策略制定（如5A人群及5A关系资产图）、策略分析（如精准营销知识），以及用户画像、产品分析等。	3	t	2025-12-06 15:18:03.050732	2025-12-06 15:18:03.050734
24	4	19	数据优化	专注于流量价值分析、排品技巧等内容，并要求能进行复盘优化和商业化变现建议。	4	t	2025-12-06 15:18:03.054437	2025-12-06 15:18:03.054439
25	4	\N	试题及评判标准	介绍了竞赛试题结构（理论考核+实操考核）及其评分标准，明确了不同模块下的具体考核要点。	1	t	2025-12-06 15:18:03.05785	2025-12-06 15:18:03.057853
26	4	25	试题样题	包含理论考核和实操考核两个环节，其中理论考核占总成绩30%，实操考核占70%。	0	t	2025-12-06 15:18:03.061433	2025-12-06 15:18:03.061435
27	4	25	评判标准	定义了理论与实操考核的成绩计算方法，强调了评判过程中的客观公正性要求。	1	t	2025-12-06 15:18:03.064877	2025-12-06 15:18:03.064879
28	4	\N	竞赛细则	详细规划了比赛的整体进程安排、日程安排、分组情况、名额限制、报名程序、奖励机制以及比赛纪律和道德规范。	2	t	2025-12-06 15:18:03.068425	2025-12-06 15:18:03.068427
29	4	28	整体进程安排	列出从大赛通知发布到决赛闭幕式的整个时间表。	0	t	2025-12-06 15:18:03.072266	2025-12-06 15:18:03.072268
30	4	28	竞赛日程	提供了开幕式、领队会、裁判会、正式比赛等具体活动的时间安排。	1	t	2025-12-06 15:18:03.075468	2025-12-06 15:18:03.075469
31	4	28	赛制规则	明确了单人参赛、选拔赛组织方式、参赛队伍数量上限等信息。	2	t	2025-12-06 15:18:03.079371	2025-12-06 15:18:03.079374
32	4	28	报名程序	简述了报名时间和方式的相关规定。	3	t	2025-12-06 15:18:03.082926	2025-12-06 15:18:03.082928
33	4	28	比赛纪律和道德要求	为确保公平公正的比赛环境，制定了针对选手、裁判和技术支持人员的行为准则。	4	t	2025-12-06 15:18:03.086821	2025-12-06 15:18:03.086824
34	4	\N	赛场及设施设备安排	描述了赛场规格要求、场地布局图以及基础设施清单，包括赛场提供的电脑配置和其他必要设备。	3	t	2025-12-06 15:18:03.090492	2025-12-06 15:18:03.090495
35	4	34	赛场规格	指定了检录区、选手区、裁判区的空间布局，特别提到了工位设计和隔离需求。	0	t	2025-12-06 15:18:03.094179	2025-12-06 15:18:03.094181
36	4	34	基础设施清单	列出了由赛场提供给选手使用的电脑、鼠标、键盘等设备的技术规格。	1	t	2025-12-06 15:18:03.097609	2025-12-06 15:18:03.097611
37	4	\N	安全健康规定	根据国家相关法规要求，提出了安全健康要求及职业操作规范，特别是人身防护措施。	4	t	2025-12-06 15:18:03.101313	2025-12-06 15:18:03.101315
38	5	\N	一碗麻辣烫背后的数据分析	\N	0	t	2025-12-08 02:01:43.664722	2025-12-08 02:02:17.214759
39	5	38	企业数字化转型的朴素价值观	\N	0	t	2025-12-08 02:02:42.002055	2025-12-08 02:02:42.002056
40	5	39	商务数据分析对企业业务的影响	\N	0	f	2025-12-08 02:02:58.642555	2025-12-08 02:03:04.378713
41	5	38	商务数据分析对企业业务的影响	\N	0	t	2025-12-08 02:03:11.358083	2025-12-08 02:03:11.358112
42	5	\N	数据化时代	\N	0	t	2025-12-08 02:03:24.412897	2025-12-08 02:03:24.412905
43	5	42	数据概述	\N	0	t	2025-12-08 02:03:38.383901	2025-12-08 02:03:38.383903
44	5	42	数字经济：产业数字化与数字产业化	\N	0	t	2025-12-08 02:03:53.950746	2025-12-08 02:03:53.950748
45	5	42	数字中国建设整体布局规划	\N	0	t	2025-12-08 02:04:07.705414	2025-12-08 02:04:07.705415
46	5	\N	新一代信息技术对数据分析的推动	\N	0	t	2025-12-08 02:04:19.369407	2025-12-08 02:04:19.369409
47	5	46	新一代信息技术概述	\N	0	t	2025-12-08 02:04:31.94007	2025-12-08 02:04:31.940071
48	5	46	大数据对数据分析的推动	\N	0	t	2025-12-08 02:04:44.394577	2025-12-08 02:04:44.394578
49	5	46	人工智能对数据分析的推动	\N	0	t	2025-12-08 02:04:57.057227	2025-12-08 02:04:57.057228
\.


--
-- Data for Name: llm_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.llm_config (id, provider_name, provider_key, api_key, api_secret, endpoint_url, model_name, config_json, is_active, created_at, updated_at) FROM stdin;
2	DeepSeek	deepseek		\N	https://api.deepseek.com/v1	deepseek-chat	\N	f	2025-12-05 03:39:38.094418	2025-12-05 03:39:38.094418
3	KIMI	kimi		\N	https://api.moonshot.cn/v1	moonshot-v1-8k	\N	f	2025-12-05 03:39:38.094419	2025-12-05 03:39:38.094419
4	文心一言	wenxin			https://aip.baidubce.com/rpc/2.0/ai_custom/v1	ERNIE-Bot-4	\N	f	2025-12-05 03:39:38.094419	2025-12-05 03:39:38.094419
5	火山引擎-豆包	volcengine_doubao		\N	https://ark.cn-beijing.volces.com/api/v3	doubao-pro-32k	\N	f	2025-12-05 03:39:38.094419	2025-12-05 03:39:38.09442
6	硅基流动	siliconflow		\N	https://api.siliconflow.cn/v1	Qwen/Qwen2-7B-Instruct	\N	f	2025-12-05 03:39:38.09442	2025-12-05 03:39:38.09442
1	阿里云百炼-通义千问	aliyun_qwen	sk-1f4bdb8a73ee47809ee148a977c39737	OKUYiiO9WOw5bJpRTfJa7F76Ayygdk	https://dashscope.aliyuncs.com/api/v1	qwen-max		t	2025-12-05 03:39:38.094415	2025-12-05 05:28:34.820365
\.


--
-- Data for Name: major; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.major (id, name, organization_id, tuition_fee, description, duration_years, updated_at, created_at, is_active) FROM stdin;
2	人工智能	2	6800.00	机器学习与深度学习	4	2025-11-27 08:17:22.789157	2025-11-27 07:52:32.449175	t
3	软件工程	3	5500.00	企业级软件开发	4	2025-11-27 08:18:02.395708	2025-11-27 07:52:32.449175	t
1	计算机科学与技术2	4	5200.00	更新后的描述	4	2025-11-27 08:19:52.813405	2025-11-27 07:52:32.449175	t
\.


--
-- Data for Name: organization; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organization (id, name, parent_id, created_at, updated_at, is_active) FROM stdin;
1	Smart Tech University	\N	2025-11-27 08:07:41.149301	2025-11-27 08:07:41.17004	t
2	计算机学院	1	2025-11-27 08:10:21.998734	2025-11-27 08:10:21.998739	t
3	会计学院	1	2025-11-27 08:10:43.455754	2025-11-27 08:10:50.389107	t
4	通信学院	1	2025-11-27 08:19:40.651842	2025-11-27 08:19:40.651844	t
\.


--
-- Data for Name: question; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question (id, teacher_id, question_type, title, title_image, knowledge_point, answer, answer_image, explanation, explanation_image, difficulty, is_active, created_at, updated_at) FROM stdin;
2	1	true_false	测试判断题：地球是圆的	\N	地理知识	true	\N	地球确实是近似球形的	\N	1	t	2025-11-30 14:54:39.288836	2025-11-30 14:54:39.288837
3	1	fill_blank	测试填空题：中国的首都是____	\N	地理知识	北京	\N	北京是中国的首都	\N	1	t	2025-11-30 14:54:39.293069	2025-11-30 14:54:39.293069
1	1	single_choice	更新后的题目：1+1等于几？（已修改）	\N	基础数学		\N	这是更新后的解析	\N	1	t	2025-11-30 14:54:39.276975	2025-11-30 14:54:39.32663
4	1	multiple_choice	测试多选题：以下哪些是编程语言？（多选）	\N	计算机基础		\N	Python、Java、HTML都是编程相关	\N	2	t	2025-11-30 14:54:46.286184	2025-11-30 14:54:46.286185
5	1	qa	测试问答题：请简述什么是人工智能？	\N	人工智能	人工智能是计算机科学的一个分支，旨在创建能够执行通常需要人类智能的任务的系统。	\N	人工智能涉及机器学习、深度学习、自然语言处理等多个领域。	\N	3	t	2025-11-30 14:54:46.297112	2025-11-30 14:54:46.297112
6	1	short_answer	测试简答题：请列出三个常见的数据库类型	\N	数据库	1. 关系型数据库（如MySQL）\n2. 非关系型数据库（如MongoDB）\n3. 内存数据库（如Redis）	\N	不同类型的数据库适用于不同的应用场景	\N	2	t	2025-11-30 14:54:46.301307	2025-11-30 14:54:46.301307
7	1	single_choice	测试选项图片：哪个是圆形？	\N	图形识别		\N	圆形是选项B	\N	1	t	2025-11-30 14:56:39.335529	2025-11-30 14:56:39.335531
8	1	single_choice	测试导入单选题：2+2等于几？	\N	基础数学	nan	\N	这是简单的加法	\N	1	t	2025-11-30 15:02:29.886375	2025-11-30 15:02:29.886376
9	1	true_false	测试导入判断题：太阳从东边升起	\N	地理知识	true	\N	太阳确实从东边升起	\N	1	t	2025-11-30 15:02:29.890446	2025-11-30 15:02:29.890446
10	1	fill_blank	测试导入填空题：水的化学式是____	\N	化学	H2O	\N	水的化学式是H2O	\N	2	t	2025-11-30 15:02:29.894564	2025-11-30 15:02:29.894565
11	9	single_choice	在使用Python进行网络爬虫开发时，哪一个库主要用于解析HTML文档？	\N	网络爬虫	\N	\N	BeautifulSoup是一个可以从HTML或XML文件中提取数据的Python库，它能够创建解析树，方便地从网页中抓取信息。	\N	1	f	2025-12-06 15:24:29.780316	2025-12-08 02:16:04.653958
\.


--
-- Data for Name: question_option; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question_option (id, question_id, option_label, option_text, option_image, is_correct, sort_order, created_at) FROM stdin;
1	1	A	1	\N	f	0	2025-11-30 14:54:39.280531
2	1	B	2	\N	t	1	2025-11-30 14:54:39.280531
3	1	C	3	\N	f	2	2025-11-30 14:54:39.280532
4	1	D	4	\N	f	3	2025-11-30 14:54:39.280532
5	4	A	Python	\N	t	0	2025-11-30 14:54:46.291344
6	4	B	Java	\N	t	1	2025-11-30 14:54:46.291345
7	4	C	HTML	\N	t	2	2025-11-30 14:54:46.291345
8	4	D	Word	\N	f	3	2025-11-30 14:54:46.291345
9	7	A	正方形	\N	f	0	2025-11-30 14:56:39.339909
10	7	B	圆形	\N	t	1	2025-11-30 14:56:39.339909
11	7	C	三角形	\N	f	2	2025-11-30 14:56:39.33991
12	8	A	3	\N	f	0	2025-11-30 15:02:29.8917
13	8	B	4	\N	t	1	2025-11-30 15:02:29.891701
14	8	C	5	\N	f	2	2025-11-30 15:02:29.891701
15	8	D	6	\N	f	3	2025-11-30 15:02:29.891701
16	11	A	requests	\N	f	0	2025-12-06 15:24:29.788074
17	11	B	BeautifulSoup	\N	t	1	2025-12-06 15:24:29.788081
18	11	C	Scrapy	\N	f	2	2025-12-06 15:24:29.788082
19	11	D	Selenium	\N	f	3	2025-12-06 15:24:29.788082
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
1	9	\N	测试文档-参考资料	word	案例原文：职业生涯规划案例：技能匹配与发展建议_副本.docx	uploads/reference_materials/9_20251203001716_案例原文：职业生涯规划案例：技能匹配与发展建议_副本.docx	78669	\N	测试知识点	t	2025-12-02 16:17:16.167414	2025-12-02 16:17:16.167421
2	9	\N	测试文档-参考资料	word	案例原文：职业生涯规划案例：技能匹配与发展建议_副本.docx	uploads/reference_materials/9_20251203001854_案例原文：职业生涯规划案例：技能匹配与发展建议_副本.docx	78669	\N	测试知识点	t	2025-12-02 16:18:54.841326	2025-12-02 16:18:54.841331
3	9	\N	测试文档-参考资料	word	案例原文：职业生涯规划案例：技能匹配与发展建议_副本.docx	uploads/reference_materials/9_20251203001914_案例原文：职业生涯规划案例：技能匹配与发展建议_副本.docx	78669	\N	测试知识点	t	2025-12-02 16:19:14.957164	2025-12-02 16:19:14.95717
4	9	\N	测试文档-参考资料	word	案例原文：职业生涯规划案例：技能匹配与发展建议_副本.docx	https://ezijingai.oss-cn-beijing.aliyuncs.com/reference_materials/word/9_20251203001940_案例原文：职业生涯规划案例：技能匹配与发展建议_副本.docx	78669	\N	测试知识点	t	2025-12-02 16:19:40.90934	2025-12-02 16:19:40.909341
5	9	\N	测试文档-参考资料	word	案例原文：职业生涯规划案例：技能匹配与发展建议_副本.docx	https://ezijingai.oss-cn-beijing.aliyuncs.com/reference_materials/word/9_20251203002000_案例原文：职业生涯规划案例：技能匹配与发展建议_副本.docx	78669	\N	测试知识点	t	2025-12-02 16:20:00.744112	2025-12-02 16:20:00.744114
\.


--
-- Data for Name: registrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.registrations (id, application_date, student_name_chinese, student_name_english, gender, date_of_birth, nationality, id_number, phone, email, address, city, province, postal_code, current_school, current_grade, previous_schools, english_level, other_languages, intended_grade, intended_program, start_date, hobbies_interests, special_skills, awards_achievements, health_conditions, allergies, special_needs, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, how_did_you_hear, additional_comments, photo_url, id_document_url, transcript_url, other_documents_url, status, reviewed_by, reviewed_at, review_notes, created_at, updated_at, is_active, father_name_chinese, father_name_english, father_nationality, father_id_number, father_phone, father_email, father_occupation, father_company, father_company_address, father_company_phone, mother_name_chinese, mother_name_english, mother_nationality, mother_id_number, mother_phone, mother_email, mother_occupation, mother_company, mother_company_address, mother_company_phone, guardian_name, guardian_relationship, guardian_phone, guardian_email, guardian_address, age, permanent_address, race, religion, parents_marital_status, guardian_nationality, guardian_id_number, guardian_company_phone, guardian_occupation, guardian_company, siblings, emergency_contact_office_phone, emergency_contact_email, previous_schools_structured, double_promotion_offered, double_promotion_details, discipline_issues, discipline_issues_details, sports_activities, clubs_activities, diet_type, taking_medication, medication_details, has_impairment, impairment_details, medical_conditions, infectious_diseases, vaccinations, bill_to, payment_individual, payment_company, agent_details) FROM stdin;
1	2025-12-14	张三	\N	male	\N	\N	\N	13800138000	zhangsan@example.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	grade10	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	pending	\N	\N	\N	2025-12-14 13:06:24.885962	2025-12-14 13:06:24.885962	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2	2025-12-14	李明	Li Ming	male	2010-05-15	中国	\N	13900139000	liming@example.com	北京市朝阳区某某街道123号	北京	北京市	\N	北京某某中学	grade9	\N	intermediate	\N	grade10	international	\N	篮球、编程、阅读	\N	\N	\N	\N	\N	\N	\N	\N	website	\N	\N	\N	\N	\N	approved	1	2025-12-14 21:08:05.889186	符合入学条件,批准入学	2025-12-14 13:08:05.859649	2025-12-14 21:08:05.889188	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3	2025-12-14	王小明	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	pending	\N	\N	\N	2025-12-14 13:50:05.065817	2025-12-14 13:50:05.065817	t	王大明	\N	\N	\N	13800138001	wangdaming@example.com	工程师	某某科技公司	\N	\N	李小红	\N	\N	\N	13800138002	lixiaohong@example.com	教师	某某学校	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4	2025-12-14	测试学生	Test Student	\N	\N	\N	\N	13900000000	test@example.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	pending	\N	\N	\N	2025-12-14 13:52:41.204591	2025-12-14 13:52:41.204591	t	父亲姓名	Father Name	中国	110101199001011234	13800000001	father@example.com	软件工程师	某科技公司	北京市朝阳区	010-12345678	母亲姓名	Mother Name	中国	110101199101011234	13800000002	mother@example.com	教师	某学校	北京市海淀区	010-87654321	监护人姓名	祖父	13800000003	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5	2025-12-14	测试学生完整版	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	pending	\N	\N	\N	2025-12-14 14:18:12.086852	2025-12-14 14:18:12.086852	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15	\N	Chinese	Buddhism	Married	\N	\N	\N	\N	\N	[{"name": "兄弟1", "date_of_birth": "2010-01-01", "current_school": "某小学"}]	\N	\N	null	\N	\N	\N	\N	null	null	Non-Vegetarian	f	\N	f	\N	{"asthma": false, "diabetes": false}	null	null	Father	null	null	null
\.


--
-- Data for Name: resource_folder; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resource_folder (id, teacher_id, folder_name, parent_id, description, is_active, created_at, updated_at) FROM stdin;
3	1	Python教程	1	Python编程相关视频	f	2025-11-30 03:56:23.187033	2025-11-30 03:58:52.060206
4	1	待移动文件夹	1	这个文件夹将被移动	f	2025-11-30 03:56:23.194926	2025-11-30 03:58:55.789226
1	1	视频教程（已更新）	\N	更新后的描述	f	2025-11-30 03:56:23.155106	2025-11-30 04:16:41.032704
2	1	课件资料	\N	存放PPT和PDF课件	f	2025-11-30 03:56:23.16595	2025-11-30 04:16:45.384802
10	1	课件资料	\N	存放PPT和PDF课件	f	2025-11-30 03:56:48.02644	2025-11-30 04:16:50.936086
6	1	课件资料	\N	存放PPT和PDF课件	f	2025-11-30 03:56:37.533281	2025-11-30 04:16:58.284908
11	1	Python教程	9	Python编程相关视频	f	2025-11-30 03:56:48.044669	2025-11-30 04:17:08.334802
12	1	待移动文件夹	9	这个文件夹将被移动	f	2025-11-30 03:56:48.055652	2025-11-30 04:17:11.633781
13	1	政治经济学	9	\N	t	2025-11-30 04:17:26.892828	2025-11-30 04:17:26.892834
7	1	Python教程	5	Python编程相关视频	f	2025-11-30 03:56:37.540855	2025-11-30 04:20:04.086036
8	1	待移动文件夹	5	这个文件夹将被移动	f	2025-11-30 03:56:37.54645	2025-11-30 04:20:08.655091
5	1	视频教程（已更新）	9	更新后的描述	t	2025-11-30 03:56:37.526679	2025-11-30 13:38:08.368095
9	1	视频教程（已更新）1	\N	更新后的描述	t	2025-11-30 03:56:48.016638	2025-11-30 13:40:06.670474
14	9	商务数据分析基础	\N	\N	t	2025-12-08 02:11:59.606944	2025-12-08 02:11:59.606946
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
1	10	2	1	\N	85	100	2025-12-05 15:54:19.941952	t	2025-12-05 07:54:19.90267
2	10	2	1	\N	78	100	2025-12-02 15:54:19.943459	t	2025-12-05 07:54:19.90267
3	10	2	1	\N	92	100	2025-11-29 15:54:19.943942	t	2025-12-05 07:54:19.90267
4	10	2	1	\N	88	100	2025-11-26 15:54:19.944318	t	2025-12-05 07:54:19.90267
5	10	2	1	\N	95	100	2025-11-23 15:54:19.944746	t	2025-12-05 07:54:19.90267
6	10	2	1	\N	82	100	2025-11-20 15:54:19.945184	t	2025-12-05 07:54:19.90267
7	10	2	1	\N	90	100	2025-11-17 15:54:19.945582	t	2025-12-05 07:54:19.90267
8	10	2	1	\N	87	100	2025-11-14 15:54:19.945904	t	2025-12-05 07:54:19.90267
9	10	2	1	\N	93	100	2025-11-11 15:54:19.946208	t	2025-12-05 07:54:19.90267
10	10	2	1	\N	89	100	2025-11-08 15:54:19.946532	t	2025-12-05 07:54:19.90267
\.


--
-- Data for Name: student_learning_behavior; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_learning_behavior (id, student_id, course_id, chapter_id, resource_id, resource_type, behavior_type, duration_seconds, description, created_at) FROM stdin;
1	10	2	\N	\N	\N	view_resource	300	查看了教学资源：Python基础入门	2025-12-05 15:54:19.908692
2	10	2	\N	\N	\N	view_resource	600	查看了参考资料：Python官方文档	2025-12-05 13:54:19.91209
3	10	2	\N	\N	\N	complete_section	0	完成了第一章第一节	2025-12-05 11:54:19.912663
4	10	2	\N	\N	\N	view_resource	900	查看了视频：变量和数据类型	2025-12-05 09:54:19.913314
5	10	2	\N	\N	\N	view_resource	450	查看了PPT：函数定义	2025-12-05 07:54:19.914184
6	10	1	\N	19	teaching_resource	view_resource	0	查看资源: 编写湖北工匠杯赛题提示词	2025-12-06 15:40:30.930105
7	10	1	\N	16	teaching_resource	view_resource	0	查看资源: 湖北工匠杯技能大赛技术工作文件 （全媒体运营师-数据分析）	2025-12-06 15:40:33.776091
8	10	1	\N	16	teaching_resource	view_resource	0	查看资源: 湖北工匠杯技能大赛技术工作文件 （全媒体运营师-数据分析）	2025-12-06 15:40:48.404655
9	10	1	\N	16	teaching_resource	view_resource	0	查看资源: 湖北工匠杯技能大赛技术工作文件 （全媒体运营师-数据分析）	2025-12-06 15:42:21.654817
10	10	1	\N	19	teaching_resource	view_resource	0	查看资源: 编写湖北工匠杯赛题提示词	2025-12-06 15:42:51.378302
11	10	1	\N	16	teaching_resource	view_resource	0	查看资源: 湖北工匠杯技能大赛技术工作文件 （全媒体运营师-数据分析）	2025-12-06 15:42:58.985825
12	10	1	\N	16	teaching_resource	view_resource	0	查看资源: 湖北工匠杯技能大赛技术工作文件 （全媒体运营师-数据分析）	2025-12-06 15:43:27.656662
13	10	1	\N	16	teaching_resource	view_resource	0	查看资源: 湖北工匠杯技能大赛技术工作文件 （全媒体运营师-数据分析）	2025-12-06 15:45:18.868245
14	10	1	\N	16	teaching_resource	view_resource	0	查看资源: 湖北工匠杯技能大赛技术工作文件 （全媒体运营师-数据分析）	2025-12-06 15:47:49.425407
15	10	1	\N	16	teaching_resource	view_resource	0	查看资源: 湖北工匠杯技能大赛技术工作文件 （全媒体运营师-数据分析）	2025-12-06 15:47:56.563082
16	10	1	\N	16	teaching_resource	view_resource	0	查看资源: 湖北工匠杯技能大赛技术工作文件 （全媒体运营师-数据分析）	2025-12-06 15:49:46.484857
17	10	1	\N	16	teaching_resource	view_resource	0	查看资源: 湖北工匠杯技能大赛技术工作文件 （全媒体运营师-数据分析）	2025-12-06 15:51:25.655185
18	10	1	\N	19	teaching_resource	view_resource	0	查看资源: 编写湖北工匠杯赛题提示词	2025-12-06 15:51:29.0242
19	10	3	\N	24	teaching	view_resource	0	查看资源: 1.1 数据化时代-250221	2025-12-08 03:32:35.938194
20	10	3	\N	24	teaching	view_resource	0	查看资源: 1.1 数据化时代-250221	2025-12-08 03:38:02.658206
21	10	3	\N	30	teaching	view_resource	0	查看资源: 1.1.1 杨国福	2025-12-08 03:38:28.875855
22	10	3	\N	24	teaching	view_resource	0	查看资源: 1.1 数据化时代-250221	2025-12-08 03:42:48.166086
23	10	3	\N	24	teaching	view_resource	0	查看资源: 1.1 数据化时代-250221	2025-12-08 03:43:06.939631
24	10	3	\N	24	teaching	view_resource	0	查看资源: 1.1 数据化时代-250221	2025-12-08 05:01:18.718768
25	10	3	\N	24	teaching	view_resource	0	查看资源: 1.1 数据化时代-250221	2025-12-08 05:05:25.714602
26	10	3	\N	24	teaching	view_resource	0	查看资源: 1.1 数据化时代-250221	2025-12-08 06:50:06.745173
27	10	3	\N	24	teaching	view_resource	0	查看资源: 1.1 数据化时代-250221	2025-12-08 06:52:46.910611
28	10	3	\N	24	teaching	view_resource	0	查看资源: 1.1 数据化时代-250221	2025-12-08 07:01:03.374378
29	10	3	\N	24	teaching	view_resource	0	查看资源: 1.1 数据化时代-250221	2025-12-08 07:09:56.175684
30	10	3	\N	24	teaching	view_resource	0	查看资源: 1.1 数据化时代-250221	2025-12-08 07:14:16.365123
31	10	3	\N	24	teaching	view_resource	0	查看资源: 1.1 数据化时代-250221	2025-12-08 07:20:54.868446
32	10	3	\N	24	teaching	view_resource	0	查看资源: 1.1 数据化时代-250221	2025-12-08 07:21:07.249831
33	10	3	\N	24	teaching	view_resource	0	查看资源: 1.1 数据化时代-250221	2025-12-08 07:21:14.272505
34	10	3	\N	24	teaching	view_resource	0	查看资源: 1.1 数据化时代-250221	2025-12-08 07:21:24.271607
35	10	3	\N	24	teaching	view_resource	0	查看资源: 1.1 数据化时代-250221	2025-12-08 07:25:49.85538
36	10	3	\N	24	teaching	view_resource	0	查看资源: 1.1 数据化时代-250221	2025-12-08 07:38:41.813185
37	10	3	\N	30	teaching	view_resource	0	查看资源: 1.1.1 杨国福	2025-12-08 07:38:47.332222
38	10	3	\N	25	teaching	view_resource	0	查看资源: 1.2 数据隐私与数据安全-250221	2025-12-08 07:39:00.68055
39	10	3	\N	27	teaching	view_resource	0	查看资源: 1.4 商务数据分析流程-250221	2025-12-08 07:44:16.713052
40	10	3	\N	26	teaching	view_resource	0	查看资源: 1.3 商务数据分析认知-250221	2025-12-08 07:45:06.675717
41	10	3	\N	27	teaching	view_resource	0	查看资源: 1.4 商务数据分析流程-250221	2025-12-08 09:18:02.379597
42	10	3	\N	30	teaching	view_resource	0	查看资源: 1.1.1 杨国福	2025-12-14 07:53:59.648614
43	10	3	\N	24	teaching	view_resource	0	查看资源: 1.1 数据化时代-250221	2025-12-14 07:54:36.379003
\.


--
-- Data for Name: student_profile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_profile (id, user_id, class_id, major_id, student_no, status, created_at, updated_at) FROM stdin;
1	\N	2	1	TEST002	active	2025-11-27 07:22:49.320071	2025-11-27 07:22:49.320071
3	\N	2	1	2502	active	2025-11-27 07:32:52.564101	2025-11-27 07:32:52.564101
4	10	2	1	S202512010001	active	2025-12-04 14:49:10.185972	2025-12-04 14:49:10.185972
2	7	2	1	2501	active	2025-11-27 07:27:41.9462	2025-11-27 07:27:41.9462
\.


--
-- Data for Name: student_study_duration; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_study_duration (id, student_id, course_id, study_date, duration_minutes, created_at, updated_at) FROM stdin;
1	10	2	2025-12-05 15:54:19.91499	111	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
2	10	2	2025-12-04 15:54:19.917611	25	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
3	10	2	2025-12-03 15:54:19.918898	46	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
4	10	2	2025-12-02 15:54:19.92034	119	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
5	10	2	2025-12-01 15:54:19.921259	96	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
6	10	2	2025-11-30 15:54:19.922443	47	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
7	10	2	2025-11-29 15:54:19.924129	3	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
8	10	2	2025-11-28 15:54:19.924791	32	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
9	10	2	2025-11-27 15:54:19.925251	47	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
10	10	2	2025-11-26 15:54:19.925665	25	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
11	10	2	2025-11-25 15:54:19.926024	104	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
12	10	2	2025-11-24 15:54:19.926386	27	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
13	10	2	2025-11-23 15:54:19.926734	120	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
14	10	2	2025-11-22 15:54:19.927056	70	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
15	10	2	2025-11-21 15:54:19.92743	74	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
16	10	2	2025-11-20 15:54:19.927757	101	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
17	10	2	2025-11-19 15:54:19.928081	87	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
18	10	2	2025-11-18 15:54:19.928824	85	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
19	10	2	2025-11-17 15:54:19.929615	98	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
20	10	2	2025-11-16 15:54:19.931419	40	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
21	10	2	2025-11-15 15:54:19.937563	0	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
22	10	2	2025-11-14 15:54:19.938096	0	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
23	10	2	2025-11-13 15:54:19.93846	0	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
24	10	2	2025-11-12 15:54:19.938867	0	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
25	10	2	2025-11-11 15:54:19.939193	0	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
26	10	2	2025-11-10 15:54:19.939542	0	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
27	10	2	2025-11-09 15:54:19.939825	0	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
28	10	2	2025-11-08 15:54:19.940106	0	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
29	10	2	2025-11-07 15:54:19.940429	0	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
30	10	2	2025-11-06 15:54:19.940704	0	2025-12-05 07:54:19.90267	2025-12-05 07:54:19.90267
\.


--
-- Data for Name: sys_class; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sys_class (id, name, code, major_id, grade, semester, created_at, updated_at, is_active) FROM stdin;
2	计科 2401	cs2401	1	2024	2024秋季	2025-11-27 05:13:18.92948+00	\N	t
1	测试班级 1	TEST012	1	2024	2024秋季	2025-11-27 03:45:02.684719+00	2025-12-05 05:29:32.273682+00	t
\.


--
-- Data for Name: sys_user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sys_user (id, username, hashed_password, full_name, email, role, is_active, avatar, created_at, phone, updated_at) FROM stdin;
1	admin	37774fce74c94fd4fffd1b3a2ba3293b1515cce8877516ec00f10899424c5dac	System Admin	admin@example.com	admin	t	\N	2025-11-27 00:21:12.273421	\N	2025-11-27 07:52:32.445301
9	T202511274400	3347c16a082fb0f0f5ef6088ca274c611ee94655a3f11eb1bffe20c4c03165ac	测试教师2	test2@example.com	teacher	t	\N	2025-11-27 09:15:15.229395	13800138002	2025-11-30 03:35:13.932258
10	S202512010001	3347c16a082fb0f0f5ef6088ca274c611ee94655a3f11eb1bffe20c4c03165ac	张三	\N	student	t	\N	2025-12-04 14:09:39.894709	\N	2025-12-04 14:09:39.894709
7	stu001	fc05bb03c81c11112642f95651c45d9f7e0de0649e4b6fb23c5fa7baf94337fa	测试学生	\N	student	t	\N	2025-11-27 07:27:41.942047	13488693201	2025-12-05 05:29:58.16529
\.


--
-- Data for Name: teacher_profile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teacher_profile (id, user_id, major_id, title, intro) FROM stdin;
2	9	1	\N	\N
\.


--
-- Data for Name: teaching_resource; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teaching_resource (id, teacher_id, resource_name, original_filename, file_path, file_size, resource_type, knowledge_point, is_active, created_at, updated_at, folder_id, local_file_path, pdf_path, pdf_local_path, pdf_converted_at, pdf_conversion_status) FROM stdin;
1	9	国家广播电视总局、文化和旅游部《网络主播行为规范》.docx	国家广播电视总局、文化和旅游部《网络主播行为规范》.docx	uploads/teaching_resources/word/57165b4f-28c5-4ceb-9448-c8f8b4405c71.docx	81490	word	\N	f	2025-11-30 03:48:19.201715	2025-12-06 13:57:44.529589	\N	\N	\N	\N	\N	pending
2	1	国家广播电视总局、文化和旅游部《网络主播行为规范》	国家广播电视总局、文化和旅游部《网络主播行为规范》.docx	uploads/teaching_resources/word/bdf9b9a1-0db9-4a64-b0b5-a95a32215693.docx	81490	word	\N	t	2025-11-30 13:41:24.977925	2025-11-30 13:41:24.977931	\N	\N	\N	\N	\N	pending
3	1	网络主播培训大纲	网络主播培训大纲.pdf	uploads/teaching_resources/pdf/778b9c1d-5416-4914-b20a-239d3c31e84f.pdf	5230741	pdf	\N	t	2025-11-30 13:46:18.186331	2025-11-30 13:46:18.186335	\N	\N	\N	\N	\N	pending
4	1	《网络表演（直播与短视频）主播职业能力划分要求》	《网络表演（直播与短视频）主播职业能力划分要求》.md	uploads/teaching_resources/markdown/88f838cb-d180-41d9-af46-845777c3bdab.md	16706	markdown	\N	t	2025-11-30 13:55:38.204805	2025-11-30 13:55:38.204806	\N	\N	\N	\N	\N	pending
5	1	021762862084812a21cf0349c8bc0427e905ed9f1ccac12a0b7f3_0	021762862084812a21cf0349c8bc0427e905ed9f1ccac12a0b7f3_0.jpeg	uploads/teaching_resources/image/3943cc9d-b750-479e-b99c-8494f4e5f715.jpeg	292747	image	\N	t	2025-11-30 13:56:20.584133	2025-11-30 13:56:20.584139	\N	\N	\N	\N	\N	pending
12	9	测试文档-教学资源	案例原文：职业生涯规划案例：技能匹配与发展建议_副本.docx	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/word/90ba88f3-e7d8-4222-867d-86416403b5ce.docx	78669	word	测试知识点	f	2025-12-02 16:20:00.676592	2025-12-02 16:25:31.143975	\N	\N	\N	\N	\N	pending
11	9	测试文档-教学资源	案例原文：职业生涯规划案例：技能匹配与发展建议_副本.docx	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/word/2fb2a110-0c07-4bdd-a77c-a1e39c122aa0.docx	78669	word	测试知识点	f	2025-12-02 16:19:40.853198	2025-12-02 16:25:34.247577	\N	\N	\N	\N	\N	pending
10	9	测试文档-教学资源	案例原文：职业生涯规划案例：技能匹配与发展建议_副本.docx	uploads/teaching_resources/word/7adb6192-a7d4-43ed-9f68-7d1f9b47ce95.docx	78669	word	测试知识点	f	2025-12-02 16:19:14.493389	2025-12-02 16:25:38.313014	\N	\N	\N	\N	\N	pending
9	9	测试文档-教学资源	案例原文：职业生涯规划案例：技能匹配与发展建议_副本.docx	uploads/teaching_resources/word/a92ac624-2e47-4945-aa6a-bc3b965f96b5.docx	78669	word	测试知识点	f	2025-12-02 16:18:54.292786	2025-12-02 16:25:42.270181	\N	\N	\N	\N	\N	pending
8	9	测试文档-教学资源	案例原文：职业生涯规划案例：技能匹配与发展建议_副本.docx	uploads/teaching_resources/word/5fe9ca8b-ccc7-4461-88d4-1b9e10d240cd.docx	78669	word	测试知识点	f	2025-12-02 16:18:15.510204	2025-12-02 16:25:45.691906	\N	\N	\N	\N	\N	pending
7	9	测试文档-教学资源	案例原文：职业生涯规划案例：技能匹配与发展建议_副本.docx	uploads/teaching_resources/word/31ab8ac2-d68a-41d1-84d1-6297caa1560a.docx	78669	word	测试知识点	f	2025-12-02 16:17:15.831667	2025-12-02 16:25:49.971	\N	\N	\N	\N	\N	pending
6	9	案例原文：职业生涯规划案例：技能匹配与发展建议	案例原文：职业生涯规划案例：技能匹配与发展建议.docx	uploads/teaching_resources/word/fa6f732c-218c-4e05-8e36-f24ad839854a.docx	78669	word	\N	f	2025-12-02 16:14:38.934831	2025-12-02 16:25:53.372584	\N	\N	\N	\N	\N	pending
13	9	案例原文：职业生涯规划案例：技能匹配与发展建议	案例原文：职业生涯规划案例：技能匹配与发展建议.docx	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/word/5b0a0a23-7756-4b35-a417-390597fa22d3.docx	78669	word	\N	f	2025-12-02 16:25:59.709075	2025-12-06 13:57:48.250615	\N	\N	\N	\N	\N	pending
14	9	国家广播电视总局、文化和旅游部《网络主播行为规范》	国家广播电视总局、文化和旅游部《网络主播行为规范》.docx	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/word/7f9d67bc-d815-4445-a3a1-a0415898db7e.docx	81490	word	\N	f	2025-12-06 02:53:44.997622	2025-12-06 13:57:52.273072	\N	\N	\N	\N	\N	pending
15	9	preview	preview.doc	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/word/eb9c8ae1-8a55-4f3c-9e30-ceeccf2582ee.doc	81490	word	\N	f	2025-12-06 13:44:43.052695	2025-12-06 13:57:55.676278	\N	uploads/teaching_resources/word/eb9c8ae1-8a55-4f3c-9e30-ceeccf2582ee.doc	\N	\N	\N	pending
17	9	编写湖北工匠杯赛题提示词	编写湖北工匠杯赛题提示词.docx	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/word/e23ccb8d-b315-443f-a7f0-394c42ecd687.docx	33808	word	\N	f	2025-12-06 13:58:13.005021	2025-12-06 13:58:53.282848	\N	uploads/teaching_resources/word/e23ccb8d-b315-443f-a7f0-394c42ecd687.docx	\N	\N	\N	failed
18	9	编写湖北工匠杯赛题提示词	编写湖北工匠杯赛题提示词.docx	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/word/98dac2a1-e425-4960-9971-22a66384cd08.docx	33808	word	\N	f	2025-12-06 13:59:03.754927	2025-12-06 14:02:40.908329	\N	uploads/teaching_resources/word/98dac2a1-e425-4960-9971-22a66384cd08.docx	\N	\N	\N	failed
20	9	网络主播理论考试题库	网络主播理论考试题库.xlsx	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/excel/34ca26e9-afd4-4aea-904d-3ecee9db29e9.xlsx	74674	excel	\N	f	2025-12-06 14:03:46.224951	2025-12-06 14:04:25.57181	\N	uploads/teaching_resources/excel/34ca26e9-afd4-4aea-904d-3ecee9db29e9.xlsx	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/pdfs/excel/34ca26e9-afd4-4aea-904d-3ecee9db29e9.pdf	/Users/duanxiaofei/Desktop/smart learning/backend/uploads/teaching_resources/pdfs/excel/34ca26e9-afd4-4aea-904d-3ecee9db29e9.pdf	2025-12-06 14:03:46.223505	success
16	9	湖北工匠杯技能大赛技术工作文件 （全媒体运营师-数据分析）	湖北工匠杯技能大赛技术工作文件 （全媒体运营师-数据分析）.pdf	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/pdf/0ff78352-605a-487e-ae76-d90929c7385b.pdf	477174	pdf	\N	f	2025-12-06 13:45:47.989442	2025-12-08 02:05:15.036458	\N	uploads/teaching_resources/pdf/0ff78352-605a-487e-ae76-d90929c7385b.pdf	\N	\N	\N	pending
22	9	0ff78352-605a-487e-ae76-d90929c7385b	0ff78352-605a-487e-ae76-d90929c7385b.pdf	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/pdf/2ca3a7d6-629e-4347-a0a9-4dc259714c14.pdf	477174	pdf	\N	f	2025-12-07 13:29:48.795563	2025-12-08 02:05:22.141769	\N	uploads/teaching_resources/pdf/2ca3a7d6-629e-4347-a0a9-4dc259714c14.pdf	\N	\N	\N	pending
21	9	jimeng-2025-11-15-6744	jimeng-2025-11-15-6744.mp4	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/video/38c4ccee-04b9-47fb-84b5-eb4b9c735021.mp4	8077317	video	\N	f	2025-12-07 13:27:38.189216	2025-12-08 02:05:26.62352	\N	uploads/teaching_resources/video/38c4ccee-04b9-47fb-84b5-eb4b9c735021.mp4	\N	\N	\N	pending
23	9	国家广播电视总局、文化和旅游部《网络主播行为规范》	国家广播电视总局、文化和旅游部《网络主播行为规范》.docx	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/word/44a92c49-7ac6-4996-9cd3-02e68a98706a.docx	81490	word	\N	f	2025-12-07 13:50:13.868508	2025-12-08 02:05:19.124002	\N	uploads/teaching_resources/word/44a92c49-7ac6-4996-9cd3-02e68a98706a.docx	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/pdfs/word/44a92c49-7ac6-4996-9cd3-02e68a98706a.pdf	/Users/duanxiaofei/Desktop/smart learning/backend/uploads/teaching_resources/pdfs/word/44a92c49-7ac6-4996-9cd3-02e68a98706a.pdf	2025-12-07 13:50:13.864753	success
19	9	编写湖北工匠杯赛题提示词	编写湖北工匠杯赛题提示词.docx	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/word/ff273625-ad97-4223-83be-69e1bf66ad54.docx	33808	word	\N	f	2025-12-06 14:02:53.039076	2025-12-08 02:05:31.219925	\N	uploads/teaching_resources/word/ff273625-ad97-4223-83be-69e1bf66ad54.docx	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/pdfs/word/ff273625-ad97-4223-83be-69e1bf66ad54.pdf	/Users/duanxiaofei/Desktop/smart learning/backend/uploads/teaching_resources/pdfs/word/ff273625-ad97-4223-83be-69e1bf66ad54.pdf	2025-12-06 14:02:53.037719	success
24	9	1.1 数据化时代-250221	1.1 数据化时代-250221.pdf	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/pdf/d631e361-a033-4b80-864b-f28c3131678e.pdf	4353391	pdf	数据概述	t	2025-12-08 02:12:24.079037	2025-12-08 02:12:24.079042	14	uploads/teaching_resources/pdf/d631e361-a033-4b80-864b-f28c3131678e.pdf	\N	\N	\N	pending
25	9	1.2 数据隐私与数据安全-250221	1.2 数据隐私与数据安全-250221.pdf	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/pdf/995e6153-bfaf-4aa6-8c5e-6d4cd81f6615.pdf	3420645	pdf	数据概述	t	2025-12-08 02:12:46.447323	2025-12-08 02:12:46.447324	14	uploads/teaching_resources/pdf/995e6153-bfaf-4aa6-8c5e-6d4cd81f6615.pdf	\N	\N	\N	pending
26	9	1.3 商务数据分析认知-250221	1.3 商务数据分析认知-250221.pptx	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/ppt/b7fc3671-fd53-4310-9718-66c8fdcce554.pptx	35872763	ppt	数据概述	t	2025-12-08 02:13:33.914467	2025-12-08 02:13:33.914468	14	uploads/teaching_resources/ppt/b7fc3671-fd53-4310-9718-66c8fdcce554.pptx	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/pdfs/ppt/b7fc3671-fd53-4310-9718-66c8fdcce554.pdf	/Users/duanxiaofei/Desktop/smart learning/backend/uploads/teaching_resources/pdfs/ppt/b7fc3671-fd53-4310-9718-66c8fdcce554.pdf	2025-12-08 02:13:33.913721	success
27	9	1.4 商务数据分析流程-250221	1.4 商务数据分析流程-250221.pptx	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/ppt/9e96fdee-8dba-4725-a846-de90e766a059.pptx	18045939	ppt	数据概述	t	2025-12-08 02:14:26.232693	2025-12-08 02:14:26.232696	14	uploads/teaching_resources/ppt/9e96fdee-8dba-4725-a846-de90e766a059.pptx	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/pdfs/ppt/9e96fdee-8dba-4725-a846-de90e766a059.pdf	/Users/duanxiaofei/Desktop/smart learning/backend/uploads/teaching_resources/pdfs/ppt/9e96fdee-8dba-4725-a846-de90e766a059.pdf	2025-12-08 02:14:26.230908	success
28	9	商务数据分析报告：某汽车企业商务数据分析报告	商务数据分析报告：某汽车企业商务数据分析报告.docx	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/word/fdf82dd0-0777-49ae-a678-c79bd90860bc.docx	451331	word	\N	t	2025-12-08 02:14:42.152382	2025-12-08 02:14:42.152383	14	uploads/teaching_resources/word/fdf82dd0-0777-49ae-a678-c79bd90860bc.docx	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/pdfs/word/fdf82dd0-0777-49ae-a678-c79bd90860bc.pdf	/Users/duanxiaofei/Desktop/smart learning/backend/uploads/teaching_resources/pdfs/word/fdf82dd0-0777-49ae-a678-c79bd90860bc.pdf	2025-12-08 02:14:42.151267	success
29	9	《商务数据分析基础》数据集-电子商务2025	《商务数据分析基础》数据集-电子商务2025.xlsx	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/excel/4949591a-8e1d-418c-a675-3bc796116229.xlsx	315408	excel	\N	t	2025-12-08 02:14:55.705818	2025-12-08 02:14:55.705818	14	uploads/teaching_resources/excel/4949591a-8e1d-418c-a675-3bc796116229.xlsx	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/pdfs/excel/4949591a-8e1d-418c-a675-3bc796116229.pdf	/Users/duanxiaofei/Desktop/smart learning/backend/uploads/teaching_resources/pdfs/excel/4949591a-8e1d-418c-a675-3bc796116229.pdf	2025-12-08 02:14:55.704925	success
30	9	1.1.1 杨国福	1.1.1 杨国福.mp4	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/video/41873a8c-ce50-40a0-909b-e8063ee7f4c4.mp4	49982391	video	\N	t	2025-12-08 02:15:15.411333	2025-12-08 02:15:15.411334	14	uploads/teaching_resources/video/41873a8c-ce50-40a0-909b-e8063ee7f4c4.mp4	\N	\N	\N	pending
31	9	1.2.1 数据安全与数据泄露	1.2.1 数据安全与数据泄露.mp4	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/video/5439b137-f98c-43d4-861f-34df72bcabcc.mp4	10751027	video	\N	t	2025-12-08 02:15:32.622673	2025-12-08 02:15:32.622675	14	uploads/teaching_resources/video/5439b137-f98c-43d4-861f-34df72bcabcc.mp4	\N	\N	\N	pending
32	9	3.2.3 实操-异常值处理-去空格	3.2.3 实操-异常值处理-去空格.mp4	https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/video/c778e738-4705-4929-9ff2-9e0d6ac3546b.mp4	3243919	video	\N	t	2025-12-08 02:15:44.213027	2025-12-08 02:15:44.213029	14	uploads/teaching_resources/video/c778e738-4705-4929-9ff2-9e0d6ac3546b.mp4	\N	\N	\N	pending
\.


--
-- Name: class_course_relation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.class_course_relation_id_seq', 6, true);


--
-- Name: course_chapter_exam_paper_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_chapter_exam_paper_id_seq', 1, false);


--
-- Name: course_chapter_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_chapter_id_seq', 28, true);


--
-- Name: course_cover_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_cover_id_seq', 7, true);


--
-- Name: course_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_id_seq', 3, true);


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

SELECT pg_catalog.setval('public.course_section_resource_id_seq', 10, true);


--
-- Name: dictionary_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dictionary_item_id_seq', 13, true);


--
-- Name: dictionary_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dictionary_type_id_seq', 4, true);


--
-- Name: enrollment_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.enrollment_order_id_seq', 1, false);


--
-- Name: exam_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.exam_id_seq', 1, false);


--
-- Name: exam_paper_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.exam_paper_id_seq', 1, true);


--
-- Name: exam_paper_question_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.exam_paper_question_id_seq', 4, true);


--
-- Name: exam_student_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.exam_student_id_seq', 1, false);


--
-- Name: knowledge_graph_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.knowledge_graph_id_seq', 5, true);


--
-- Name: knowledge_node_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.knowledge_node_id_seq', 49, true);


--
-- Name: llm_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.llm_config_id_seq', 6, true);


--
-- Name: major_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.major_id_seq', 12, true);


--
-- Name: organization_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.organization_id_seq', 4, true);


--
-- Name: question_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.question_id_seq', 11, true);


--
-- Name: question_option_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.question_option_id_seq', 19, true);


--
-- Name: reference_folder_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reference_folder_id_seq', 1, false);


--
-- Name: reference_material_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reference_material_id_seq', 5, true);


--
-- Name: registrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.registrations_id_seq', 5, true);


--
-- Name: resource_folder_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resource_folder_id_seq', 14, true);


--
-- Name: semester_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.semester_id_seq', 1, false);


--
-- Name: student_exam_score_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_exam_score_id_seq', 10, true);


--
-- Name: student_learning_behavior_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_learning_behavior_id_seq', 43, true);


--
-- Name: student_profile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_profile_id_seq', 4, true);


--
-- Name: student_study_duration_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_study_duration_id_seq', 30, true);


--
-- Name: sys_class_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sys_class_id_seq', 6, true);


--
-- Name: sys_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sys_user_id_seq', 10, true);


--
-- Name: teacher_profile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.teacher_profile_id_seq', 2, true);


--
-- Name: teaching_resource_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.teaching_resource_id_seq', 32, true);


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
-- Name: major major_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.major
    ADD CONSTRAINT major_pkey PRIMARY KEY (id);


--
-- Name: organization organization_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);


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
-- Name: registrations registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_pkey PRIMARY KEY (id);


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
-- Name: student_learning_behavior student_learning_behavior_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_learning_behavior
    ADD CONSTRAINT student_learning_behavior_pkey PRIMARY KEY (id);


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
-- Name: idx_exam_score_student_course; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_exam_score_student_course ON public.student_exam_score USING btree (student_id, course_id);


--
-- Name: idx_learning_behavior_student_course; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_learning_behavior_student_course ON public.student_learning_behavior USING btree (student_id, course_id);


--
-- Name: idx_registrations_application_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_registrations_application_date ON public.registrations USING btree (application_date);


--
-- Name: idx_registrations_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_registrations_created_at ON public.registrations USING btree (created_at);


--
-- Name: idx_registrations_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_registrations_status ON public.registrations USING btree (status);


--
-- Name: idx_registrations_student_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_registrations_student_name ON public.registrations USING btree (student_name_chinese);


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
-- Name: ix_llm_config_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_llm_config_id ON public.llm_config USING btree (id);


--
-- Name: ix_resource_folder_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_resource_folder_id ON public.resource_folder USING btree (id);


--
-- Name: ix_resource_folder_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_resource_folder_parent_id ON public.resource_folder USING btree (parent_id);


--
-- Name: ix_resource_folder_teacher_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_resource_folder_teacher_id ON public.resource_folder USING btree (teacher_id);


--
-- Name: ix_semester_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_semester_id ON public.semester USING btree (id);


--
-- Name: ix_sys_user_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_sys_user_phone ON public.sys_user USING btree (phone);


--
-- Name: ix_teaching_resource_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_teaching_resource_id ON public.teaching_resource USING btree (id);


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
    ADD CONSTRAINT course_chapter_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.course(id);


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
-- Name: course_chapter course_chapter_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_chapter
    ADD CONSTRAINT course_chapter_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.course_chapter(id);


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
-- Name: organization organization_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization
    ADD CONSTRAINT organization_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.organization(id);


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
    ADD CONSTRAINT student_profile_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.sys_user(id) ON DELETE CASCADE;


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

\unrestrict ucdNaee0cf14kmqgxACyVddpR8IlXbHQy279ucvsFw3w1A5r7jeM7ItcTKGX30O

