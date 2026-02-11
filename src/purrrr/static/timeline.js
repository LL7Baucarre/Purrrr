// =============================================
// purrrr - Timeline & Pagination
// =============================================

// Constante pour la pagination
let ITEMS_PER_PAGE = 15;

// Variable globale pour stocker les données complètes des logs
let allLogsData = {};

// Fonction pour obtenir le nombre d'éléments par page actuel
function getItemsPerPage() {
    const selector = document.getElementById('items-per-page');
    if (selector) {
        return parseInt(selector.value) || 15;
    }
    return ITEMS_PER_PAGE;
}

function createPaginatedTable(operationDetails, operationType) {
    const itemsPerPage = getItemsPerPage();
    const totalPages = Math.ceil(operationDetails.length / itemsPerPage);
    let currentPage = 1;

    const tableHTML = operationDetails.length > 0 ? 
        operationDetails.map((detail, index) => `
            <tr style="cursor: pointer;" data-operation-type="${operationType}" data-detail-index="${index}">
                <td><small class="text-muted">${detail.timestamp ? new Date(detail.timestamp).toLocaleString('fr-FR') : '-'}</small></td>
                <td><small title="${detail.subject || ''}">${detail.subject || '-'}</small></td>
                <td><small>${detail.folder || '-'}</small></td>
                <td style="text-align: right;"><small>${detail.size ? (detail.size / 1024).toFixed(1) + ' KB' : '-'}</small></td>
            </tr>
        `).join('')
        : '<tr><td colspan="4" class="text-center text-muted py-2">Aucun détail disponible</td></tr>';

    const paginationHTML = totalPages > 1 ? `
        <div class="d-flex justify-content-between align-items-center mt-3">
            <small class="text-muted">
                ${operationDetails.length} enregistrement(s)
            </small>
            <nav aria-label="Pagination">
                <ul class="pagination pagination-sm mb-0">
                    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="changePage(event, this, 'prev', '${operationType}', ${totalPages}); return false;">Précédent</a>
                    </li>
                    <li class="page-item active"><span class="page-link" id="page-info-${operationType}">Page 1 / ${totalPages}</span></li>
                    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="changePage(event, this, 'next', '${operationType}', ${totalPages}); return false;">Suivant</a>
                    </li>
                </ul>
            </nav>
        </div>
    ` : '';

    return { tableHTML, paginationHTML, totalPages, totalItems: operationDetails.length };
}

// Fonction pour changer de page
function changePage(event, element, direction, operationType, totalPages) {
    event.preventDefault();
    const pageInfo = document.getElementById(`page-info-${operationType}`);
    if (!pageInfo) return;
    
    const match = pageInfo.textContent.match(/Page (\d+)/);
    let currentPage = match ? parseInt(match[1]) : 1;
    
    if (direction === 'next' && currentPage < totalPages) {
        currentPage++;
    } else if (direction === 'prev' && currentPage > 1) {
        currentPage--;
    }
    
    pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;
    
    // Mettre à jour l'affichage des lignes
    updateTablePage(operationType, currentPage);
    
    // Mettre à jour l'état des boutons prev/next
    const pagination = element.closest('.pagination');
    if (pagination) {
        const links = pagination.querySelectorAll('a.page-link');
        links.forEach(link => {
            if (link.textContent.includes('Précédent')) {
                link.parentElement.classList.toggle('disabled', currentPage === 1);
            } else if (link.textContent.includes('Suivant')) {
                link.parentElement.classList.toggle('disabled', currentPage === totalPages);
            }
        });
    }
}

