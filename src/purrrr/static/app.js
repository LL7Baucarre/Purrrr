// =============================================
// purrrr - Application principale (point d'entrée)
// =============================================
// Ce fichier contient les variables globales, l'initialisation DOM
// et les fonctions de configuration des colonnes/en-têtes.
//
// Les autres fichiers (chargés avant celui-ci) :
//   utils.js          – Utilitaires, formatage, pin, export, GeoIP
//   filters.js        – Filtres, IP matching, dropdowns
//   modal-renderers.js – Rendus spécifiques par workload (Exchange, SharePoint, etc.)
//   modal-details.js  – Modale de détails de log
//   timeline.js       – Pagination, timeline, patterns, graphique
//   upload.js         – Upload de fichiers, progression, affichage résultats

// Global variables
let currentSessionId = null;
let currentLogType = null;
let analysisData = {};
let currentFilters = {};
let pinnedLogs = []; // Store pinned logs
let compactViewEnabled = false; // Track compact view state

// Column visibility configuration
const AVAILABLE_COLUMNS = [
    { key: 'timestamp', label: 'Date/Heure', visible: true, width: '20%' },
    { key: 'operation', label: 'Opération', visible: true, width: '15%' },
    { key: 'subject', label: 'Détails', visible: true, width: '25%' },
    { key: 'user', label: 'Utilisateur', visible: true, width: '20%' },
    { key: 'Workload', label: 'Workload', visible: false, width: '10%' },
    { key: 'folder', label: 'Dossier', visible: false, width: '15%' },
    { key: 'ClientIP', label: 'Adresse IP', visible: true, width: '12%' },
    { key: 'geo_country_code', label: 'Pays', visible: true, width: '8%' },
    { key: 'asn', label: 'ASN', visible: false, width: '10%' },
    { key: 'as_name', label: 'Nom AS', visible: false, width: '15%' }
];

// DOM Elements (initialized in DOMContentLoaded)
let uploadForm, uploadSection, dashboardSection, csvFileInput, submitBtn, resetBtn, navbarStatus;

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    // Initialize DOM references now that the DOM is ready
    uploadForm = document.getElementById('upload-form');
    uploadSection = document.getElementById('upload-section');
    dashboardSection = document.getElementById('dashboard-section');
    csvFileInput = document.getElementById('csv-file');
    submitBtn = document.getElementById('submit-btn');
    resetBtn = document.getElementById('reset-btn');
    navbarStatus = document.getElementById('navbar-status');

    setupEventListeners();
    initializeColumnSelectors();
    initializeDatabaseLoading();
});

async function initializeDatabaseLoading() {
    // Show loading modal and wait for databases to be ready
    const modal = new bootstrap.Modal(document.getElementById('db-loading-modal'), {
        backdrop: 'static',
        keyboard: false
    });
    modal.show();
    
    // Poll for database status
    let geoipReady = false;
    let asnReady = false;
    
    const checkInterval = setInterval(async () => {
        try {
            const response = await fetch('/api/geoip/status');
            const status = await response.json();
            
            // Update GeoIP status
            if (status.geoip?.loaded && !geoipReady) {
                geoipReady = true;
                document.getElementById('geoip-loading-bar').style.width = '100%';
                document.getElementById('geoip-loading-text').textContent = `✓ ${status.geoip.ranges_count.toLocaleString()} plages`;
            } else if (status.geoip?.loaded) {
                document.getElementById('geoip-loading-bar').style.width = '100%';
            }
            
            // Update ASN status
            if (status.asn?.loaded && !asnReady) {
                asnReady = true;
                document.getElementById('asn-loading-bar').style.width = '100%';
                document.getElementById('asn-loading-text').textContent = `✓ ${status.asn.ranges_count.toLocaleString()} plages`;
            } else if (status.asn?.loaded) {
                document.getElementById('asn-loading-bar').style.width = '100%';
            }
            
            // Check if all databases are ready
            if (status.all_ready) {
                clearInterval(checkInterval);
                modal.hide();
                checkGeoIPStatus();
            }
        } catch (error) {
            console.error('Error checking database status:', error);
        }
    }, 500); // Check every 500ms
}

