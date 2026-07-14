-- PostgreSQL Database Schema for Medico-Legal Records Management System

-- 1. Users Table (Doctors, Admins, JMOs, Lab Techs)
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'doctor', 'jmo', 'admin', 'lab'
    designation VARCHAR(255) NOT NULL,
    qualifications VARCHAR(255),
    slmc_reg_no VARCHAR(255),
    station VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_picture_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.a. Police Officers Table
CREATE TABLE police_officers (
    reg_no VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    rank VARCHAR(255),
    police_station VARCHAR(255)
);

-- 2. Patients Table
CREATE TABLE patients (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    dob DATE NOT NULL,
    sex VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    nic VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    registered_by_id VARCHAR(50) REFERENCES users(id),
    profile_picture_url VARCHAR(500),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. MLEF Forms (Medico-Legal Examination Forms)
CREATE TABLE mlef_forms (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Part A (Police / Admin)
    police_station VARCHAR(255),
    mlef_no VARCHAR(255),
    date_of_issue DATE,
    reason_for_referring TEXT,
    officer_reg_no VARCHAR(255) REFERENCES police_officers(reg_no),
    part_a_filled_by_id VARCHAR(50) REFERENCES users(id),
    part_a_filled_at TIMESTAMP,
    
    -- Part B (Medical Officer)
    hospital VARCHAR(255),
    ward VARCHAR(255),
    bht_no VARCHAR(255),
    admission_date DATE,
    exam_date_time TIMESTAMP,
    discharge_date DATE,
    exam_place VARCHAR(255),
    -- body_harm_types moved to mlef_body_harm_types child table
    internal_injuries TEXT,
    -- causative_weapon moved to mlef_causative_weapons child table
    causative_weapon_other TEXT,
    hurt_category VARCHAR(50),
    endangers_life VARCHAR(50),
    alcohol_exam VARCHAR(50),
    drugs_exam VARCHAR(50),
    -- sexual_assault_signs moved to mlef_sexual_assault_signs child table
    brief_history TEXT,
    exam_findings TEXT,
    investigations TEXT,
    referrals TEXT,
    other_opinions TEXT,
    remarks TEXT,
    ref_no VARCHAR(255),
    part_b_filled_by VARCHAR(50) REFERENCES users(id),
    part_b_filled_at TIMESTAMP,
    
    lab_request_id VARCHAR(50), -- Linked lab request
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'complete'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) REFERENCES users(id)
);