// Fonction pour mettre à jour l'affichage de la page
function updateTablePage(operationType, pageNumber) {
    const rows = document.querySelectorAll(`tr[data-operation-type="${operationType}"]`);
    const itemsPerPage = getItemsPerPage();
    const startIdx = (pageNumber - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    
    rows.forEach((row, index) => {
        row.style.display = (index >= startIdx && index < endIdx) ? '' : 'none';
    });
}

function initializeTimelinePagination(operations) {
    const timelineTable = document.querySelector('#exchange-timeline tbody');
    const paginationNav = document.getElementById('timeline-pagination');
    const pageInfo = document.getElementById('timeline-page-info');
    const TIMELINE_ITEMS_PER_PAGE = getItemsPerPage();
    
    // Combine pinned logs with regular operations (pinned first)
    const combinedOps = [...pinnedLogs, ...operations];
    
    const totalPages = Math.ceil(combinedOps.length / TIMELINE_ITEMS_PER_PAGE);
    
    if (totalPages <= 1) {
        paginationNav.style.display = 'none';
    } else {
        paginationNav.style.display = 'block';
    }
    
    // Store pagination info globally
    window.timelineCurrentPage = 1;
    window.timelinePageInfo = pageInfo;
    window.timelineTotalPages = totalPages;
    window.timelineCurrentOperations = combinedOps;  // Store combined operations with pinned first
    
    // Render first page
    updateTimelinePage(1);
}

function updateTimelinePage(pageNumber) {
    const timelineTable = document.querySelector('#exchange-timeline tbody');
    const operations = window.timelineCurrentOperations || window.timelineAllOperations || [];
    const TIMELINE_ITEMS_PER_PAGE = getItemsPerPage();
    const startIdx = (pageNumber - 1) * TIMELINE_ITEMS_PER_PAGE;
    const endIdx = startIdx + TIMELINE_ITEMS_PER_PAGE;
    const pageOps = operations.slice(startIdx, endIdx);
    
    timelineTable.innerHTML = '';
    const visibleCols = AVAILABLE_COLUMNS.filter(col => col.visible);
    
    pageOps.forEach((op, pageIndex) => {
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        
        // Check if pinned and apply style
        const isPinned = isLogPinned(op);
        if (isPinned) {
            row.style.backgroundColor = '#fff3cd';
            row.style.borderLeft = '4px solid #ffc107';
        }
        
        let htmlContent = '';
        visibleCols.forEach(col => {
            const value = getColumnValue(op, col.key);
            htmlContent += `<td>${value}</td>`;
        });
        
        // Add pin button
        const pinButtonColor = isPinned ? '#ffc107' : '#ccc';
        const pinButtonClass = isPinned ? 'pin-button-pinned' : '';
        const pinButton = `
            <td style="text-align: center;">
                <button class="btn btn-sm btn-link p-0 ${pinButtonClass}" 
                        title="${isPinned ? 'Dépincer' : 'Pincer cet événement'}">
                    <i class="fas fa-thumbtack" style="color: ${pinButtonColor};"></i>
                </button>
            </td>
        `;
        htmlContent += pinButton;
        
        row.innerHTML = htmlContent;
        
        // Add click event to pin button
        const pinBtn = row.querySelector('.btn-link');
        if (pinBtn) {
            pinBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                togglePinLog(op);
            });
        }
        
        // Add click event to show details modal (only for data cells, not button)
        const dataCells = row.querySelectorAll('td:not(:last-child)');
        dataCells.forEach(cell => {
            cell.style.cursor = 'pointer';
            cell.addEventListener('click', () => {
                showLogDetails({
                    timestamp: op.timestamp || '',
                    operation: op.operation || '',
                    subject: op.subject || '',
                    folder: op.folder || '',
                    size: op.size || 0,
                    user: op.user || '',
                    full_data: op.full_data || null  // Passer les données complètes
                });
            });
        });
        
        // Hover effect
        row.addEventListener('mouseenter', () => {
            if (!isPinned) {
                row.style.backgroundColor = '#f0f0f0';
            } else {
                row.style.backgroundColor = '#ffe69c';
            }
        });
        row.addEventListener('mouseleave', () => {
            if (!isPinned) {
                row.style.backgroundColor = '';
            } else {
                row.style.backgroundColor = '#fff3cd';
            }
        });
        
        timelineTable.appendChild(row);
    });
    
    // Update page info
    if (window.timelinePageInfo) {
        window.timelinePageInfo.textContent = `Page ${pageNumber} / ${window.timelineTotalPages}`;
    }
    
    window.timelineCurrentPage = pageNumber;
    
    // Update button states
    const firstBtn = document.querySelector('a[data-timeline-direction="first"]');
    const prev10Btn = document.querySelector('a[data-timeline-direction="prev-10"]');
    const prev5Btn = document.querySelector('a[data-timeline-direction="prev-5"]');
    const prevBtn = document.querySelector('a[data-timeline-direction="prev"]');
    const nextBtn = document.querySelector('a[data-timeline-direction="next"]');
    const next5Btn = document.querySelector('a[data-timeline-direction="next-5"]');
    const next10Btn = document.querySelector('a[data-timeline-direction="next-10"]');
    const lastBtn = document.querySelector('a[data-timeline-direction="last"]');
    
    // Disable "first" and "prev" buttons at page 1
    if (firstBtn) {
        firstBtn.parentElement.classList.toggle('disabled', pageNumber === 1);
    }
    if (prev10Btn) {
        prev10Btn.parentElement.classList.toggle('disabled', pageNumber === 1);
    }
    if (prev5Btn) {
        prev5Btn.parentElement.classList.toggle('disabled', pageNumber === 1);
    }
    if (prevBtn) {
        prevBtn.parentElement.classList.toggle('disabled', pageNumber === 1);
    }
    
    // Disable "next", "next-5", "next-10", and "last" buttons at last page
    if (nextBtn) {
        nextBtn.parentElement.classList.toggle('disabled', pageNumber === window.timelineTotalPages);
    }
    if (next5Btn) {
        next5Btn.parentElement.classList.toggle('disabled', pageNumber === window.timelineTotalPages);
    }
    if (next10Btn) {
        next10Btn.parentElement.classList.toggle('disabled', pageNumber === window.timelineTotalPages);
    }
    if (lastBtn) {
        lastBtn.parentElement.classList.toggle('disabled', pageNumber === window.timelineTotalPages);
    }
}

