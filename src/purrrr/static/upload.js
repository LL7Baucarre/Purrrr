// =============================================
// purrrr - Upload & Analysis Display
// =============================================

async function handleFileUpload(e) {
    e.preventDefault();

    const file = csvFileInput.files[0];
    if (!file) {
        showError('Veuillez sélectionner un fichier CSV');
        return;
    }

    // Show loading state on upload button
    submitBtn.disabled = true;
    document.getElementById('upload-spinner').style.display = 'inline-block';
    document.getElementById('submit-text').textContent = 'Envoi en cours...';
    document.getElementById('upload-error').style.display = 'none';

    try {
        // ── STEP 1: Upload file ──
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        if (!uploadResponse.ok) {
            const error = await uploadResponse.json();
            throw new Error(error.error || 'Erreur lors du téléchargement');
        }

        const uploadData = await uploadResponse.json();
        currentSessionId = uploadData.session_id;
        currentLogType = uploadData.log_type;

        // ── STEP 2: Switch to dashboard immediately ──
        uploadSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        window.scrollTo(0, 0);
        navbarStatus.textContent = `Session: ${currentSessionId.substring(0, 8)}... | Type: ${uploadData.log_type}`;

        // ── STEP 3: Show progress UI ──
        showAnalysisProgress(
            `Fichier "${uploadData.filename}" chargé — ${uploadData.rows.toLocaleString()} lignes`
        );

        // ── STEP 4: Start background analysis ──
        await launchAnalysisWithProgress(currentSessionId, 'exchange');

    } catch (error) {
        console.error('Upload error:', error);
        showError(error.message);
    } finally {
        submitBtn.disabled = false;
        document.getElementById('upload-spinner').style.display = 'none';
        document.getElementById('submit-text').textContent = 'Analyser les données';
    }
}

// ─────────────────────────────────────────────
//  Analysis progress system (clean rewrite)
// ─────────────────────────────────────────────

function showAnalysisProgress(initialMessage) {
    const container = document.getElementById('dashboard-progress-container');
    if (!container) return;
    container.style.display = 'block';

    // Status messages
    const msgBox = document.getElementById('dashboard-status-messages');
    if (msgBox) {
        msgBox.innerHTML = '';
        appendStatusMessage(msgBox, initialMessage);
    }

    // Progress bar
    const barBox = document.getElementById('dashboard-progress-bar');
    if (barBox) {
        barBox.innerHTML = `
            <div style="font-size:14px;margin-bottom:10px;font-weight:600;color:#0d6efd">
                <i class="fas fa-spinner fa-spin"></i>
                <span id="progress-label">Initialisation de l'analyse...</span>
            </div>
            <div style="width:100%;height:30px;background:#e9ecef;border-radius:15px;overflow:hidden;box-shadow:inset 0 1px 3px rgba(0,0,0,.1)">
                <div id="progress-bar" style="height:100%;background:linear-gradient(90deg,#0d6efd,#0056b3);width:0%;transition:width .3s ease;display:flex;align-items:center;justify-content:center">
                    <span id="progress-percent" style="color:#fff;font-weight:700;font-size:13px;text-shadow:0 1px 2px rgba(0,0,0,.2)">0%</span>
                </div>
            </div>
        `;
    }
}

function hideAnalysisProgress() {
    const container = document.getElementById('dashboard-progress-container');
    if (container) container.style.display = 'none';
}

function setProgress(percent, message) {
    const bar = document.getElementById('progress-bar');
    const pct = document.getElementById('progress-percent');
    const lbl = document.getElementById('progress-label');
    if (bar) bar.style.width = percent + '%';
    if (pct) pct.textContent = Math.round(percent) + '%';
    if (lbl) lbl.textContent = message;
}

