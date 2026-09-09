BEGIN;

INSERT INTO organizations (id, name, slug) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Demo Recruiting Group', 'demo-recruiting-group');

INSERT INTO users (id, organization_id, email, display_name, role) VALUES
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'recruiter@example.test', 'Demo Recruiter', 'recruiter'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'manager@example.test', 'Demo Hiring Manager', 'hiring_manager');

INSERT INTO requisitions (id, organization_id, owner_user_id, title) VALUES
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Senior Data Engineer — Riyadh');

INSERT INTO jd_versions (id, requisition_id, version_number, source_type, extracted_text, parser_version, created_by) VALUES
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000021', 1, 'pasted_text', 'Synthetic role requiring Python, Spark, cloud data platforms, and five or more years of experience.', 'manual-v1', '00000000-0000-0000-0000-000000000011');

INSERT INTO candidates (id, organization_id, display_name, headline, current_title, current_employer, current_city, current_country, location_classification, relocation_statement, remote_statement, experience_years, experience_basis, confidence) VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Synthetic Candidate A', 'Senior Data Engineer', 'Senior Data Engineer', 'Example Technology Co', 'Riyadh', 'Saudi Arabia', 'saudi_arabia', 'not_stated', 'not_available', 8.0, 'dated_roles', 0.90),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Synthetic Candidate B', 'Data Platform Engineer', 'Data Platform Engineer', 'Example Cloud Ltd', 'London', 'United Kingdom', 'outside_saudi_arabia', 'willing_to_relocate', 'not_stated', 7.5, 'dated_roles_with_one_estimate', 0.78),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'Synthetic Candidate C', 'Remote Analytics Engineer', 'Analytics Engineer', 'Example Remote Studio', NULL, NULL, 'remote', 'unknown', 'explicitly_available', 6.0, 'dated_roles', 0.74),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', 'Synthetic Candidate D', 'Technology Professional', 'Technology Professional', 'Example Directory', NULL, NULL, 'unknown', 'unknown', 'unknown', NULL, 'insufficient_evidence', 0.34);

INSERT INTO sources (id, organization_id, source_type, canonical_url) VALUES
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', 'mock_provider', 'https://synthetic.example.test/candidate-a'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000001', 'mock_provider', 'https://synthetic.example.test/candidate-b'),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000001', 'mock_provider', 'https://synthetic.example.test/candidate-c'),
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000001', 'mock_provider', 'https://synthetic.example.test/candidate-d');

INSERT INTO evidence (id, candidate_id, source_id, field_name, claim, excerpt, confidence, content_hash) VALUES
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', 'skills.python', 'Python is listed as a skill.', 'Synthetic profile lists Python and Spark.', 0.96, 'synthetic-a-python'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', 'location.current', 'Current location is Riyadh, Saudi Arabia.', 'Synthetic profile location: Riyadh, Saudi Arabia.', 0.95, 'synthetic-a-location'),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000202', 'relocation_statement', 'Willingness to relocate to Riyadh is explicitly stated.', 'Synthetic profile says willing to relocate to Riyadh.', 0.88, 'synthetic-b-relocation'),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000203', 'remote_statement', 'Remote availability is explicitly stated.', 'Synthetic profile says available for remote work.', 0.91, 'synthetic-c-remote'),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000204', 'profile.summary', 'Location and key skills are not verified.', 'Synthetic directory entry contains insufficient evidence.', 0.40, 'synthetic-d-insufficient');

INSERT INTO skills (id, name) VALUES
  ('00000000-0000-0000-0000-000000000401', 'Python'),
  ('00000000-0000-0000-0000-000000000402', 'Spark'),
  ('00000000-0000-0000-0000-000000000403', 'Airflow'),
  ('00000000-0000-0000-0000-000000000404', 'Cloud data platforms');

INSERT INTO candidate_skills (candidate_id, skill_id, evidence_id, skill_type) VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000301', 'must_have'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000301', 'must_have'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000401', NULL, 'must_have'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000401', NULL, 'should_have');

INSERT INTO experience (id, candidate_id, title, employer, started_on, is_current, evidence_id) VALUES
  ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000101', 'Senior Data Engineer', 'Example Technology Co', '2022-01-01', true, '00000000-0000-0000-0000-000000000301'),
  ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000102', 'Data Platform Engineer', 'Example Cloud Ltd', '2021-06-01', true, NULL),
  ('00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000103', 'Analytics Engineer', 'Example Remote Studio', '2020-03-01', true, '00000000-0000-0000-0000-000000000304');

INSERT INTO education (id, candidate_id, degree, field_of_study, institution) VALUES
  ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000101', 'BSc', 'Computer Science', 'Synthetic University'),
  ('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000102', 'MSc', 'Data Engineering', 'Synthetic Institute');

INSERT INTO scores (id, requisition_id, candidate_id, score, confidence, model_version, matched_requirements, missing_requirements) VALUES
  ('00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000101', 92, 0.88, 'deterministic-v1', '["Python", "Spark", "8 years"]', '["Airflow"]'),
  ('00000000-0000-0000-0000-000000000702', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000102', 86, 0.76, 'deterministic-v1', '["Python", "7.5 years", "relocation"]', '["work authorization"]'),
  ('00000000-0000-0000-0000-000000000703', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000103', 72, 0.68, 'deterministic-v1', '["Python", "remote availability"]', '["current location", "Spark"]'),
  ('00000000-0000-0000-0000-000000000704', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000104', 42, 0.34, 'deterministic-v1', '[]', '["location", "skills", "experience"]');

INSERT INTO shortlists (id, requisition_id, name, created_by) VALUES
  ('00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-000000000021', 'Initial review', '00000000-0000-0000-0000-000000000011');

INSERT INTO shortlist_items (shortlist_id, candidate_id, status, note, added_by) VALUES
  ('00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-000000000101', 'shortlisted', 'Strong synthetic match; verify Airflow during screening.', '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-000000000102', 'reviewed', 'Verify work authorization and relocation timing.', '00000000-0000-0000-0000-000000000011');

INSERT INTO audit_events (id, organization_id, actor_user_id, event_type, entity_type, entity_id, metadata) VALUES
  ('00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'seed.created', 'requisition', '00000000-0000-0000-0000-000000000021', '{"synthetic": true}'::jsonb);

COMMIT;
