-- 创建报名申请表（参照 openapply 4步字段，每字段一列）
-- 作者: Cascade
-- 日期: 2026-01-29

CREATE TABLE IF NOT EXISTS enrollment_application (
    id SERIAL PRIMARY KEY,

    -- 核心查询字段
    phone VARCHAR(32) NOT NULL,

    -- 审批状态
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    reject_reason TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by INTEGER REFERENCES sys_user(id),
    rejected_at TIMESTAMP,
    rejected_by INTEGER REFERENCES sys_user(id),

    -- Step 1: Child's Information
    child_photo_url TEXT,
    child_last_name_passport VARCHAR(128),
    child_first_name VARCHAR(128),
    child_name_passport VARCHAR(256),
    child_gender VARCHAR(16),
    child_birth_date DATE,
    child_age INTEGER,
    child_birth_cert_no VARCHAR(64),
    child_birth_country VARCHAR(128),
    child_nationality VARCHAR(128),
    child_nric_no VARCHAR(64),
    child_passport_no VARCHAR(64),
    child_second_nationality VARCHAR(128),

    programme_interested VARCHAR(64),
    enrollment_year VARCHAR(64),
    enrolment_period VARCHAR(64),
    campus VARCHAR(64),

    address_home_street_line1 VARCHAR(255),
    address_home_street_line2 VARCHAR(255),
    address_city VARCHAR(128),
    address_state VARCHAR(128),
    address_country VARCHAR(128),
    address_home_phone_country_code VARCHAR(16),
    address_home_phone_number VARCHAR(32),

    malaysia_address VARCHAR(255),
    malaysia_phone_country_code VARCHAR(16),
    malaysia_phone_number VARCHAR(32),

    contact_email VARCHAR(255),
    require_visa_apply BOOLEAN,

    -- Step 2: Family Information (Parent/Guardian 1)
    parent1_last_name_passport VARCHAR(128),
    parent1_first_name_passport VARCHAR(128),
    parent1_relationship VARCHAR(64),
    parent1_marital_status VARCHAR(32),
    parent1_title VARCHAR(64),
    parent1_nationality VARCHAR(128),
    parent1_passport_no VARCHAR(64),
    parent1_religion VARCHAR(64),

    parent1_local_street_line1 VARCHAR(255),
    parent1_local_street_line2 VARCHAR(255),
    parent1_local_city VARCHAR(128),
    parent1_local_state VARCHAR(128),
    parent1_local_country VARCHAR(128),
    parent1_local_postcode VARCHAR(32),

    parent1_designation_occupation VARCHAR(128),
    parent1_email VARCHAR(255),
    parent1_receive_email_notifications BOOLEAN,

    parent1_company_name VARCHAR(255),
    parent1_company_street_line1 VARCHAR(255),
    parent1_company_street_line2 VARCHAR(255),
    parent1_company_state VARCHAR(128),
    parent1_company_city VARCHAR(128),
    parent1_company_country VARCHAR(128),
    parent1_company_postcode VARCHAR(32),
    parent1_company_phone_country_code VARCHAR(16),
    parent1_company_phone_number VARCHAR(32),

    -- Step 2: Parent/Guardian 2
    parent2_last_name_passport VARCHAR(128),
    parent2_first_name_passport VARCHAR(128),
    parent2_relationship VARCHAR(64),
    parent2_marital_status VARCHAR(32),
    parent2_title VARCHAR(64),
    parent2_nationality VARCHAR(128),
    parent2_passport_no VARCHAR(64),
    parent2_religion VARCHAR(64),

    parent2_local_street_line1 VARCHAR(255),
    parent2_local_street_line2 VARCHAR(255),
    parent2_local_city VARCHAR(128),
    parent2_local_state VARCHAR(128),
    parent2_local_country VARCHAR(128),
    parent2_local_postcode VARCHAR(32),

    parent2_designation_occupation VARCHAR(128),
    parent2_email VARCHAR(255),
    parent2_receive_email_notifications BOOLEAN,

    parent2_company_name VARCHAR(255),
    parent2_company_street_line1 VARCHAR(255),
    parent2_company_street_line2 VARCHAR(255),
    parent2_company_state VARCHAR(128),
    parent2_company_city VARCHAR(128),
    parent2_company_country VARCHAR(128),
    parent2_company_postcode VARCHAR(32),
    parent2_company_phone_country_code VARCHAR(16),
    parent2_company_phone_number VARCHAR(32),

    family_phone_country_code VARCHAR(16),
    family_phone_number VARCHAR(32),

    -- Step 2: Siblings (up to 3)
    sibling1_last_name VARCHAR(128),
    sibling1_first_name VARCHAR(128),
    sibling1_gender VARCHAR(16),
    sibling1_birth_date DATE,
    sibling1_studying_at_fairview BOOLEAN,

    sibling2_last_name VARCHAR(128),
    sibling2_first_name VARCHAR(128),
    sibling2_gender VARCHAR(16),
    sibling2_birth_date DATE,
    sibling2_studying_at_fairview BOOLEAN,

    sibling3_last_name VARCHAR(128),
    sibling3_first_name VARCHAR(128),
    sibling3_gender VARCHAR(16),
    sibling3_birth_date DATE,
    sibling3_studying_at_fairview BOOLEAN,

    family_name_of_school VARCHAR(255),

    -- Step 3: Billing and Emergency Details
    billing_bill_to VARCHAR(64),
    billing_contract_period_academic_year VARCHAR(128),

    emergency1_relationship VARCHAR(64),
    emergency1_last_name VARCHAR(128),
    emergency1_first_name VARCHAR(128),
    emergency1_phone_country_code VARCHAR(16),
    emergency1_phone_number VARCHAR(32),

    emergency2_relationship VARCHAR(64),
    emergency2_last_name VARCHAR(128),
    emergency2_first_name VARCHAR(128),
    emergency2_phone_country_code VARCHAR(16),
    emergency2_phone_number VARCHAR(32),

    emergency3_relationship VARCHAR(64),
    emergency3_last_name VARCHAR(128),
    emergency3_first_name VARCHAR(128),
    emergency3_phone_country_code VARCHAR(16),
    emergency3_phone_number VARCHAR(32),

    -- Step 4: Additional Information
    prev_school1_name VARCHAR(255),
    prev_school1_joining_date DATE,
    prev_school1_leaving_date DATE,
    prev_school1_grade_level VARCHAR(128),
    prev_school1_reason_for_leaving VARCHAR(255),

    has_double_promotion BOOLEAN,
    has_disciplinary_issues BOOLEAN,

    co_curricular_sports VARCHAR(255),
    co_curricular_clubs VARCHAR(255),

    has_gifted_programme BOOLEAN,
    has_special_education_support BOOLEAN,
    has_assessed_by_psychologist BOOLEAN,

    health_dietary VARCHAR(64),

    health_condition_asthma BOOLEAN,
    health_condition_epilepsy BOOLEAN,
    health_condition_fits_due_to_high_fever BOOLEAN,
    health_condition_kidney_disease BOOLEAN,
    health_condition_heart_problem BOOLEAN,
    health_condition_diabetes_mellitus BOOLEAN,
    health_condition_blood_disorder BOOLEAN,
    health_condition_adhd BOOLEAN,
    health_condition_psychological_disorder BOOLEAN,
    health_condition_dyslexia BOOLEAN,
    health_condition_learning_difficulties BOOLEAN,
    health_condition_others BOOLEAN,

    infection_measles BOOLEAN,
    infection_chicken_pox BOOLEAN,
    infection_mumps BOOLEAN,
    infection_others BOOLEAN,

    heard_about_us VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_enrollment_application_phone ON enrollment_application(phone);
CREATE INDEX IF NOT EXISTS idx_enrollment_application_status ON enrollment_application(status);
CREATE INDEX IF NOT EXISTS idx_enrollment_application_created ON enrollment_application(created_at DESC);

COMMENT ON TABLE enrollment_application IS '报名申请表（参照 openapply 表单）';
COMMENT ON COLUMN enrollment_application.status IS '审批状态：pending/approved/rejected';
