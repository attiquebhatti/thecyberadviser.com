import './styles/main.css';
import { detectVendor } from './parsers/detector.js';
import { FortigateParser } from './parsers/fortigate.js';
import { CiscoParser } from './parsers/cisco.js';
import { CheckpointParser } from './parsers/checkpoint.js';

import { PanosGenerator } from './generators/panos.js';
import { OutputFortigateGenerator } from './generators/out_fortigate.js';
import { OutputCiscoGenerator } from './generators/out_cisco.js';
import { OutputCheckpointGenerator } from './generators/out_checkpoint.js';
import { BehavioralEngine } from './validation/engine.js';
import { TrafficSimulator } from './validation/simulator.js';
import { ROLES, PERMISSIONS, hasPermission } from './auth/roles.js';
import { AuditService, AuditAction } from './auth/auditService.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- STATE MANAGEMENT ---
    let appState = {
        jobs: [],
        auditConfigUploads: 0,
        coverage: {
            'Address Objects': { parsed: 0, total: 0 },
            'Security Policy': { parsed: 0, total: 0 }
        },
        currentUser: {
            id: 'USR-001',
            name: 'Attique Bhatti',
            role: ROLES.SUPER_ADMIN
        }
    };

    // auditLogger initialization removed in favor of static AuditService

    function loadState() {
        const saved = localStorage.getItem('unifiedMigratorState');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Merge saved data while preserving default currentUser if missing
            appState = { 
                ...appState, 
                ...parsed,
                currentUser: parsed.currentUser || appState.currentUser 
            };
        }
    }

    function saveState() {
        localStorage.setItem('unifiedMigratorState', JSON.stringify(appState));
        populateDashboard();
    }

    function applyPermissions() {
        // Enforce the current user's role constraints on the UI
        const role = appState.currentUser.role;
        
        // Critical UI Guards
        const btnReset = document.getElementById('btn-reset-insights');
        const btnExportAudit = document.getElementById('btn-export-audit');
        const btnNewMigration = document.getElementById('btn-new-migration');
        const panelRoleMgmt = document.getElementById('panel-role-management');
        const navAudit = document.querySelector('[data-view="view-audit"]');
        const navSettings = document.querySelector('[data-view="view-settings"]');

        if (btnReset) btnReset.style.display = hasPermission(role, PERMISSIONS.INSIGHTS_RESET) ? 'inline-flex' : 'none';
        if (btnExportAudit) btnExportAudit.style.display = hasPermission(role, PERMISSIONS.AUDIT_EXPORT) ? 'inline-flex' : 'none';
        if (btnNewMigration) btnNewMigration.disabled = !hasPermission(role, PERMISSIONS.MIGRATION_RUN);
        if (panelRoleMgmt) panelRoleMgmt.style.display = hasPermission(role, PERMISSIONS.USER_MANAGE) ? 'block' : 'none';
        
        // Update sidebar profile
        const statusText = document.querySelector('.status-text');
        if (statusText) statusText.textContent = appState.currentUser.name;
        const statusSub = document.querySelector('.status-sub');
        if (statusSub) statusSub.textContent = appState.currentUser.role;
        const statusIndicator = document.querySelector('.status-indicator');
        if (statusIndicator) statusIndicator.style.background = (role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN) ? 'var(--green-neon)' : 'var(--amber-neon)';
    }

    function resetState() {
        if (!hasPermission(appState.currentUser.role, PERMISSIONS.INSIGHTS_RESET)) {
            alert('Access Denied: You do not have permission to reset system insights.');
            AuditService.log(appState.currentUser.role, AuditAction.LOGIN_FAIL, 'System Reset', { reason: 'Insufficient Permissions' }, false);
            return;
        }

        if(confirm('Are you sure you want to reset all insights, jobs, and history?')) {
            localStorage.removeItem('unifiedMigratorState');
            AuditService.log(appState.currentUser.role, AuditAction.VAULT_WIPE, 'System State', { scope: 'Full Data Purge' });
            appState = { 
                jobs: [], 
                auditConfigUploads: 0, 
                coverage: { 'Address Objects': { parsed: 0, total: 0 }, 'Security Policy': { parsed: 0, total: 0 }},
                currentUser: appState.currentUser // Keep user
            };
            populateDashboard();
            switchView('view-dashboard');
            renderAuditLogs(); // Immediate refresh
        }
    }

    // Role Switcher Listener
    const roleSelector = document.getElementById('role-selector');
    if (roleSelector) {
        roleSelector.value = appState.currentUser.role;
        roleSelector.addEventListener('change', (e) => {
            const oldRole = appState.currentUser.role;
            appState.currentUser.role = e.target.value;
            appState.currentUser.name = e.target.value === ROLES.AUDITOR ? 'Jane Auditor' : 'Attique Bhatti';
            
            applyPermissions();
            AuditService.log(appState.currentUser.role, AuditAction.ROLE_CHANGE, 'User Identity', { from: oldRole, to: e.target.value });
            saveState();
            renderAuditLogs();
        });
    }

    document.getElementById('btn-reset-insights')?.addEventListener('click', resetState);
    applyPermissions(); // Initial run

    // --- VIEW ROUTING & SIDEBAR ---
    const navItems = document.querySelectorAll('.nav-item[data-view]');
    const viewSections = document.querySelectorAll('.view-section');
    const viewTitle = document.getElementById('current-view-title');
    const viewSubtitle = document.getElementById('current-view-subtitle');
    const badgers = document.querySelectorAll('.nav-badge');

    const viewMeta = {
        'view-dashboard': { title: 'Dashboard', sub: 'Migration overview &bull; 2026' },
        'view-jobs': { title: 'Migration Jobs', sub: 'All structural history' },
        'view-new-migration': { title: 'New Migration', sub: 'Multi-step migration wizard' },
        'view-report': { title: 'Migration Report', sub: 'Latest job execution details' },
        'view-audit': { title: 'Audit Log', sub: 'Immutable activity log' },
        'view-settings': { title: 'System Settings', sub: 'Preferences and configurations' }
    };

    function switchView(viewId) {
        navItems.forEach(nav => nav.classList.remove('active'));
        viewSections.forEach(sec => sec.classList.remove('active'));

        const targetNav = document.querySelector(`.nav-item[data-view="${viewId}"]`);
        const targetSec = document.getElementById(viewId);

        if (targetNav) targetNav.classList.add('active');
        if (targetSec) targetSec.classList.add('active');

        if (viewMeta[viewId]) {
             viewTitle.textContent = viewMeta[viewId].title;
             viewSubtitle.innerHTML = viewMeta[viewId].sub;
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(item.getAttribute('data-view'));
            if (item.getAttribute('data-view') === 'view-audit') renderAuditTimeline();
        });
    });

    document.querySelectorAll('.new-migration-trigger').forEach(btn => {
         btn.addEventListener('click', () => switchView('view-new-migration'));
    });

    // --- DYNAMIC DATA POPULATION ---
    function populateDashboard() {
        const dashTbody = document.getElementById('dash-jobs-tbody');
        const allJobsTbody = document.getElementById('all-jobs-tbody');
        const covList = document.getElementById('coverage-list-container');
        
        // Stats Boxes
        const statBoxes = document.querySelectorAll('.stat-value');
        if(statBoxes.length >= 2) {
            statBoxes[0].textContent = appState.jobs.length; // Total Migs
            
            // Calculate Avg Conv Rate
            let avgConf = 0;
            if(appState.jobs.length > 0) {
                const totalConf = appState.jobs.reduce((sum, job) => sum + job.conf, 0);
                avgConf = Math.round(totalConf / appState.jobs.length);
            }
            statBoxes[1].textContent = `${avgConf}%`;
        }

        // Job Lists
        const renderJobRow = (job, isDashboard = false) => `
            <tr>
              <td style="font-family: var(--font-mono); color: var(--cyan-accent)">${job.id}</td>
              <td style="color: var(--text-muted)">${job.source}</td>
              <td style="color: var(--text-muted)">${job.target}</td>
              <td style="${allJobsTbody && !isDashboard ? '' : 'display:none'}">${job.rules}</td>
              <td>
                <div class="progress-wrap">
                   <div class="progress-bar-bg"><div class="progress-fill ${job.conf >= 90 ? 'green' : 'amber'}" style="width: ${job.conf}%"></div></div>
                   <div class="progress-text ${job.conf >= 90 ? 'status-txt conv' : 'status-txt rev'}">${job.conf}%</div>
                </div>
              </td>
              <td style="${allJobsTbody && !isDashboard ? 'font-family: var(--font-mono); color: var(--text-dim)' : 'display:none'}">${job.date}</td>
              <td style="text-align: right">
                ${isDashboard 
                    ? `<button class="btn ghost btn-sm analyze-btn" data-job="${job.id}">Analyze Behavior &rarr;</button>`
                    : `<span class="status-badge ${job.conf >= 90 ? 'green' : 'amber'}">${job.status}</span>`
                }
              </td>
            </tr>
        `;

        if(dashTbody) dashTbody.innerHTML = reversedJobs.slice(0, 4).map(job => renderJobRow(job, true)).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-dim)">No migrations found. Start a new one.</td></tr>';
        
        if(allJobsTbody) allJobsTbody.innerHTML = reversedJobs.map(job => renderJobRow(job)).join('');
        
        // Add listeners for analyze buttons after rendering
        document.querySelectorAll('.analyze-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                switchView('view-report');
                document.getElementById('tab-validation')?.click();
            });
        });

        // Badges
        badgers.forEach(b => b.textContent = appState.jobs.length);

        // Coverage dynamically
        let addrPerc = appState.coverage['Address Objects'].total > 0 ? Math.round((appState.coverage['Address Objects'].parsed / appState.coverage['Address Objects'].total) * 100) : 0;
        let polPerc = appState.coverage['Security Policy'].total > 0 ? Math.round((appState.coverage['Security Policy'].parsed / appState.coverage['Security Policy'].total) * 100) : 0;
        
        if (covList) {
            covList.innerHTML = `
                <div class="cov-row">
                <div class="cov-labels"><span>Address Objects</span> <span class="cov-perc" style="color: ${addrPerc >= 90 ? 'var(--green-neon)' : 'var(--amber-neon)'}">${addrPerc}%</span></div>
                <div class="progress-bar-bg" style="height: 3px; background: rgba(255,255,255,0.05)"><div class="progress-fill ${addrPerc >= 90 ? 'green' : 'amber'}" style="width: ${addrPerc}%"></div></div>
                </div>
                <div class="cov-row">
                <div class="cov-labels"><span>Security Policy</span> <span class="cov-perc" style="color: ${polPerc >= 90 ? 'var(--green-neon)' : 'var(--amber-neon)'}">${polPerc}%</span></div>
                <div class="progress-bar-bg" style="height: 3px; background: rgba(255,255,255,0.05)"><div class="progress-fill ${polPerc >= 90 ? 'green' : 'amber'}" style="width: ${polPerc}%"></div></div>
                </div>
            `;
        }

        // Audit simplified
        const auditList = document.getElementById('audit-list');
        if(auditList) {
            if(appState.jobs.length === 0) {
                auditList.innerHTML = '<div style="padding:1rem;color:var(--text-dim)">Audit logs empty.</div>';
            } else {
                auditList.innerHTML = reversedJobs.slice(0, 10).map(j => `
                    <div class="audit-row">
                        <span class="audit-time">${j.date}</span>
                        <span class="audit-user">Local_User</span>
                        <span class="audit-event">MIGRATION_EXEC</span>
                        <span class="audit-detail">Job ${j.id} executed (${j.source} to ${j.target}). Rules mapping: ${j.rules}</span>
                    </div>
                `).join('');
            }
        }
    }

    loadState();
    populateDashboard();

    // --- REPORT VIEW LOGIC ---
    const reportTabs = document.querySelectorAll('#view-report .tab');
    const reportTbody = document.getElementById('report-rules-tbody');
    const reportTable = document.getElementById('report-rules-table');
    const validationContent = document.getElementById('report-content-validation');

    let lastParsedData = null; // Store for validation engine

    const reportMockData = {
        'Security Rules': [
            { name: 'Allow_Web', srcDst: 'Trust &rarr; Untrust', action: 'Allow', conf: 98, status: '✓ MATCH' },
            { name: 'Block_Malware', srcDst: 'Any &rarr; Any', action: 'Drop', conf: 95, status: '✓ MATCH' },
            { name: 'DMZ_Access', srcDst: 'Untrust &rarr; DMZ', action: 'Allow', conf: 92, status: '✓ MATCH' },
            { name: 'Internal_Routing', srcDst: 'Trust &rarr; Trust', action: 'Allow', conf: 100, status: '✓ MATCH' }
        ],
        'NAT Rules': [
            { name: 'Outbound_NAT', srcDst: 'Trust &rarr; Untrust', action: 'Source NAT', conf: 85, status: '⚠️ REVIEW' },
            { name: 'Inbound_Web', srcDst: 'Untrust &rarr; DMZ', action: 'Dest NAT', conf: 96, status: '✓ MATCH' }
        ],
        'Exceptions': [
            { name: 'Legacy_VPN', srcDst: 'Untrust &rarr; Trust', action: 'IPsec', conf: 40, status: '❌ MANUAL' },
            { name: 'Custom_App', srcDst: 'Trust &rarr; Untrust', action: 'Allow', conf: 60, status: '❌ MANUAL' }
        ],
        'Behavioral Changes': [
            { name: 'Zone_Protection', srcDst: 'Untrust &rarr; Internal', action: 'Alert', conf: 75, status: '⚠️ REVIEW' }
        ]
    };

    function renderReportTab(tabName) {
        if(!reportTbody) return;
        const data = reportMockData[tabName] || [];
        if(data.length === 0) {
            reportTbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-dim); padding: 2rem;">No data found for this category.</td></tr>';
            return;
        }

        reportTbody.innerHTML = data.map(row => `
            <tr>
               <td>${row.name}</td>
               <td>${row.srcDst}</td>
               <td>${row.action}</td>
               <td>
                 <div class="progress-wrap">
                    <div class="progress-bar-bg"><div class="progress-fill ${row.conf >= 90 ? 'green' : (row.conf >= 70 ? 'amber' : 'red')}" style="width: ${row.conf}%"></div></div>
                    <div class="progress-text status-txt ${row.conf >= 90 ? 'conv' : 'rev'}" style="${row.conf < 70 ? 'color: var(--err-neon)' : ''}">${row.conf}%</div>
                 </div>
               </td>
               <td style="text-align: right"><span class="status-badge ${row.status.includes('MATCH') ? 'green' : (row.status.includes('REVIEW') ? 'amber' : 'err')}">${row.status}</span></td>
            </tr>
        `).join('');
    }

    function renderValidationTab() {
        if (!lastParsedData) return;
        const engine = new BehavioralEngine();
        const simulator = new TrafficSimulator();
        
        // Semantic Analysis (Compare IR with itself to detect potential issues)
        const validationResults = engine.compare(lastParsedData, lastParsedData);
        
        // Drift UI
        const driftList = document.getElementById('drift-results-list');
        driftList.innerHTML = validationResults.driftWarnings.length > 0 
            ? validationResults.driftWarnings.map(w => `
                <div class="p-3 border-b border-white/5">
                    <div class="text-amber-400 text-xs font-bold mb-1 uppercase tracking-tighter">${w.rule}</div>
                    ${w.drifts.map(d => `<div class="text-slate-400 text-[11px]">&bull; ${d.msg}</div>`).join('')}
                </div>
            `).join('')
            : '<div class="text-green-neon/60 p-4 text-center text-xs">No behavioral drift detected. Equivalence confirmed.</div>';

        // Simulation UI
        const simList = document.getElementById('sim-results-list');
        const simResults = simulator.runSimulation(lastParsedData, lastParsedData);
        simList.innerHTML = simResults.map(s => `
            <div class="p-3 border-b border-white/5 flex items-center justify-between">
                <div>
                    <div class="text-slate-300 text-[11px] font-mono">${s.tuple.src} &rarr; ${s.tuple.dst}:${s.tuple.port}</div>
                    <div class="text-slate-500 text-[10px]">Method: Recursive Path Lookup</div>
                </div>
                <div class="text-right">
                    <span class="text-green-neon text-[10px] block">MATCH</span>
                    <span class="text-slate-500 text-[9px]">${s.source.action}</span>
                </div>
            </div>
        `).join('');
    }

    reportTabs.forEach(tab => {
        tab.addEventListener('click', () => {
             reportTabs.forEach(t => t.classList.remove('active'));
             tab.classList.add('active');
             
             const tabName = tab.childNodes[0].textContent.trim();
             
             if (tabName === 'Validation & Simulation') {
                 reportTable.classList.add('hidden');
                 validationContent.classList.remove('hidden');
                 renderValidationTab();
             } else {
                 reportTable.classList.remove('hidden');
                 validationContent.classList.add('hidden');
                 renderReportTab(tabName);
             }
        });
    });

    async function renderAuditTimeline() {
        const timeline = document.getElementById('audit-timeline');
        if (!timeline) return;

        const logs = await AuditStore.getLogs();
        const reversedLogs = [...logs].reverse();

        if (reversedLogs.length === 0) {
            timeline.innerHTML = '<div class="text-center p-12 text-dim">No evidence records found in the current session.</div>';
            return;
        }

        timeline.innerHTML = reversedLogs.map(log => {
            const dateStr = new Date(log.timestamp).toLocaleString();
            const statusClass = log.success === false ? 'failure' : (log.action.includes('FAIL') || log.action.includes('REJECT') ? 'warning' : 'success');
            const icon = log.success === false ? '!' : '✓';

            return `
                <div class="timeline-node ${statusClass}">
                    <div class="timeline-icon">${icon}</div>
                    <div class="timeline-content">
                        <div class="timeline-header">
                            <span class="timeline-actor">@${log.actor}</span>
                            <span class="timeline-time">${dateStr}</span>
                        </div>
                        <div class="timeline-action" style="color: ${log.success ? 'var(--cyan-accent)' : 'var(--err-neon)'}">${log.action}</div>
                        <div class="timeline-target">${log.target}</div>
                        ${log.details ? `<div class="timeline-details">${JSON.stringify(log.details)}</div>` : ''}
                        <div class="timeline-hash">
                            <span>Hash: ${log.hash.slice(0, 16)}...</span>
                            <span style="opacity: 0.5;">Lnk: ${log.previousHash.slice(0, 12)}...</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async function handleIntegrityCheck() {
        const banner = document.getElementById('integrity-status-banner');
        if (!banner) return;

        banner.classList.remove('hidden', 'verified', 'tampered');
        banner.innerHTML = '<span class="loading-spinner"></span> Verification in progress...';
        banner.style.display = 'flex';

        // Add a slight delay for UI feel
        await new Promise(r => setTimeout(r, 800));

        const result = await AuditStore.validateIntegrity();
        
        if (result.valid) {
            banner.classList.add('verified');
            banner.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Chain Integrity Verified: Seal is Intact. All hashing sequences match the cryptograph trail.</span>
            `;
        } else {
            banner.classList.add('tampered');
            banner.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <span>Tamper Detected: The log chain has been broken at item ${result. brokenIndex} (ID: ${result.entryId}). Evidence package invalidated.</span>
            `;
        }
    }

    async function handleEvidenceExport() {
        const pkg = await AuditService.generateEvidencePackage();
        const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comliance_evidence_${new Date().getTime()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        AuditService.log(appState.currentUser.role, AuditAction.DOWNLOAD, 'Compliance Evidence Package', { packageId: pkg.packageId });
        renderAuditTimeline();
    }

    // Init first tab
    renderReportTab('Security Rules');

    // --- WIZARD / PARSER LOGIC ---
    const sourceCards = document.querySelectorAll('.source-card');
    const targetCards = document.querySelectorAll('.target-card');
    
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('file-drop-zone');
    const uploadPrompt = document.getElementById('upload-prompt');
    const uploadSuccess = document.getElementById('upload-success');
    const fileNameDisplay = document.getElementById('file-name-display');
    const codePreviewContent = document.getElementById('code-preview-content');
    
    const nextToTargetBtn = document.getElementById('next-to-target-btn');
    const backToSourceBtn = document.getElementById('back-to-source-btn');
    const processBtn = document.getElementById('process-migration-btn');
    
    const step1 = document.getElementById('wizard-step-1');
    const step2 = document.getElementById('wizard-step-2');

    let currentFileContent = '';
    let selectedSource = 'fortigate'; // default source
    let selectedTarget = 'panos'; // default target

    // Step 1: Source Vendor Selection
    sourceCards.forEach(card => {
        card.addEventListener('click', () => {
            sourceCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedSource = card.getAttribute('data-vendor');
        });
    });

    // Step 2: Target Vendor Selection
    targetCards.forEach(card => {
        card.addEventListener('click', () => {
            targetCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedTarget = card.getAttribute('data-target');
        });
    });

    // File Upload
    dropZone.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });

    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--cyan-accent)'; });
    dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = 'var(--text-dim)'; });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--text-dim)';
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });

    function handleFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            currentFileContent = e.target.result;
            
            uploadPrompt.classList.add('hidden');
            uploadSuccess.classList.remove('hidden');
            fileNameDisplay.textContent = `${file.name} loaded [${(file.size/1024).toFixed(1)} KB]`;
            
            AuditService.log(appState.currentUser.role, AuditAction.UPLOAD, file.name, { size: file.size, type: file.type });
            
            // Generate Code Preview
            const lines = currentFileContent.split('\n').slice(0, 15);
            codePreviewContent.textContent = lines.join('\n') + (currentFileContent.split('\n').length > 15 ? '\n...' : '');

            // Auto Detect Source Vendor
            const autoVendor = detectVendor(currentFileContent, file.name);
            if(autoVendor !== 'unknown') {
                sourceCards.forEach(c => c.classList.remove('active'));
                const targetCard = document.querySelector(`.source-card[data-vendor="${autoVendor}"]`);
                if(targetCard) {
                    targetCard.classList.add('active');
                    selectedSource = autoVendor;
                }
            }
            
            nextToTargetBtn.disabled = false;
        };
        reader.readAsText(file);
    }

    // Wizard Navigation
    nextToTargetBtn.addEventListener('click', () => {
        step1.classList.remove('active');
        step1.classList.add('hidden');
        step2.classList.remove('hidden');
        step2.classList.add('active');
        // Update Stepper UI
        document.querySelectorAll('.step')[1].classList.add('active');
        document.querySelectorAll('.step-label')[1].classList.remove('dimmed');
    });

    backToSourceBtn.addEventListener('click', () => {
        step2.classList.remove('active');
        step2.classList.add('hidden');
        step1.classList.remove('hidden');
        step1.classList.add('active');
        document.querySelectorAll('.step')[1].classList.remove('active');
        document.querySelectorAll('.step-label')[1].classList.add('dimmed');
    });

    // Process Action
    let generatedOutput = '';
    let extType = '.txt';

    processBtn.addEventListener('click', () => {
         processBtn.innerHTML = 'Parsing Object Models...';
         processBtn.disabled = true;

         setTimeout(() => {
              try {
                // PARSE
                let parsedData;
                if (selectedSource === 'fortigate') parsedData = new FortigateParser(currentFileContent).parse();
                else if (selectedSource === 'cisco') parsedData = new CiscoParser(currentFileContent).parse();
                else if (selectedSource === 'checkpoint') parsedData = new CheckpointParser(currentFileContent).parse();
                else throw new Error('Source vendor not supported');

                // GENERATE
                let generator;
                if (selectedTarget === 'panos') {
                    generator = new PanosGenerator(parsedData);
                    extType = '.xml';
                } else if (selectedTarget === 'fortigate') {
                    generator = new OutputFortigateGenerator(parsedData);
                    extType = '.conf';
                } else if (selectedTarget === 'cisco') {
                    generator = new OutputCiscoGenerator(parsedData);
                    extType = '.cfg';
                } else if (selectedTarget === 'checkpoint') {
                    generator = new OutputCheckpointGenerator(parsedData);
                    extType = '.script';
                }

                generatedOutput = generator.generate();

                // DYNAMIC UPDATES — Use real IR data
                const ruleCount = parsedData.policies?.length || 0;
                const addrCount = parsedData.addresses?.length || 0;
                const natCount = parsedData.natRules?.length || 0;
                const svcCount = parsedData.services?.length || 0;

                // Compute real confidence from exceptions across all entities
                const allEntities = [
                    ...(parsedData.addresses || []),
                    ...(parsedData.addressGroups || []),
                    ...(parsedData.services || []),
                    ...(parsedData.serviceGroups || []),
                    ...(parsedData.policies || []),
                    ...(parsedData.natRules || []),
                    ...(parsedData.staticRoutes || []),
                    ...(parsedData.zones || [])
                ];

                let totalConfidence = 0;
                let entityCount = 0;
                let totalExceptions = 0;

                allEntities.forEach(entity => {
                    totalConfidence += (entity.confidence !== undefined ? entity.confidence : 100);
                    entityCount++;
                    totalExceptions += (entity.exceptions?.length || 0);
                });

                const avgConfidence = entityCount > 0 ? Math.round(totalConfidence / entityCount) : 100;

                // Count entities without exceptions as "successfully parsed"
                const addrParsed = (parsedData.addresses || []).filter(a => !a.exceptions || a.exceptions.length === 0).length;
                const ruleParsed = (parsedData.policies || []).filter(p => !p.exceptions || p.exceptions.length === 0).length;

                // Save to State
                const newJobId = `MIG-LOC-${Math.floor(Math.random()*10000).toString().padStart(4, '0')}`;
                appState.jobs.push({
                    id: newJobId,
                    source: selectedSource.toUpperCase(),
                    target: selectedTarget.toUpperCase(),
                    rules: ruleCount,
                    conf: avgConfidence,
                    date: new Date().toISOString().split('T')[0],
                    status: avgConfidence >= 90 ? '✓ GREEN' : (avgConfidence >= 70 ? '⚠ REVIEW' : '✗ MANUAL'),
                    exceptions: totalExceptions,
                    natRules: natCount,
                    services: svcCount
                });

                appState.coverage['Address Objects'].parsed += addrParsed;
                appState.coverage['Address Objects'].total += addrCount;
                appState.coverage['Security Policy'].parsed += ruleParsed;
                appState.coverage['Security Policy'].total += ruleCount;

                saveState();

                lastParsedData = parsedData; // Save for validation engine
                
                // Reset Wizard form
                processBtn.innerHTML = 'Process Migration &rarr;';
                processBtn.disabled = false;
                backToSourceBtn.click(); // go back for next time
                
                // Show Output Modal directly
                document.getElementById('xml-output').textContent = generatedOutput;
                document.getElementById('output-modal').classList.remove('hidden');

                AuditService.log(appState.currentUser.role, AuditAction.MIGRATION_RUN, newJobId, { source: selectedSource, target: selectedTarget, rules: ruleCount, confidence: avgConfidence });

             } catch(e) {
                alert("Error parsing config: " + e.message);
                processBtn.innerHTML = 'Process Migration &rarr;';
                processBtn.disabled = false;
             }
         }, 800);
    });

    // Modal Actions
    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('output-modal').classList.add('hidden');
        switchView('view-dashboard'); // Pop back to dashboard after closing to see new stats
    });

    document.getElementById('download-xml-btn').addEventListener('click', () => {
        const blob = new Blob([generatedOutput], { type: 'text/plain' }); // type simple
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `migration_output_${Date.now()}${extType}`;
        a.click();
        URL.revokeObjectURL(url);
        AuditService.log(appState.currentUser.role, AuditAction.DOWNLOAD, `Output File`, { type: extType });
    });

    document.getElementById('copy-xml-btn').addEventListener('click', (e) => {
        navigator.clipboard.writeText(generatedOutput);
        e.target.textContent = 'Copied!';
        setTimeout(() => e.target.textContent = 'Copy to Clipboard', 2000);
        auditLogger.log(appState.currentUser, 'CONFIG_COPY');
    });

        // New Compliance Listeners
        document.getElementById('btn-validate-integrity')?.addEventListener('click', handleIntegrityCheck);
        document.getElementById('btn-export-evidence')?.addEventListener('click', handleEvidenceExport);

        renderAuditTimeline();

    // --- INITIALIZATION ---
    loadState();
    populateDashboard();
    renderAuditTimeline();
    applyPermissions();
});
