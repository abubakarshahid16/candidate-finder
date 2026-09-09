const endpoint = (summary, security = true, requestBody = null) => ({ summary, ...(security ? { security: [{ bearerAuth: [] }] } : {}), ...(requestBody ? { requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } } } } : {}), responses: { '200': { description: 'Success' }, '400': { description: 'Invalid request' }, '401': { description: 'Authentication required' }, '403': { description: 'Forbidden' }, '404': { description: 'Not found' }, '500': { description: 'Service failure' } } })

export const openapi = {
  openapi: '3.0.3',
  info: { title: 'Candidate Finder API', version: 'local-v1', description: 'Local-first, evidence-backed candidate discovery API. Development data and tokens are synthetic.' },
  servers: [{ url: 'http://localhost:3001', description: 'Local Docker Compose API' }],
  tags: [{ name: 'System' }, { name: 'Auth' }, { name: 'Search' }, { name: 'Providers' }, { name: 'Recruiting' }, { name: 'Governance' }],
  components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'development-token' } } },
  paths: {
    '/health': { get: endpoint('Process health', false) },
    '/ready': { get: endpoint('PostgreSQL and Redis readiness', false) },
    '/api/v1/health': { get: endpoint('Versioned readiness', false) },
    '/metrics': { get: endpoint('Local operational metrics', false) },
    '/api/v1/auth/login': { post: endpoint('Login with a synthetic development user', false, true) },
    '/api/v1/auth/development-users': { get: endpoint('List synthetic development users', false) },
    '/api/v1/me': { get: endpoint('Current authenticated user') },
    '/api/v1/organization': { get: endpoint('Current organization') },
    '/api/v1/candidates': { get: endpoint('Organization-scoped candidate list') },
    '/api/v1/searches': { post: endpoint('Run a synchronous structured-filter search', true, true) },
    '/api/v1/search-jobs': { post: endpoint('Create an asynchronous Redis-backed search job', true, true) },
    '/api/v1/search-jobs/{jobId}': { get: endpoint('Read an organization-scoped search job') },
    '/api/v1/providers': { get: endpoint('Provider capability registry') },
    '/api/v1/providers/health': { get: endpoint('Provider source health') },
    '/api/v1/providers/ingest': { post: endpoint('Ingest a permitted public URL', true, true) },
    '/api/v1/providers/github/search': { get: endpoint('Search the configured free/public provider adapter') },
    '/api/v1/job-descriptions': { get: endpoint('List local requisition job descriptions'), post: endpoint('Create a job-description requirement profile', true, true) },
    '/api/v1/ats/score': { post: endpoint('Calculate deterministic ATS score', true, true) },
    '/api/v1/candidate-intelligence/extract': { post: endpoint('Extract job-relevant candidate facts with evidence', true, true) },
    '/api/v1/candidate-intelligence/duplicates': { post: endpoint('Find reviewable duplicate candidates', true, true) },
    '/api/v1/reviews': { post: endpoint('Create a shortlist review action', true, true) },
    '/api/v1/reviews/{reviewId}': { get: endpoint('Read a review record'), patch: endpoint('Update a review record', true, true) },
    '/api/v1/audit-events': { get: endpoint('Read organization audit events') },
    '/api/v1/sources': { get: endpoint('Read source coverage and capabilities') },
    '/api/v1/exports/candidates': { post: endpoint('Export organization-scoped candidates', true, true) },
    '/api/v1/candidates/compare': { post: endpoint('Compare candidates for a requisition', true, true) },
    '/api/v1/integrations/writeback/preview': { post: endpoint('Preview recruiter-confirmed integration writeback', true, true) },
  },
}

export function docsHtml() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Candidate Finder API</title><style>body{font-family:Inter,system-ui,Arial;margin:0;background:#f6f7f8;color:#20252a}header{background:#173f3b;color:white;padding:28px 7vw}main{max-width:1100px;margin:28px auto;padding:0 20px}.note,.endpoint{background:white;border:1px solid #dfe4e5;border-radius:10px;margin:10px 0;padding:16px}.note{border-radius:12px}.row{display:flex;align-items:center;gap:12px}.method{font:700 11px monospace;border-radius:5px;padding:5px 8px;color:white;background:#28604e}.path{font:600 14px monospace}.desc{color:#6f7d82;font-size:13px;margin-left:auto}.details{margin-top:12px;border-top:1px solid #edf0f0;padding-top:12px;color:#69757b;font-size:12px}.try{margin-top:12px;padding:12px;background:#fbfcfc;border-radius:8px}.try textarea,.try input{width:100%;min-height:38px;box-sizing:border-box;margin:8px 0;border:1px solid #dfe4e5;border-radius:6px;padding:8px;font-family:monospace;font-size:12px}.try textarea{min-height:70px}.try button{background:#173f3b;color:white;border:0;border-radius:6px;padding:8px 12px;cursor:pointer}.response{white-space:pre-wrap;background:#20252a;color:#d9efe5;border-radius:6px;padding:10px;margin-top:8px;max-height:260px;overflow:auto}.token{width:100%;box-sizing:border-box;border:1px solid #dfe4e5;border-radius:6px;padding:9px;margin:8px 0}.link{color:#d9efe5}a{color:#28604e}</style></head><body><header><h1>Candidate Finder API</h1><p>Local OpenAPI v1 · <a class="link" href="/openapi.json">Download openapi.json</a></p></header><main><div class="note"><strong>Try APIs locally</strong><br><label>Bearer token</label><input id="token" class="token" value="dev-recruiter-token"><small>Use <code>dev-admin-token</code> for admin-only endpoints. These are synthetic development credentials.</small></div><div id="api"></div></main><script>const spec=${JSON.stringify(openapi)};const root=document.querySelector('#api');for(const [path,methods] of Object.entries(spec.paths)){for(const [method,op] of Object.entries(methods)){const id=Math.random().toString(36).slice(2);const isWrite=['post','patch','put'].includes(method);const needsId=path.includes('{');const param=needsId?'<input class="param" placeholder="Enter '+(path.includes('jobId')?'job ID':'review ID')+'">':'';const body=isWrite?'<textarea id="body-'+id+'">{}</textarea>':'';const el=document.createElement('section');el.className='endpoint';el.innerHTML='<div class="row"><span class="method">'+method.toUpperCase()+'</span><span class="path">'+path+'</span><span class="desc">'+op.summary+'</span></div><div class="details">'+(op.security?'Authentication required · ':'Public endpoint · ')+'Responses: '+Object.keys(op.responses).join(', ')+'</div><div class="try">'+param+body+'<button>Try request</button><div class="response" hidden></div></div>';const button=el.querySelector('button');const output=el.querySelector('.response');button.onclick=async()=>{let url=path;if(needsId){const value=el.querySelector('.param').value.trim();if(!value){output.hidden=false;output.textContent='Enter the required ID first';return}url=url.replace('{jobId}',value).replace('{reviewId}',value)}const options={method:method.toUpperCase(),headers:{}};if(op.security)options.headers.Authorization='Bearer '+document.querySelector('#token').value;if(isWrite){options.headers['Content-Type']='application/json';try{JSON.parse(el.querySelector('textarea').value)}catch{output.hidden=false;output.textContent='Invalid JSON body';return}options.body=el.querySelector('textarea').value}try{const res=await fetch(url,options);const text=await res.text();output.hidden=false;output.textContent=res.status+' '+res.statusText+'\\n'+text}catch(error){output.hidden=false;output.textContent='Request failed: '+error.message}};root.appendChild(el)}}</script></body></html>`
}