function changeTimelinePage(event, direction) {
    event.preventDefault();
    
    const currentPage = window.timelineCurrentPage || 1;
    const totalPages = window.timelineTotalPages || 1;
    let newPage = currentPage;
    
    switch(direction) {
        case 'first':
            newPage = 1;
            break;
        case 'prev-10':
            newPage = Math.max(1, currentPage - 10);
            break;
        case 'prev-5':
            newPage = Math.max(1, currentPage - 5);
            break;
        case 'prev':
            newPage = Math.max(1, currentPage - 1);
            break;
        case 'next':
            newPage = Math.min(totalPages, currentPage + 1);
            break;
        case 'next-5':
            newPage = Math.min(totalPages, currentPage + 5);
            break;
        case 'next-10':
            newPage = Math.min(totalPages, currentPage + 10);
            break;
        case 'last':
            newPage = totalPages;
            break;
    }
    
    if (newPage !== currentPage) {
        updateTimelinePage(newPage);
    }
}

function displayExchange(data, sessionId) {
    // Update badges only (removed KPI section)
    document.getElementById('badge-timeline').textContent = data.total_operations?.toLocaleString() || '0';

    // 2. Chronologie complète (avec filtres)
    const timelineTable = document.querySelector('#exchange-timeline tbody');
    if (timelineTable && data.detailed_operations) {
        timelineTable.innerHTML = '';
        
        // Trier par date décroissante
        const sorted = [...data.detailed_operations].sort((a, b) => {
            const dateA = new Date(a.timestamp || 0);
            const dateB = new Date(b.timestamp || 0);
            return dateB - dateA;
        });
        
        // Add session_id to each operation
        sorted.forEach(op => {
            op.session_id = sessionId;
        });
        
        // Store sorted operations globally for pagination
        // Store original operations for filtering
        window.timelineOriginalOperations = sorted;
        window.timelineAllOperations = sorted;
        
        // Populate filter dropdowns with unique values
        populateFilterDropdowns(sorted);
        
        // Render table header with columns
        renderTableHeader();
        
        if (sorted.length === 0) {
            timelineTable.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">Aucune donnée</td></tr>';
        } else {
            // Initialize timeline pagination
            initializeTimelinePagination(sorted);
            
            // Analyze patterns
            analyzePatterns(sorted);
        }
    }
}

