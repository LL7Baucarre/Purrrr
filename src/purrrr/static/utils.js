// =============================================
// purrrr - Utility Functions
// =============================================

// Afficher un modal de détails générique
function showDetails(title, content) {
    // Try to reuse an existing generic details modal, or create one dynamically
    let modalEl = document.getElementById('genericDetailsModal');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'genericDetailsModal';
        modalEl.className = 'modal fade';
        modalEl.tabIndex = -1;
        modalEl.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="genericDetailsModalTitle"></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="genericDetailsModalBody"></div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalEl);
    }
    document.getElementById('genericDetailsModalTitle').textContent = title;
    document.getElementById('genericDetailsModalBody').innerHTML = content;
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

// Fonctions utilitaires de formatage
function formatDate(dateString) {
    if (!dateString || dateString === '-' || dateString === '') return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function getLogonTypeLabel(logonType) {
    const labels = {
        0: 'Utilisateur',
        1: 'Délégué',
        2: 'Transport',
        3: 'RemoteUserAccount',
        4: 'ServiceAccount',
        5: 'SystemAccount'
    };
    return labels[logonType] || 'Inconnu (' + logonType + ')';
}

// ============== ERROR / SUCCESS MESSAGES ==============

function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3';
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-circle me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 4000);
}

function showSuccessMessage(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3';
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 4000);
}

// ============== PIN FUNCTIONALITY ==============

function isLogPinned(op) {
    const timestamp = String(op.timestamp || '').trim();
    const user = String(op.user || '').trim().toLowerCase();
    const operation = String(op.operation || '').trim().toLowerCase();
    const subject = String(op.subject || '').trim().toLowerCase();
    
    return pinnedLogs.some(pinnedOp => 
        String(pinnedOp.timestamp || '').trim() === timestamp &&
        String(pinnedOp.user || '').trim().toLowerCase() === user &&
        String(pinnedOp.operation || '').trim().toLowerCase() === operation &&
        String(pinnedOp.subject || '').trim().toLowerCase() === subject
    );
}

function togglePinLog(op) {
    const timestamp = String(op.timestamp || '').trim();
    const user = String(op.user || '').trim().toLowerCase();
    const operation = String(op.operation || '').trim().toLowerCase();
    const subject = String(op.subject || '').trim().toLowerCase();
    
    const index = pinnedLogs.findIndex(pinnedOp => 
        String(pinnedOp.timestamp || '').trim() === timestamp &&
        String(pinnedOp.user || '').trim().toLowerCase() === user &&
        String(pinnedOp.operation || '').trim().toLowerCase() === operation &&
        String(pinnedOp.subject || '').trim().toLowerCase() === subject
    );
    
    if (index > -1) {
        pinnedLogs.splice(index, 1);
    } else {
        pinnedLogs.push(JSON.parse(JSON.stringify(op)));
    }
    
    updatePinnedCount();
    
    if (window.timelineCurrentPage) {
        updateTimelinePage(window.timelineCurrentPage);
    }
}

function updatePinnedCount() {
    const badge = document.getElementById('pinned-count');
    if (badge) {
        badge.textContent = pinnedLogs.length;
    }
}