function setupEventListeners() {
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleFileUpload);
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', resetAnalysis);
    }
    
    // File input listeners
    if (csvFileInput) {
        csvFileInput.addEventListener('change', function () {
            updateFileInputStatus('csv-check', this.value);
        });
    }

    // GeoIP download button
    const downloadGeoIPBtn = document.getElementById('download-geoip-btn');
    if (downloadGeoIPBtn) {
        downloadGeoIPBtn.addEventListener('click', downloadGeoIPDatabase);
    }

    // Items per page selector
    const itemsPerPageSelector = document.getElementById('items-per-page');
    if (itemsPerPageSelector) {
        itemsPerPageSelector.addEventListener('change', function () {
            // Re-initialize pagination with new items per page value
            if (window.timelineCurrentOperations && window.timelineCurrentOperations.length > 0) {
                initializeTimelinePagination(window.timelineCurrentOperations);
            }
        });
    }

    // Plus d'onglets - supprimé les tab listeners
    
    // Filter buttons
    const applyFiltersBtn = document.getElementById('apply-filters');
    const resetFiltersBtn = document.getElementById('reset-filters');
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }
    
    // Add file form
    const addFileForm = document.getElementById('add-file-form');
    const addFileSubmitBtn = document.getElementById('add-file-submit-btn');
    if (addFileForm && addFileSubmitBtn) {
        addFileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleAddFile();
        });
        addFileSubmitBtn.addEventListener('click', handleAddFile);
    }
    
    // Export and Pin buttons
    const exportCsvBtn = document.getElementById('export-csv-filtered');
    const exportJsonBtn = document.getElementById('export-json-full');
    const showPinnedBtn = document.getElementById('show-pinned-btn');
    const clearPinnedBtn = document.getElementById('clear-all-pinned');
    
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportFilteredAsCSV);
    }
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', exportFullAsJSON);
    }
    if (showPinnedBtn) {
        showPinnedBtn.addEventListener('click', showPinnedLogs);
    }
    if (clearPinnedBtn) {
        clearPinnedBtn.addEventListener('click', clearAllPinned);
    }
    
    // Compact view toggle
    const compactViewCheckbox = document.getElementById('compact-view');
    if (compactViewCheckbox) {
        compactViewCheckbox.addEventListener('change', toggleCompactView);
    }
    
    // Initialize Select2 for actions filter
    const filterActionsSelect = document.getElementById('filter-actions');
    if (filterActionsSelect) {
        $(filterActionsSelect).select2({
            theme: 'bootstrap-5',
            placeholder: "Sélectionner des actions",
            allowClear: true,
            width: '100%'
        });
        // Apply filters when action selection changes (select2 event)
        $(filterActionsSelect).on('select2:select select2:unselect select2:clearing', applyFilters);
    }

    // Initialize Select2 for country filter
    const filterCountrySelect = document.getElementById('filter-country');
    if (filterCountrySelect) {
        $(filterCountrySelect).select2({
            placeholder: "Sélectionner des pays",
            allowClear: true,
            width: '100%'
        });
        // Apply filters when country selection changes (select2 event)
        $(filterCountrySelect).on('select2:select select2:unselect select2:clearing', applyFilters);
    }
    
    // Initialize Select2 for ASN filter
    const filterAsnSelect = document.getElementById('filter-asn');
    if (filterAsnSelect) {
        $(filterAsnSelect).select2({
            placeholder: "Sélectionner des ASN",
            allowClear: true,
            width: '100%'
        });
        // Apply filters when ASN selection changes (select2 event)
        $(filterAsnSelect).on('select2:select select2:unselect select2:clearing', applyFilters);
    }
}

function initializeColumnSelectors() {
    const columnsCheckboxes = document.getElementById('columns-checkboxes');
    if (!columnsCheckboxes) return;
    
    columnsCheckboxes.innerHTML = '';
    AVAILABLE_COLUMNS.forEach(col => {
        const checkbox = document.createElement('div');
        checkbox.className = 'form-check';
        checkbox.innerHTML = `
            <input class="form-check-input column-checkbox" type="checkbox" id="col-${col.key}" value="${col.key}" ${col.visible ? 'checked' : ''}>
            <label class="form-check-label" for="col-${col.key}">
                ${col.label}
            </label>
        `;
        columnsCheckboxes.appendChild(checkbox);
        
        // Add change event listener
        checkbox.querySelector('input').addEventListener('change', (e) => {
            const colKey = e.target.value;
            const colIndex = AVAILABLE_COLUMNS.findIndex(c => c.key === colKey);
            if (colIndex !== -1) {
                AVAILABLE_COLUMNS[colIndex].visible = e.target.checked;
            }
            
            // Re-render the table header and rows
            renderTableHeader();
            if (window.timelineCurrentOperations && window.timelineCurrentOperations.length > 0) {
                updateTimelinePage(window.timelineCurrentPage || 1);
            }
        });
    });
}

function renderTableHeader() {
    const headerRow = document.getElementById('timeline-header');
    if (!headerRow) return;
    
    headerRow.innerHTML = '';
    const visibleCols = AVAILABLE_COLUMNS.filter(col => col.visible);
    
    visibleCols.forEach((col, index) => {
        const th = document.createElement('th');
        th.style.width = col.width;
        th.textContent = col.label;
        headerRow.appendChild(th);
    });
    
    // Add Actions column header
    const thActions = document.createElement('th');
    thActions.style.width = '5%';
    thActions.textContent = 'Actions';
    thActions.style.textAlign = 'center';
    headerRow.appendChild(thActions);
}

function getColumnValue(op, colKey) {
    switch(colKey) {
        case 'timestamp':
            return op.timestamp ? new Date(op.timestamp).toLocaleString('fr-FR') : '-';
        case 'operation':
            return `<span class="badge bg-info">${op.operation || '-'}</span>`;
        case 'subject':
            return `<small title="${op.subject || ''}">${op.subject || op.folder || '-'}</small>`;
        case 'user':
            return `<small class="text-muted">${op.user || '-'}</small>`;
        case 'Workload':
            return `<small>${op.Workload || '-'}</small>`;
        case 'folder':
            return `<small class="text-muted" title="${op.folder || ''}">${op.folder || '-'}</small>`;
        case 'ClientIP':
            return `<small class="font-monospace">${op.ClientIP || '-'}</small>`;
        case 'geo_country_code':
            const country = op.geo_country_code || '-';
            const countryName = op.geo_country || '';
            const title = countryName ? `title="${countryName}"` : '';
            return `<small ${title}><strong>${country}</strong></small>`;
        case 'asn':
            const asn = op.asn || '-';
            return `<small class="font-monospace"><strong>${asn}</strong></small>`;
        case 'as_name':
            const asName = op.as_name || '-';
            const asnValue = op.asn ? `title="ASN: ${op.asn}"` : '';
            return `<small ${asnValue}>${asName}</small>`;
        default:
            return '-';
    }
}

