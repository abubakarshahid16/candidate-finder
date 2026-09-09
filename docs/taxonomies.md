# Candidate Finder taxonomies

The controlled taxonomies live in `packages/domain/taxonomies.ts` and are versioned with `taxonomyVersion`. They provide stable IDs for search, extraction, filtering, and later score reproducibility while preserving source labels separately.

## Included taxonomies

- Industries: technology, financial services, telecommunications, energy, healthcare, retail/consumer, government/public sector, and professional services.
- Roles: software engineering, data engineering, data science, security, product, project, design, finance, and recruiting.
- Skills: common data, cloud, security, application, and infrastructure skills.
- Education: level-only values from secondary education through doctorate and professional certification.
- Geography: Saudi Arabia, outside Saudi Arabia, remote, willing to relocate, and unknown, plus Saudi regional values.

Taxonomy IDs are internal controlled values. The original source wording should remain attached to the evidence record; synonym resolution must not overwrite that source label.

## Safety rules

The taxonomy contains no age, date of birth, gender, nationality, ethnicity, religion, disability, health, family status, or other protected-trait values. Nationality must not be inferred from geography, name, language, or taxonomy matching. Current location, preferred location, remote availability, relocation, and work authorization remain separate fields.

## Resolution behavior

`resolveTaxonomyItem` normalizes case, whitespace, dots, underscores, and hyphens, then matches an ID, canonical label, or approved synonym. Unknown values return `undefined` and must remain unknown for downstream extraction rather than being guessed.

`classifySaudiLocation` gives explicit remote and relocation statements precedence, then classifies explicit country evidence. Missing country evidence returns `unknown`.
