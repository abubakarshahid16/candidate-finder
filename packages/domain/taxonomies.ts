export type TaxonomyItem = {
  id: string
  label: string
  synonyms: string[]
}

export type GeographyClassification =
  | 'saudi_arabia'
  | 'outside_saudi_arabia'
  | 'remote'
  | 'willing_to_relocate'
  | 'unknown'

export const taxonomyVersion = 'v1'

export const industries: TaxonomyItem[] = [
  { id: 'technology', label: 'Technology', synonyms: ['tech', 'software', 'information technology', 'it'] },
  { id: 'financial_services', label: 'Financial services', synonyms: ['banking', 'fintech', 'finance'] },
  { id: 'telecommunications', label: 'Telecommunications', synonyms: ['telecom', 'telco'] },
  { id: 'energy', label: 'Energy', synonyms: ['oil and gas', 'utilities', 'renewables'] },
  { id: 'healthcare', label: 'Healthcare', synonyms: ['health care', 'medical'] },
  { id: 'retail_consumer', label: 'Retail and consumer', synonyms: ['retail', 'consumer goods', 'ecommerce', 'e-commerce'] },
  { id: 'government_public_sector', label: 'Government and public sector', synonyms: ['government', 'public sector'] },
  { id: 'professional_services', label: 'Professional services', synonyms: ['consulting', 'advisory'] },
]

export const roles: TaxonomyItem[] = [
  { id: 'software_engineer', label: 'Software engineer', synonyms: ['software developer', 'application engineer', 'full stack engineer', 'full-stack engineer'] },
  { id: 'data_engineer', label: 'Data engineer', synonyms: ['data platform engineer', 'big data engineer', 'analytics engineer'] },
  { id: 'data_scientist', label: 'Data scientist', synonyms: ['machine learning scientist', 'applied scientist'] },
  { id: 'security_engineer', label: 'Security engineer', synonyms: ['cybersecurity engineer', 'cloud security engineer', 'information security engineer'] },
  { id: 'product_manager', label: 'Product manager', synonyms: ['product owner', 'technical product manager'] },
  { id: 'project_manager', label: 'Project manager', synonyms: ['program manager', 'delivery manager'] },
  { id: 'designer', label: 'Designer', synonyms: ['product designer', 'ux designer', 'ui designer', 'user experience designer'] },
  { id: 'financial_analyst', label: 'Financial analyst', synonyms: ['finance analyst', 'investment analyst'] },
  { id: 'recruiter', label: 'Recruiter', synonyms: ['talent acquisition', 'technical recruiter'] },
]

export const skills: TaxonomyItem[] = [
  { id: 'python', label: 'Python', synonyms: ['python programming'] },
  { id: 'sql', label: 'SQL', synonyms: ['structured query language'] },
  { id: 'spark', label: 'Apache Spark', synonyms: ['spark', 'pyspark'] },
  { id: 'airflow', label: 'Apache Airflow', synonyms: ['airflow'] },
  { id: 'kubernetes', label: 'Kubernetes', synonyms: ['k8s'] },
  { id: 'aws', label: 'AWS', synonyms: ['amazon web services'] },
  { id: 'azure', label: 'Microsoft Azure', synonyms: ['azure cloud'] },
  { id: 'gcp', label: 'Google Cloud', synonyms: ['gcp', 'google cloud platform'] },
  { id: 'postgresql', label: 'PostgreSQL', synonyms: ['postgres', 'postgres sql'] },
  { id: 'power_bi', label: 'Power BI', synonyms: ['powerbi'] },
  { id: 'dbt', label: 'dbt', synonyms: ['data build tool'] },
  { id: 'terraform', label: 'Terraform', synonyms: ['infrastructure as code', 'iac'] },
  { id: 'linux', label: 'Linux', synonyms: ['unix'] },
  { id: 'react', label: 'React', synonyms: ['react.js', 'reactjs'] },
  { id: 'typescript', label: 'TypeScript', synonyms: ['ts'] },
]

export const educationLevels: TaxonomyItem[] = [
  { id: 'secondary', label: 'Secondary education', synonyms: ['high school', 'secondary school'] },
  { id: 'associate', label: 'Associate degree', synonyms: ['associate diploma'] },
  { id: 'bachelors', label: "Bachelor's degree", synonyms: ['bachelor', 'bsc', 'ba', 'undergraduate'] },
  { id: 'masters', label: "Master's degree", synonyms: ['master', 'msc', 'ma', 'graduate'] },
  { id: 'doctorate', label: 'Doctorate', synonyms: ['phd', 'doctoral'] },
  { id: 'professional_certification', label: 'Professional certification', synonyms: ['certificate', 'certification'] },
]

export const saudiRegions: TaxonomyItem[] = [
  { id: 'riyadh', label: 'Riyadh', synonyms: ['riyadh region'] },
  { id: 'makkah', label: 'Makkah', synonyms: ['mecca', 'makkah region'] },
  { id: 'eastern', label: 'Eastern Province', synonyms: ['eastern province', 'dammam', 'dhahran', 'khobar'] },
  { id: 'madinah', label: 'Madinah', synonyms: ['medina', 'madinah region'] },
  { id: 'asir', label: 'Asir', synonyms: ['asir region', 'abha'] },
  { id: 'other_saudi', label: 'Other Saudi Arabia', synonyms: ['saudi arabia', 'ksa', 'kingdom of saudi arabia'] },
]

export const geographyClassifications: TaxonomyItem[] = [
  { id: 'saudi_arabia', label: 'Saudi Arabia', synonyms: ['ksa', 'kingdom of saudi arabia'] },
  { id: 'outside_saudi_arabia', label: 'Outside Saudi Arabia', synonyms: ['international', 'outside ksa'] },
  { id: 'remote', label: 'Remote', synonyms: ['fully remote', 'remote work'] },
  { id: 'willing_to_relocate', label: 'Willing to relocate', synonyms: ['open to relocation', 'relocation available'] },
  { id: 'unknown', label: 'Unknown', synonyms: ['not stated', 'not specified', 'insufficient evidence'] },
]

export const taxonomyCollections = { industries, roles, skills, educationLevels, saudiRegions, geographyClassifications }

function normalize(value: string) {
  return value.trim().toLocaleLowerCase().replace(/[._-]/g, ' ').replace(/\s+/g, ' ')
}

export function resolveTaxonomyItem(collection: TaxonomyItem[], value: string): TaxonomyItem | undefined {
  const normalized = normalize(value)
  return collection.find((item) => normalize(item.id) === normalized || normalize(item.label) === normalized || item.synonyms.some((synonym) => normalize(synonym) === normalized))
}

export function classifySaudiLocation(country: string | null | undefined, explicitRemote = false, explicitRelocation = false): GeographyClassification {
  if (explicitRemote) return 'remote'
  if (explicitRelocation) return 'willing_to_relocate'
  if (!country) return 'unknown'
  return normalize(country) === 'saudi arabia' || normalize(country) === 'ksa' ? 'saudi_arabia' : 'outside_saudi_arabia'
}