function showPinnedLogs() {
    const container = document.getElementById('pinned-logs-container');
    
    if (pinnedLogs.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-4">Aucun événement pinné</p>';
    } else {
        let html = '<div style="max-height: 500px; overflow-y: auto;">';
        pinnedLogs.forEach((op, idx) => {
            html += `
                <div class="card mb-2">
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-start">
                            <div style="flex: 1;">
                                <small class="text-muted">${op.timestamp ? new Date(op.timestamp).toLocaleString('fr-FR') : '-'}</small>
                                <div class="mt-1">
                                    <span class="badge bg-info">${op.operation || '-'}</span>
                                    <span class="badge bg-secondary">${op.user || '-'}</span>
                                </div>
                                <small class="d-block mt-2 text-truncate">${op.subject || op.folder || '-'}</small>
                            </div>
                            <button class="btn btn-sm btn-outline-danger ms-2" onclick="removePinnedLog(${idx})" title="Dépincer">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('pinnedLogsModal'));
    modal.show();
}

function removePinnedLog(index) {
    pinnedLogs.splice(index, 1);
    updatePinnedCount();
    showPinnedLogs();
}

function clearAllPinned() {
    if (confirm('Êtes-vous sûr de vouloir effacer tous les événements pinnés ?')) {
        pinnedLogs = [];
        updatePinnedCount();
        showPinnedLogs();
    }
}

// ============== EXPORT FUNCTIONALITY ==============

function toggleCompactView() {
    const checkbox = document.getElementById('compact-view');
    compactViewEnabled = checkbox.checked;
    
    const timelineTable = document.getElementById('exchange-timeline');
    if (compactViewEnabled) {
        timelineTable.classList.add('compact-mode');
    } else {
        timelineTable.classList.remove('compact-mode');
    }
    
    if (window.timelineCurrentPage) {
        updateTimelinePage(window.timelineCurrentPage);
    }
}

function exportFilteredAsCSV() {
    const operations = window.timelineAllOperations || [];
    
    if (operations.length === 0) {
        showError('Aucune donnée à exporter');
        return;
    }
    
    const csvColumns = ['timestamp', 'operation', 'user', 'subject', 'folder', 'Workload'];
    let csvContent = csvColumns.join(',') + '\n';
    
    operations.forEach(op => {
        const row = csvColumns.map(col => {
            let value = op[col] || '';
            value = String(value).replace(/"/g, '""');
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                value = `"${value}"`;
            }
            return value;
        }).join(',');
        csvContent += row + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, `export_filtered_${new Date().toISOString().split('T')[0]}.csv`);
    
    showSuccessMessage(`Fichier CSV exécuté (${operations.length} lignes)`);
}

function exportFullAsJSON() {
    const operations = window.timelineAllOperations || [];
    
    if (operations.length === 0) {
        showError('Aucune donnée à exporter');
        return;
    }
    
    const exportData = {
        exportDate: new Date().toISOString(),
        totalRecords: operations.length,
        filters: window.timelineCurrentFilters || {},
        data: operations
    };
    
    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    downloadFile(blob, `export_complete_${new Date().toISOString().split('T')[0]}.json`);
    
    showSuccessMessage(`Fichier JSON exécuté (${operations.length} enregistrements)`);
}

function renderCountriesPatterns(operations) {
    if (!operations || operations.length === 0) {
        const table = document.getElementById('pattern-countries');
        if (table) {
            const tbody = table.querySelector('tbody');
            if (tbody) tbody.innerHTML = '';
        }
        return;
    }
    
    const countriesMap = {};
    operations.forEach(op => {
        if (op.geo_country_code && op.geo_country) {
            const key = `${op.geo_country_code}|${op.geo_country}|${op.geo_continent || '-'}`;
            if (!countriesMap[key]) {
                countriesMap[key] = 0;
            }
            countriesMap[key]++;
        }
    });
    
    const countries = Object.keys(countriesMap)
        .map(key => {
            const parts = key.split('|');
            return {
                code: parts[0],
                name: parts[1],
                continent: parts[2],
                count: countriesMap[key]
            };
        })
        .sort((a, b) => b.count - a.count);
    
    const table = document.getElementById('pattern-countries');
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (countries.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" class="text-center text-muted"><small>Aucun pays détecté</small></td>';
        tbody.appendChild(row);
        return;
    }
    
    countries.forEach(item => {
        const row = document.createElement('tr');
        let badgeClass = 'info';
        if (item.count > 50) badgeClass = 'danger';
        else if (item.count > 20) badgeClass = 'warning';
        
        row.innerHTML = `
            <td><small>${item.name}</small></td>
            <td><small>${item.code}</small></td>
            <td><small>${item.continent}</small></td>
            <td class="text-end"><span class="badge bg-${badgeClass}">${item.count}</span></td>
        `;
        tbody.appendChild(row);
    });
}

function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ============== GEOIP FUNCTIONS ==============

async function checkGeoIPStatus() {
    try {
        const response = await fetch('/api/geoip/status', { method: 'GET' });
        const status = await response.json();
        
        const statusCard = document.getElementById('geoip-status-card');
        const statusText = document.getElementById('geoip-status-text');
        const downloadBtn = document.getElementById('download-geoip-btn');
        
        const geoipLoaded = status.geoip?.loaded && status.geoip?.ranges_count > 0;
        const asnLoaded = status.asn?.loaded && status.asn?.ranges_count > 0;
        
        if (geoipLoaded && asnLoaded) {
            statusCard.className = 'alert alert-success mb-4';
            statusText.innerHTML = `
                <i class="fas fa-check-circle text-success"></i> <strong>Bases de données prêtes</strong><br>
                <small>GeoIP: ${status.geoip.ranges_count.toLocaleString()} plages | ASN: ${status.asn.ranges_count.toLocaleString()} plages</small>
            `;
            downloadBtn.disabled = true;
            downloadBtn.innerHTML = '<i class="fas fa-check"></i> Bases chargées';
            downloadBtn.className = 'btn btn-sm btn-success';
        } else if (geoipLoaded) {
            statusCard.className = 'alert alert-info mb-4';
            statusText.innerHTML = `
                <i class="fas fa-info-circle text-info"></i> <strong>GeoIP prête</strong><br>
                <small>GeoIP: ${status.geoip.ranges_count.toLocaleString()} plages | ASN: ${asnLoaded ? status.asn.ranges_count.toLocaleString() : 'Chargement...'} plages</small>
            `;
        } else {
            statusCard.className = 'alert alert-warning mb-4';
            statusText.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <strong>Bases de données non chargées</strong><br><small>Cliquez sur "Télécharger" pour initialiser</small>';
            downloadBtn.className = 'btn btn-sm btn-warning';
        }
    } catch (error) {
        console.error('Error checking GeoIP status:', error);
        const statusText = document.getElementById('geoip-status-text');
        statusText.innerHTML = '<i class="fas fa-times-circle text-danger"></i> <strong>Erreur</strong><br><small>Impossible de vérifier les bases</small>';
    }
}

async function downloadGeoIPDatabase() {
    const downloadBtn = document.getElementById('download-geoip-btn');
    const progressDiv = document.getElementById('geoip-progress');
    const progressBar = document.getElementById('geoip-progress-bar');
    
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Téléchargement...';
    progressDiv.style.display = 'block';
    
    try {
        const response = await fetch('/api/geoip/download', {
            method: 'POST'
        });
        
        for (let i = 0; i < 100; i += 10) {
            progressBar.style.width = i + '%';
            await new Promise(r => setTimeout(r, 50));
        }
        
        const result = await response.json();
        
        if (result.status === 'success') {
            progressBar.style.width = '100%';
            await new Promise(r => setTimeout(r, 500));
            
            downloadBtn.innerHTML = '✓ Base téléchargée';
            downloadBtn.className = 'btn btn-sm btn-success';
            showSuccessMessage(`Base GeoIP téléchargée: ${result.loaded_ranges.toLocaleString()} plages`);
            
            await new Promise(r => setTimeout(r, 1000));
            await checkGeoIPStatus();
        } else {
            showError(`Erreur: ${result.message}`);
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = '<i class="fas fa-download"></i> Télécharger';
        }
    } catch (error) {
        console.error('Download error:', error);
        showError('Erreur lors du téléchargement de la base');
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Télécharger';
    } finally {
        progressDiv.style.display = 'none';
        progressBar.style.width = '0%';
    }
}

// ============== MISC ==============

function makeRowsClickable(tableSelector, clickHandler) {
    const table = document.querySelector(tableSelector);
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        row.style.cursor = 'pointer';
        row.addEventListener('click', clickHandler);
        row.addEventListener('hover', function() {
            this.style.backgroundColor = '#f0f0f0';
        });
    });
}

function resetAnalysis() {
    currentSessionId = null;
    currentLogType = null;
    analysisData = {};

    if (uploadForm) uploadForm.reset();
    const csvCheck = document.getElementById('csv-check');
    const usermapCheck = document.getElementById('usermap-check');
    const fileInfo = document.getElementById('file-info');
    const uploadError = document.getElementById('upload-error');
    if (csvCheck) csvCheck.style.display = 'none';
    if (usermapCheck) usermapCheck.style.display = 'none';
    if (fileInfo) fileInfo.style.display = 'none';
    if (uploadError) uploadError.style.display = 'none';

    if (uploadSection) uploadSection.style.display = 'block';
    if (dashboardSection) dashboardSection.style.display = 'none';

    if (navbarStatus) navbarStatus.textContent = 'Bienvenue';

    if (csvFileInput) csvFileInput.value = '';
}