-- 3.a. MLEF Body Harm Types (Child table for MLEF Form)
CREATE TABLE mlef_body_harm_types (
    id SERIAL PRIMARY KEY,
    mlef_id VARCHAR(50) REFERENCES mlef_forms(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL
);

-- 3.b. MLEF Causative Weapons (Child table for MLEF Form)
CREATE TABLE mlef_causative_weapons (
    id SERIAL PRIMARY KEY,
    mlef_id VARCHAR(50) REFERENCES mlef_forms(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL
);

-- 3.c. MLEF Sexual Assault Signs (Child table for MLEF Form)
CREATE TABLE mlef_sexual_assault_signs (
    id SERIAL PRIMARY KEY,
    mlef_id VARCHAR(50) REFERENCES mlef_forms(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL
);

-- 4. MLR Reports (Medico-Legal Reports)
CREATE TABLE mlr_reports (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    special_investigations TEXT,
    -- non_grievous_nos moved to mlr_non_grievous_nos child table
    death_causing_count VARCHAR(255),
    further_notes TEXT,
    patient_smell_liquor VARCHAR(50),
    under_influence_liquor VARCHAR(50),
    date_of_despatch DATE,
    lab_request_id VARCHAR(50),
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'submitted'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) REFERENCES users(id)
);

-- 4.a. MLR Non-Grievous Nos (Child table for MLR Report)
CREATE TABLE mlr_non_grievous_nos (
    id SERIAL PRIMARY KEY,
    mlr_id VARCHAR(50) REFERENCES mlr_reports(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL
);

CREATE TABLE mlr_blunt_weapon_nos (
    id SERIAL PRIMARY KEY,
    mlr_id VARCHAR(50) REFERENCES mlr_reports(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL
);

CREATE TABLE mlr_blunt_contusion_nos (
    id SERIAL PRIMARY KEY,
    mlr_id VARCHAR(50) REFERENCES mlr_reports(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL
);

CREATE TABLE mlr_cut_nos (
    id SERIAL PRIMARY KEY,
    mlr_id VARCHAR(50) REFERENCES mlr_reports(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL
);

CREATE TABLE mlr_sharp_cutting_nos (
    id SERIAL PRIMARY KEY,
    mlr_id VARCHAR(50) REFERENCES mlr_reports(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL
);

CREATE TABLE mlr_stab_nos (
    id SERIAL PRIMARY KEY,
    mlr_id VARCHAR(50) REFERENCES mlr_reports(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL
);

CREATE TABLE mlr_firearms_nos (
    id SERIAL PRIMARY KEY,
    mlr_id VARCHAR(50) REFERENCES mlr_reports(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL
);

CREATE TABLE mlr_burns_nos (
    id SERIAL PRIMARY KEY,
    mlr_id VARCHAR(50) REFERENCES mlr_reports(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL
);

CREATE TABLE mlr_bite_nos (
    id SERIAL PRIMARY KEY,
    mlr_id VARCHAR(50) REFERENCES mlr_reports(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL
);

-- 5. MLR Injuries Table (Child table for MLR Report)
CREATE TABLE mlr_injuries (
    id SERIAL PRIMARY KEY,
    mlr_id VARCHAR(50) REFERENCES mlr_reports(id) ON DELETE CASCADE,
    injury_no VARCHAR(50) NOT NULL,
    description TEXT NOT NULL
);

-- 6. MLR Grievous Entries Table (Child table for MLR Report)
CREATE TABLE mlr_grievous_entries (
    id VARCHAR(50) PRIMARY KEY,
    mlr_id VARCHAR(50) REFERENCES mlr_reports(id) ON DELETE CASCADE,
    injury_no VARCHAR(50),
    limb VARCHAR(255),
    remarks TEXT
);

-- 7. PMR Reports (Post-Mortem Reports)
CREATE TABLE pmr_forms (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    inquest_no VARCHAR(255),
    place VARCHAR(255),
    courts VARCHAR(255),
    date DATE,
    case_no VARCHAR(255),
    date_time_of_death TIMESTAMP,
    doctor_conducting_id VARCHAR(50) REFERENCES users(id),
    date_time_of_exam TIMESTAMP,
    place_of_exam VARCHAR(255),
    district VARCHAR(255),
    requestor_name VARCHAR(255),
    requestor_designation VARCHAR(255),
    jmo_id VARCHAR(50) REFERENCES users(id),
    lab_request_id VARCHAR(50),
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'submitted'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) REFERENCES users(id)
);

-- 8. PMR Identifiers Table (Child table for PMR Form)
CREATE TABLE pmr_identifiers (
    id SERIAL PRIMARY KEY,
    pmr_id VARCHAR(50) REFERENCES pmr_forms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL
);

-- 9. Lab Requests Table
CREATE TABLE lab_requests (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    requested_by VARCHAR(50) REFERENCES users(id),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    form_type VARCHAR(50) NOT NULL, -- 'mlef', 'mlr', 'pmr'
    form_id VARCHAR(50) NOT NULL,
    -- test_types moved to lab_request_test_types child table
    urgency VARCHAR(50) NOT NULL, -- 'routine', 'urgent', 'stat'
    clinical_history TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    test_results TEXT,
    observations TEXT,
    conclusion TEXT,
    lab_tech_id VARCHAR(50) REFERENCES users(id),
    completed_at TIMESTAMP
);

-- 9.a. Lab Request Test Types (Child table for Lab Requests)
CREATE TABLE lab_request_test_types (
    id SERIAL PRIMARY KEY,
    lab_request_id VARCHAR(50) REFERENCES lab_requests(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL
);
