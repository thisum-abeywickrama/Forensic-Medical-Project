-- PostgreSQL Database Schema for Medico-Legal Records Management System

-- 1. Users Table (Doctors, Admins, JMOs, Lab Techs)
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'doctor', 'jmo', 'admin', 'lab'
    designation VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_picture_url VARCHAR(500),
    -- Email verification: a user must confirm their address once before first login
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_code_hash VARCHAR(255),      -- bcrypt hash of the 6-digit code, never the code itself
    verification_expires_at TIMESTAMP,
    verification_sent_at TIMESTAMP,           -- used to throttle resend requests
    verification_attempts INTEGER NOT NULL DEFAULT 0,
    -- Password reset: same emailed-code mechanism as verification, kept in
    -- separate columns so a reset in progress cannot clash with a verification
    reset_code_hash VARCHAR(255),
    reset_expires_at TIMESTAMP,
    reset_sent_at TIMESTAMP,
    reset_attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    registered_by VARCHAR(255) NOT NULL, -- name of user
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
    examinee_name VARCHAR(255),
    examinee_address TEXT,
    examinee_age VARCHAR(50),
    examinee_sex VARCHAR(50),
    reason_for_referring TEXT,
    officer_name VARCHAR(255),
    officer_rank VARCHAR(255),
    officer_reg_no VARCHAR(255),
    officer_police_station VARCHAR(255),
    part_a_filled_by VARCHAR(255),
    part_a_filled_at TIMESTAMP,
    
    -- Part B (Medical Officer)
    hospital VARCHAR(255),
    ward VARCHAR(255),
    bht_no VARCHAR(255),
    admission_date DATE,
    exam_date_time TIMESTAMP,
    discharge_date DATE,
    exam_place VARCHAR(255),
    body_harm_types TEXT[], -- Array of strings e.g. ['laceration', 'contusion']
    internal_injuries TEXT,
    causative_weapon TEXT[], -- Array of strings
    causative_weapon_other TEXT,
    hurt_category VARCHAR(50),
    endangers_life VARCHAR(50),
    alcohol_exam VARCHAR(50),
    drugs_exam VARCHAR(50),
    sexual_assault_signs TEXT[], -- Array of strings
    brief_history TEXT,
    exam_findings TEXT,
    investigations TEXT,
    referrals TEXT,
    other_opinions TEXT,
    remarks TEXT,
    doctor_name VARCHAR(255),
    doctor_qualifications VARCHAR(255),
    slmc_reg_no VARCHAR(255),
    doctor_designation VARCHAR(255),
    ref_no VARCHAR(255),
    part_a_pdf_url VARCHAR(500),
    part_b_pdf_url VARCHAR(500),
    part_b_filled_by VARCHAR(50) REFERENCES users(id),
    part_b_filled_at TIMESTAMP,
    
    lab_request_id VARCHAR(50), -- Linked lab request
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'complete'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) REFERENCES users(id)
);

-- 4. MLR Reports (Medico-Legal Reports)
CREATE TABLE mlr_reports (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    special_investigations TEXT,
    non_grievous_nos TEXT[], -- Array of injury numbers
    death_causing_count VARCHAR(255),
    blunt_weapon_nos VARCHAR(255),
    blunt_contusion_nos VARCHAR(255),
    cut_nos VARCHAR(255),
    sharp_cutting_nos VARCHAR(255),
    stab_nos VARCHAR(255),
    firearms_nos VARCHAR(255),
    burns_nos VARCHAR(255),
    bite_nos VARCHAR(255),
    further_notes TEXT,
    patient_smell_liquor VARCHAR(50),
    under_influence_liquor VARCHAR(50),
    doctor_name VARCHAR(255),
    doctor_qualifications VARCHAR(255),
    designation VARCHAR(255),
    station VARCHAR(255),
    date_of_despatch DATE,
    lab_request_id VARCHAR(50),
    pdf_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'submitted'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) REFERENCES users(id)
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
    deceased_name VARCHAR(255),
    date_time_of_death TIMESTAMP,
    doctor_conducting VARCHAR(255),
    date_time_of_exam TIMESTAMP,
    place_of_exam VARCHAR(255),
    district VARCHAR(255),
    requestor_name VARCHAR(255),
    requestor_designation VARCHAR(255),
    jmo_name VARCHAR(255),
    lab_request_id VARCHAR(50),
    pdf_url VARCHAR(500),
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
    requested_by_name VARCHAR(255),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    form_type VARCHAR(50) NOT NULL, -- 'mlef', 'mlr', 'pmr'
    form_id VARCHAR(50) NOT NULL,
    test_types TEXT[], -- Array of test types e.g. ['toxicology', 'blood_alcohol']
    urgency VARCHAR(50) NOT NULL, -- 'routine', 'urgent', 'stat'
    clinical_history TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    test_results TEXT,
    observations TEXT,
    conclusion TEXT,
    lab_tech_name VARCHAR(255),
    completed_at TIMESTAMP
);