function analyzePatterns(operations) {
    if (!operations || operations.length === 0) {
        document.getElementById('badge-patterns').textContent = '0';
        return;
    }

    // Count pattern occurrences
    const patterns = {
        userIp: {},      // user -> ip -> count
        userOp: {},      // user -> operation -> count
        opIp: {},        // operation -> ip -> count
        userOpIp: {}     // user -> operation -> ip -> count
    };

    operations.forEach(op => {
        const user = op.user || 'Inconnu';
        const ip = op.ClientIP || op.client_ip || op.ClientIPAddress || op.SenderIp || 'Inconnu';
        const operation = op.operation || 'Inconnu';

        // User + IP pattern
        if (!patterns.userIp[user]) patterns.userIp[user] = {};
        patterns.userIp[user][ip] = (patterns.userIp[user][ip] || 0) + 1;

        // User + Operation pattern
        if (!patterns.userOp[user]) patterns.userOp[user] = {};
        patterns.userOp[user][operation] = (patterns.userOp[user][operation] || 0) + 1;

        // Operation + IP pattern
        if (!patterns.opIp[operation]) patterns.opIp[operation] = {};
        patterns.opIp[operation][ip] = (patterns.opIp[operation][ip] || 0) + 1;

        // User + Operation + IP pattern
        const key = `${user}|${operation}|${ip}`;
        patterns.userOpIp[key] = (patterns.userOpIp[key] || 0) + 1;
    });

    // Render patterns in tables
    renderPatternTable('pattern-user-ip', patterns.userIp, 2);
    renderPatternTable('pattern-user-op', patterns.userOp, 2);
    renderPatternTable('pattern-op-ip', patterns.opIp, 2);
    renderComplexPatternTable('pattern-user-op-ip', patterns.userOpIp);
    
    // Render countries statistics
    renderCountriesPatterns(operations);

    // Update badge with total unique patterns
    const totalPatterns = Object.keys(patterns.userOpIp).length;
    document.getElementById('badge-patterns').textContent = totalPatterns.toLocaleString();
}

function renderPatternTable(tableId, patterns, columnCount) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    // Flatten patterns to arrays and sort by count
    const items = [];
    Object.keys(patterns).forEach(key1 => {
        Object.keys(patterns[key1]).forEach(key2 => {
            items.push({
                col1: key1,
                col2: key2,
                count: patterns[key1][key2]
            });
        });
    });

    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${columnCount + 1}" class="text-center text-muted py-3"><small>Aucun pattern détecté</small></td></tr>`;
        return;
    }

    // Sort by count descending (top 50)
    items.sort((a, b) => b.count - a.count);
    items.slice(0, 50).forEach(item => {
        const row = document.createElement('tr');
        const countBadgeClass = item.count > 20 ? 'danger' : item.count > 10 ? 'warning' : 'info';
        row.innerHTML = `
            <td><small title="${item.col1}">${item.col1.length > 40 ? item.col1.substring(0, 40) + '...' : item.col1}</small></td>
            <td><small title="${item.col2}">${item.col2.length > 40 ? item.col2.substring(0, 40) + '...' : item.col2}</small></td>
            <td class="text-end"><span class="badge bg-${countBadgeClass}">${item.count}</span></td>
        `;
        tbody.appendChild(row);
    });
}

function renderComplexPatternTable(tableId, patterns) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    // Convert patterns object to sorted array
    const items = Object.keys(patterns).map(key => {
        const [user, operation, ip] = key.split('|');
        return {
            user,
            operation,
            ip,
            count: patterns[key]
        };
    });

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3"><small>Aucun pattern détecté</small></td></tr>';
        return;
    }

    // Sort by count descending (top 50)
    items.sort((a, b) => b.count - a.count);
    items.slice(0, 50).forEach(item => {
        const row = document.createElement('tr');
        const countBadgeClass = item.count > 20 ? 'danger' : item.count > 10 ? 'warning' : 'info';
        const userDisplay = item.user.length > 25 ? item.user.substring(0, 25) + '...' : item.user;
        const ipDisplay = item.ip.length > 18 ? item.ip.substring(0, 18) + '...' : item.ip;
        row.innerHTML = `
            <td><small title="${item.user}">${userDisplay}</small></td>
            <td><small><span class="badge bg-secondary" title="${item.operation}">${item.operation.length > 30 ? item.operation.substring(0, 30) + '...' : item.operation}</span></small></td>
            <td><small title="${item.ip}">${ipDisplay}</small></td>
            <td class="text-end"><span class="badge bg-${countBadgeClass}">${item.count}</span></td>
        `;
        tbody.appendChild(row);
    });
}

function createOperationsChart(operations) {
    const ctx = document.getElementById('files-operations-chart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (window.operationsChart) {
        window.operationsChart.destroy();
    }

    const labels = Object.keys(operations).slice(0, 15);
    const data = Object.values(operations).slice(0, 15);

    const colors = [
        '#0d6efd', '#6c757d', '#198754', '#dc3545', '#ffc107',
        '#0dcaf0', '#fd7e14', '#6f42c1', '#e83e8c', '#20c997',
        '#a5d8ff', '#e2e3e5', '#d1e7dd', '#f8d7da', '#fff3cd'
    ];

    window.operationsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Opérations',
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderColor: colors.slice(0, labels.length),
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    padding: 12,
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 },
                    cornerRadius: 4
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: { size: 12 }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: { size: 11 }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}
