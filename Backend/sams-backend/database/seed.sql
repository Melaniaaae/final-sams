-- ============================================================
-- SAMS DATABASE SEED SCRIPT
-- Run this AFTER running: alembic upgrade head
-- This script creates the database and populates sample data
-- Usage: mysql -u root -p < seed.sql
-- ============================================================

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS sams_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sams_db;

-- ── Staff (Lecturers + Coordinator) ──────────────────────────────────────
-- Passwords are all: Sams@2025
-- bcrypt hash of "Sams@2025"
INSERT INTO staff (staff_id, name, email, department, phone_number, role, hashed_password, created_at, updated_at)
VALUES
  (
    'COORD001',
    'Dr. Amina Kariuki',
    'a.kariuki@ku.ac.ke',
    'Computer Science',
    '+254722000001',
    'coordinator',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhBXUBWt3OyoFRvxu2hLdK',
    NOW(), NOW()
  ),
  (
    'LEC001',
    'Dr. Ruth Wangeci',
    'r.wangeci@ku.ac.ke',
    'Computer Science',
    '+254722987654',
    'lecturer',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhBXUBWt3OyoFRvxu2hLdK',
    NOW(), NOW()
  ),
  (
    'LEC002',
    'Dr. James Mutai',
    'j.mutai@ku.ac.ke',
    'Information Technology',
    '+254733456789',
    'lecturer',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhBXUBWt3OyoFRvxu2hLdK',
    NOW(), NOW()
  ),
  (
    'LEC003',
    'Dr. Peter Njoroge',
    'p.njoroge@ku.ac.ke',
    'Computer Science',
    '+254711234567',
    'lecturer',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhBXUBWt3OyoFRvxu2hLdK',
    NOW(), NOW()
  ),
  (
    'LEC004',
    'Dr. Sarah Mwende',
    's.mwende@ku.ac.ke',
    'Software Engineering',
    '+254720876543',
    'lecturer',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhBXUBWt3OyoFRvxu2hLdK',
    NOW(), NOW()
  );

-- ── Companies ─────────────────────────────────────────────────────────────
INSERT INTO companies (company_name, industry, location_lat, location_long, town_city, county, contact_person_name, contact_person_phone, created_at, updated_at)
VALUES
  ('Safaricom PLC', 'Telecommunications', -1.2921, 36.8219, 'Westlands', 'Nairobi', 'HR Manager', '+254722000100', NOW(), NOW()),
  ('KCB Group', 'Banking & Finance', -1.2864, 36.8233, 'Upper Hill', 'Nairobi', 'HR Manager', '+254711000200', NOW(), NOW()),
  ('Nation Media Group', 'Media & Publishing', -1.3004, 36.8209, 'Industrial Area', 'Nairobi', 'HR Manager', '+254733000300', NOW(), NOW()),
  ('Equity Bank', 'Banking & Finance', -1.2916, 36.8204, 'Upper Hill', 'Nairobi', 'HR Manager', '+254720000400', NOW(), NOW()),
  ('Airtel Kenya', 'Telecommunications', -1.2881, 36.8147, 'Westlands', 'Nairobi', 'HR Manager', '+254700000500', NOW(), NOW()),
  ('Kenya Power', 'Utilities', -1.2973, 36.8212, 'Stima Plaza', 'Nairobi', 'HR Manager', '+254719000600', NOW(), NOW());

