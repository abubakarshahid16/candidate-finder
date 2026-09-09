CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('recruiter', 'hiring_manager', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, email)
);

CREATE TABLE requisitions (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'paused', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE jd_versions (
  id UUID PRIMARY KEY,
  requisition_id UUID NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  source_type TEXT NOT NULL CHECK (source_type IN ('pasted_text', 'txt', 'pdf', 'docx')),
  original_filename TEXT,
  extracted_text TEXT NOT NULL,
  parser_version TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (requisition_id, version_number)
);

CREATE TABLE candidates (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  headline TEXT,
  current_title TEXT,
  current_employer TEXT,
  current_city TEXT,
  current_country TEXT,
  location_classification TEXT NOT NULL CHECK (location_classification IN ('saudi_arabia', 'outside_saudi_arabia', 'remote', 'unknown')),
  relocation_statement TEXT CHECK (relocation_statement IN ('willing_to_relocate', 'not_stated', 'not_willing', 'unknown')),
  remote_statement TEXT CHECK (remote_statement IN ('explicitly_available', 'not_stated', 'not_available', 'unknown')),
  experience_years NUMERIC(4,1) CHECK (experience_years >= 0),
  experience_basis TEXT,
  confidence NUMERIC(4,3) CHECK (confidence BETWEEN 0 AND 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sources (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('public_profile', 'portfolio', 'publication', 'user_supplied_url', 'mock_provider')),
  canonical_url TEXT NOT NULL,
  permitted_use TEXT NOT NULL DEFAULT 'synthetic_demo',
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, canonical_url)
);

CREATE TABLE evidence (
  id UUID PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
  field_name TEXT NOT NULL,
  claim TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  confidence NUMERIC(4,3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  is_explicit BOOLEAN NOT NULL DEFAULT true,
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  content_hash TEXT NOT NULL
);

CREATE TABLE skills (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  taxonomy_version TEXT NOT NULL DEFAULT 'v1'
);

CREATE TABLE candidate_skills (
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
  evidence_id UUID REFERENCES evidence(id) ON DELETE SET NULL,
  skill_type TEXT NOT NULL DEFAULT 'other' CHECK (skill_type IN ('must_have', 'should_have', 'other')),
  PRIMARY KEY (candidate_id, skill_id)
);

CREATE TABLE experience (
  id UUID PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  employer TEXT NOT NULL,
  started_on DATE,
  ended_on DATE,
  is_current BOOLEAN NOT NULL DEFAULT false,
  evidence_id UUID REFERENCES evidence(id) ON DELETE SET NULL,
  CHECK (ended_on IS NULL OR started_on IS NULL OR ended_on >= started_on)
);

CREATE TABLE education (
  id UUID PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  degree TEXT NOT NULL,
  field_of_study TEXT,
  institution TEXT NOT NULL,
  evidence_id UUID REFERENCES evidence(id) ON DELETE SET NULL
);

CREATE TABLE scores (
  id UUID PRIMARY KEY,
  requisition_id UUID NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  confidence NUMERIC(4,3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  model_version TEXT NOT NULL,
  matched_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (requisition_id, candidate_id, model_version)
);

CREATE TABLE shortlists (
  id UUID PRIMARY KEY,
  requisition_id UUID NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE shortlist_items (
  shortlist_id UUID NOT NULL REFERENCES shortlists(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'shortlisted', 'maybe', 'rejected')),
  note TEXT,
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (shortlist_id, candidate_id)
);

CREATE TABLE audit_events (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX candidates_org_location_idx ON candidates (organization_id, location_classification);
CREATE INDEX candidate_skills_skill_idx ON candidate_skills (skill_id);
CREATE INDEX evidence_candidate_idx ON evidence (candidate_id, field_name);
CREATE INDEX scores_requisition_idx ON scores (requisition_id, score DESC);
CREATE INDEX audit_events_org_time_idx ON audit_events (organization_id, created_at DESC);