function appendStatusMessage(container, text) {
    const div = document.createElement('div');
    div.style.cssText = 'margin:4px 0;color:#333';
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

/**
 * Full lifecycle: start → poll → fetch result → display.
 * Every HTTP call returns immediately, nothing blocks the UI.
 */
async function launchAnalysisWithProgress(sessionId, analysisType) {
    // 1. Tell the server to start (returns immediately)
    const startResp = await fetch(`/api/analysis/start/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis_type: analysisType })
    });

    if (!startResp.ok) {
        const err = await startResp.json();
        throw new Error(err.error || 'Impossible de lancer l\'analyse');
    }

    const startData = await startResp.json();

    // If cached, result is ready right away
    if (startData.cached) {
        setProgress(100, 'Chargé depuis le cache');
    }

    // 2. Poll progress until complete
    await new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
            try {
                const resp = await fetch(`/api/analysis/progress/${sessionId}`);
                if (!resp.ok) return;
                const p = await resp.json();

                setProgress(p.percent, p.message);

                if (p.complete) {
                    clearInterval(interval);
                    if (p.error) {
                        reject(new Error(p.message));
                    } else {
                        resolve();
                    }
                }
            } catch (err) {
                console.error('Poll error:', err);
            }
        }, 400);
    });

    // 3. Fetch the actual result
    const resultResp = await fetch(`/api/analysis/result/${sessionId}`);
    if (!resultResp.ok) {
        throw new Error('Impossible de récupérer les résultats');
    }
    const result = await resultResp.json();
    analysisData[analysisType] = result;

    // 4. Hide progress, display results
    setTimeout(hideAnalysisProgress, 1500);
    displayAnalysisResults(analysisType, result, sessionId);
}

async function handleAddFile() {
    const fileInput = document.getElementById('additional-csv-file');
    const file = fileInput.files[0];
    
    if (!file) {
        showAddFileError('Veuillez sélectionner un fichier CSV');
        return;
    }
    
    if (!currentSessionId) {
        showAddFileError('Aucune session active. Veuillez d\'abord charger un fichier');
        return;
    }

    // Show loading state
    const addFileSubmitBtn = document.getElementById('add-file-submit-btn');
    const addFileSpinner = document.getElementById('add-file-spinner');
    const addFileText = document.getElementById('add-file-text');
    
    addFileSubmitBtn.disabled = true;
    addFileSpinner.style.display = 'inline-block';
    addFileText.textContent = 'Ajout en cours...';
    document.getElementById('add-file-error').style.display = 'none';

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`/api/upload/${currentSessionId}`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors du téléchargement');
        }

        const data = await response.json();
        
        // Update file info with accumulated info
        const rowsElement = document.getElementById('info-rows');
        if (rowsElement) {
            const currentRows = parseInt(rowsElement.textContent.replace(/\s/g, ''));
            rowsElement.textContent = (currentRows + data.rows_added).toLocaleString();
        }

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addFileModal'));
        modal.hide();
        
        // Reset form
        document.getElementById('add-file-form').reset();
        fileInput.value = '';
        
        // Reload analysis data
        await loadAnalysisData('exchange');
        
        // Show success message
        showSuccessMessage('Fichier supplémentaire chargé avec succès');

    } catch (error) {
        console.error('Add file error:', error);
        showAddFileError(error.message);
    } finally {
        addFileSubmitBtn.disabled = false;
        addFileSpinner.style.display = 'none';
        addFileText.textContent = 'Ajouter les données';
    }
}

function showAddFileError(message) {
    const errorDiv = document.getElementById('add-file-error');
    const errorMessage = document.getElementById('add-file-error-message');
    errorMessage.textContent = message;
    errorDiv.style.display = 'block';
}

async function loadTabData(tabId) {
    await loadAnalysisData('exchange');
}

async function loadAnalysisData(analysisType) {
    if (!currentSessionId) return;
    try {
        showAnalysisProgress('Relance de l\'analyse...');
        await launchAnalysisWithProgress(currentSessionId, analysisType);
    } catch (error) {
        console.error('Analysis error:', error);
        showError(`Erreur lors de l'analyse: ${error.message}`);
        hideAnalysisProgress();
    }
}

function displayAnalysisResults(analysisType, data, sessionId) {
    switch (analysisType) {
        case 'summary':
            displaySummary(data);
            break;
        case 'file_operations':
            displayFileOperations(data);
            break;
        case 'user_activity':
            displayUserActivity(data);
            break;
        case 'exchange':
            displayExchange(data, sessionId);
            break;
    }
}

function displaySummary(data) {
    if (data.log_type) {
        const badgeClass = {
            'purview': 'bg-primary',
            'exchange': 'bg-success',
            'entra': 'bg-info',
            'unknown': 'bg-secondary'
        }[data.log_type] || 'bg-secondary';

        document.getElementById('summary-log-type').textContent = data.log_type.toUpperCase();
        document.getElementById('summary-log-type').className = `badge ${badgeClass}`;
    }

    document.getElementById('summary-records').textContent = data.total_records?.toLocaleString() || '0';
    document.getElementById('summary-columns').textContent = data.columns?.length || '0';
    document.getElementById('summary-size').textContent = data.file_info?.memory_usage || 'N/A';

    if (data.date_range) {
        document.getElementById('summary-start-date').textContent = formatDate(data.date_range.start);
        document.getElementById('summary-end-date').textContent = formatDate(data.date_range.end);
    }
}

function displayFileOperations(data) {
    if (data.summary) {
        document.getElementById('files-total-ops').textContent = data.summary.total_operations?.toLocaleString() || '0';
        document.getElementById('files-unique-files').textContent = data.summary.unique_files?.toLocaleString() || '0';
        document.getElementById('files-unique-users').textContent = data.summary.unique_users?.toLocaleString() || '0';
    }

    // Top files
    const topFilesTable = document.querySelector('#files-top-files tbody');
    topFilesTable.innerHTML = '';
    if (data.top_files && Object.keys(data.top_files).length > 0) {
        Object.entries(data.top_files).slice(0, 15).forEach(([file, count]) => {
            const row = document.createElement('tr');
            row.style.cursor = 'pointer';
            row.className = 'file-row';
            row.dataset.filename = file;
            row.dataset.count = count;
            row.innerHTML = `
                <td class="text-truncate-custom" title="${file}">${file}</td>
                <td class="text-end"><span class="badge bg-primary">${count}</span></td>
            `;
            row.addEventListener('click', function() {
                const filename = this.dataset.filename;
                const fileCount = this.dataset.count;
                // Get user breakdown for this file
                const fileInfo = data.files_by_user?.[filename];
                const usersList = fileInfo?.users || [];
                const operations = fileInfo?.operations || {};
                
                const usersHtml = usersList.map(u => `<span class="badge bg-light text-dark me-2 mb-2">${u}</span>`).join('');
                const opsHtml = Object.entries(operations).map(([op, cnt]) => 
                    `<tr><td>${op}</td><td class="text-end"><span class="badge bg-info">${cnt}</span></td></tr>`
                ).join('');
                
                const content = `
                    <div class="mb-3">
                        <h6 class="text-primary"><i class="fas fa-file"></i> ${filename}</h6>
                        <p class="mb-2"><strong>Nombre d'opérations:</strong> <span class="badge bg-primary">${fileCount}</span></p>
                    </div>
                    <div class="mb-3">
                        <h6 class="mb-2"><i class="fas fa-users"></i> Utilisateurs:</h6>
                        <div>${usersHtml || 'Aucun utilisateur'}</div>
                    </div>
                    <div>
                        <h6 class="mb-3"><i class="fas fa-tasks"></i> Types d'opérations</h6>
                        <table class="table table-sm table-hover">
                            <thead>
                                <tr class="table-active">
                                    <th>Opération</th>
                                    <th class="text-end">Nombre</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${opsHtml || '<tr><td colspan="2" class="text-center text-muted">Aucune donnée</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                `;
                showDetails(`Détails - ${filename}`, content);
            });
            topFilesTable.appendChild(row);
        });
    } else {
        topFilesTable.innerHTML = '<tr><td colspan="2" class="text-center text-muted">Aucune donnée</td></tr>';
    }

    // Operations chart
    if (data.operations && Object.keys(data.operations).length > 0) {
        createOperationsChart(data.operations);
    }
    
    // Display users with operations
    const filesUsersDiv = document.getElementById('files-users-detail');
    if (filesUsersDiv) {
        filesUsersDiv.innerHTML = '';
    }
    if (filesUsersDiv && data.top_users_detail && Object.keys(data.top_users_detail).length > 0) {
        Object.entries(data.top_users_detail).slice(0, 10).forEach(([user, stats]) => {
            const opsHtml = Object.entries(stats.operations || {})
                .map(([op, count]) => `<span class="badge bg-light text-dark me-1">${op}: ${count}</span>`)
                .join('');
            
            const userHtml = `
                <div class="mb-3 p-3 border rounded bg-light">
                    <h6 class="fw-bold text-primary mb-2">${user}</h6>
                    <p class="mb-2"><small><strong>Opérations:</strong> <span class="badge bg-info">${stats.count}</span></small></p>
                    <p class="mb-2"><small><strong>Fichiers uniques:</strong> <span class="badge bg-success">${stats.files}</span></small></p>
                    <p class="mb-0"><small><strong>Opérations:</strong></small><br>${opsHtml}</p>
                </div>
            `;
            filesUsersDiv.innerHTML += userHtml;
        });
    } else {
        if (filesUsersDiv) filesUsersDiv.innerHTML = '<p class="text-center text-muted">Aucune donnée</p>';
    }
    
    // Display detailed operations by file
    const detailedOpsDiv = document.getElementById('files-detailed-ops');
    if (detailedOpsDiv) {
        detailedOpsDiv.innerHTML = '';
    }
    if (detailedOpsDiv && data.files_by_user && Object.keys(data.files_by_user).length > 0) {
        Object.entries(data.files_by_user).slice(0, 5).forEach(([file, fileStats]) => {
            const usersHtml = Array.isArray(fileStats.users) 
                ? fileStats.users.map(u => `<span class="badge bg-light text-dark">${u}</span>`).join(' ')
                : 'Aucun utilisateur';
            
            const opsHtml = Object.entries(fileStats.operations || {})
                .map(([op, count]) => `<span class="badge bg-light text-dark me-1">${op}: ${count}</span>`)
                .join('');
            
            const fileHtml = `
                <div class="mb-3 p-3 border rounded bg-light">
                    <h6 class="fw-bold text-primary mb-2"><i class="fas fa-file"></i> ${file}</h6>
                    <p class="mb-2"><small><strong>Opérations:</strong> <span class="badge bg-info">${fileStats.count}</span></small></p>
                    <p class="mb-2"><small><strong>Utilisateurs:</strong></small><br>${usersHtml}</p>
                    <p class="mb-0"><small><strong>Types:</strong></small><br>${opsHtml}</p>
                </div>
            `;
            detailedOpsDiv.innerHTML += fileHtml;
        });
    } else {
        if (detailedOpsDiv) detailedOpsDiv.innerHTML = '<p class="text-center text-muted">Aucune donnée</p>';
    }
}

function displayUserActivity(data) {
    // Top users
    const topUsersTable = document.querySelector('#users-top-users tbody');
    if (topUsersTable) {
        topUsersTable.innerHTML = '';
    }
    if (topUsersTable && data.top_users && Object.keys(data.top_users).length > 0) {
        Object.entries(data.top_users).slice(0, 10).forEach(([user, count]) => {
            const row = document.createElement('tr');
            row.style.cursor = 'pointer';
            row.className = 'user-row';
            row.dataset.username = user;
            row.dataset.count = count;
            row.innerHTML = `
                <td class="text-truncate-custom" title="${user}">${user}</td>
                <td class="text-end"><span class="badge bg-info">${count}</span></td>
            `;
            row.addEventListener('click', function() {
                const username = this.dataset.username;
                const userCount = this.dataset.count;
                const userStats = data.user_stats?.[username];
                
                const content = `
                    <div class="mb-3">
                        <h6 class="text-primary"><i class="fas fa-user"></i> ${username}</h6>
                        <p class="mb-1"><strong>Total d'opérations:</strong> <span class="badge bg-info">${userCount}</span></p>
                        <p class="mb-1"><strong>Fichiers uniques:</strong> <span class="badge bg-success">${userStats?.unique_files || 0}</span></p>
                        <p class="mb-0"><strong>Première activité:</strong> <span class="text-monospace">${formatDate(userStats?.first_action) || '-'}</span></p>
                    </div>
                    ${userStats?.operations_breakdown ? `
                        <div>
                            <h6 class="mb-3"><i class="fas fa-tasks"></i> Opérations</h6>
                            <div class="row">
                                ${Object.entries(userStats.operations_breakdown).map(([op, cnt]) => 
                                    `<div class="col-md-6 mb-2">
                                        <span class="badge bg-light text-dark">${op}: ${cnt}</span>
                                    </div>`
                                ).join('')}
                            </div>
                        </div>
                    ` : ''}
                `;
                showDetails(`Détails - ${username}`, content);
            });
            topUsersTable.appendChild(row);
        });
    } else {
        if (topUsersTable) topUsersTable.innerHTML = '<tr><td colspan="2" class="text-center text-muted">Aucune donnée</td></tr>';
    }

    // User statistics
    const statsDiv = document.getElementById('users-stats');
    if (statsDiv) {
        statsDiv.innerHTML = '';
    }
    if (statsDiv && data.user_stats && Object.keys(data.user_stats).length > 0) {
        Object.entries(data.user_stats).slice(0, 10).forEach(([user, stats]) => {
            const statsHtml = `
                <div class="mb-3 p-3 border rounded bg-light">
                    <h6 class="fw-bold text-primary mb-2">${user}</h6>
                    <p class="mb-1"><small><strong>Opérations:</strong> ${stats.operations || 0}</small></p>
                    <p class="mb-1"><small><strong>Fichiers:</strong> ${stats.unique_files || 0}</small></p>
                    <p class="mb-0"><small class="text-muted"><strong>Début:</strong> ${formatDate(stats.first_action)}</small></p>
                </div>
            `;
            statsDiv.innerHTML += statsHtml;
        });
    } else {
        if (statsDiv) statsDiv.innerHTML = '<p class="text-center text-muted">Aucune donnée</p>';
    }
}