-- ── Students ──────────────────────────────────────────────────────────────
-- Passwords are all: Sams@2025
INSERT INTO students (reg_no, name, email, phone_number, department, hashed_password, staff_id, created_at, updated_at)
VALUES
  ('SCT/2021/045', 'Jane Muthoni Kamau',  'j.muthoni@students.ku.ac.ke',  '+254700123456', 'Computer Science', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhBXUBWt3OyoFRvxu2hLdK', 'LEC001', NOW(), NOW()),
  ('SCT/2021/091', 'Kevin Otieno',         'k.otieno@students.ku.ac.ke',   '+254701234567', 'Computer Science', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhBXUBWt3OyoFRvxu2hLdK', 'LEC002', NOW(), NOW()),
  ('SCT/2021/067', 'Amara Wekesa',         'a.wekesa@students.ku.ac.ke',   '+254702345678', 'Information Technology', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhBXUBWt3OyoFRvxu2hLdK', NULL,     NOW(), NOW()),
  ('SCT/2021/023', 'Brian Mutua',          'b.mutua@students.ku.ac.ke',    '+254703456789', 'Software Engineering', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhBXUBWt3OyoFRvxu2hLdK', 'LEC003', NOW(), NOW()),
  ('SCT/2021/034', 'Grace Achieng',        'g.achieng@students.ku.ac.ke',  '+254704567890', 'Computer Science', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhBXUBWt3OyoFRvxu2hLdK', 'LEC001', NOW(), NOW());

-- ── Placements ────────────────────────────────────────────────────────────
INSERT INTO placements (company_id, reg_no, start_date, end_date, created_at, updated_at)
VALUES
  (1, 'SCT/2021/045', '2025-02-03', '2025-05-15', NOW(), NOW()),  -- Jane @ Safaricom
  (2, 'SCT/2021/091', '2025-02-03', '2025-05-15', NOW(), NOW()),  -- Kevin @ KCB
  (4, 'SCT/2021/023', '2025-02-03', '2025-05-15', NOW(), NOW()),  -- Brian @ Equity
  (5, 'SCT/2021/034', '2025-02-03', '2025-05-15', NOW(), NOW());  -- Grace @ Airtel
  -- Note: Amara (SCT/2021/067) has no placement — she shows as "pending"

-- ── Weekly Logs ───────────────────────────────────────────────────────────
INSERT INTO weekly_logs (placement_id, company_id, week_no, activity_description, submission_date, station_supervisor_name, station_supervisor_phone, status, created_at, updated_at)
VALUES
  -- Jane's logs (placement_id = 1)
  (1, 1, 1, 'Orientation and company induction. Met team members and setup development environment.', '2025-02-21', 'Mr. Brian Ochieng', '+254712345678', 'reviewed',  NOW(), NOW()),
  (1, 1, 2, 'Team introductions and project briefing. Began learning internal tools.', '2025-02-28', 'Mr. Brian Ochieng', '+254712345678', 'reviewed',  NOW(), NOW()),
  (1, 1, 3, 'Started working on REST API integration for the billing module.', '2025-03-07', 'Mr. Brian Ochieng', '+254712345678', 'submitted',  NOW(), NOW()),
  (1, 1, 4, 'Database schema design for the customer portal. Reviewed by senior engineer.', '2025-03-14', 'Mr. Brian Ochieng', '+254712345678', 'submitted',  NOW(), NOW()),
  (1, 1, 6, 'Unit testing and code review sessions. Fixed 12 bugs.', '2025-03-28', 'Mr. Brian Ochieng', '+254712345678', 'submitted',  NOW(), NOW()),
  (1, 1, 7, 'Worked on REST API integration and documentation.', '2025-04-04', 'Mr. Brian Ochieng', '+254712345678', 'submitted',  NOW(), NOW()),
  -- Week 5 is intentionally missing for Jane — used to test missing log notifications

  -- Kevin's logs (placement_id = 2)
  (2, 2, 1, 'Bank orientation and compliance training.', '2025-02-21', 'Ms. Lucy Kamau', '+254711222333', 'submitted', NOW(), NOW()),
  (2, 2, 2, 'Shadowed senior analysts in the retail banking division.', '2025-02-28', 'Ms. Lucy Kamau', '+254711222333', 'submitted', NOW(), NOW()),
  (2, 2, 3, 'Assisted with customer account reconciliation.', '2025-03-07', 'Ms. Lucy Kamau', '+254711222333', 'submitted', NOW(), NOW()),
  (2, 2, 4, 'Prepared monthly financial reports using Excel.', '2025-03-14', 'Ms. Lucy Kamau', '+254711222333', 'submitted', NOW(), NOW());

-- ── Final Reports ─────────────────────────────────────────────────────────
INSERT INTO final_reports (reg_no, submission_date, report_file_upload, completion_status, created_at, updated_at)
VALUES
  ('SCT/2021/045', NULL, NULL, 'pending', NOW(), NOW()),
  ('SCT/2021/091', NULL, NULL, 'pending', NOW(), NOW()),
  ('SCT/2021/023', NULL, NULL, 'pending', NOW(), NOW()),
  ('SCT/2021/034', '2025-05-16', NULL, 'submitted', NOW(), NOW());

-- ── Field Visits ──────────────────────────────────────────────────────────
INSERT INTO field_visits (placement_id, reg_no, staff_id, visit_date, comments, visit_form_upload, created_at, updated_at)
VALUES
  (1, 'SCT/2021/045', 'LEC001', '2025-03-20', 'Student is progressing well. Engaged with the team professionally.', NULL, NOW(), NOW()),
  (4, 'SCT/2021/034', 'LEC001', '2025-04-10', 'Excellent performance. Report recommended for early completion.', NULL, NOW(), NOW());

SELECT 'Seed data inserted successfully!' AS status;
