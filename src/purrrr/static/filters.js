// =============================================
// purrrr - Filters
// =============================================

function getFiltersFromUI() {
    const userValues = Array.from(document.getElementById('filter-user')?.selectedOptions || []).map(opt => opt.value).filter(v => v);
    const actionsVal = $('#filter-actions').val();
    const actionValues = Array.isArray(actionsVal) ? actionsVal : (actionsVal ? [actionsVal] : []);
    
    return {
        user: userValues,
        actions: actionValues,
        files: document.getElementById('filter-files')?.value || '',
        ips: document.getElementById('filter-ips')?.value || '',
        exclude_ips: document.getElementById('exclude-ips')?.value || '',
        start_date: document.getElementById('filter-date-start')?.value || '',
        end_date: document.getElementById('filter-date-end')?.value || '',
        sort_by: document.getElementById('filter-sort-by')?.value || 'date'
    };
}

function matchesIpPattern(ip, pattern) {
    ip = ip.trim();
    pattern = pattern.trim();
    
    if (!pattern.includes('*')) {
        return ip === pattern;
    }
    
    const regexPattern = pattern
        .split('')
        .map(char => {
            if (char === '*') return '\u0000';
            if (/[.+?^${}()|[\]\\]/.test(char)) {
                return '\\' + char;
            }
            return char;
        })
        .join('')
        .replace(/\u0000/g, '.*');
    
    try {
        const regex = new RegExp('^' + regexPattern + '$');
        return regex.test(ip);
    } catch (e) {
        return ip === pattern;
    }
}

function filterIpsList(clientIp, ipFilterString) {
    if (!ipFilterString || ipFilterString.trim() === '') {
        return true;
    }
    
    const patterns = ipFilterString.split(',').map(p => p.trim()).filter(p => p.length > 0);
    return patterns.some(pattern => matchesIpPattern(clientIp, pattern));
}

function applyFilters() {
    const filterWorkloadValues = Array.from(document.getElementById('filter-workload')?.selectedOptions || []).map(opt => opt.value).filter(v => v);
    const filterUserValues = Array.from(document.getElementById('filter-user')?.selectedOptions || []).map(opt => opt.value).filter(v => v);
    const actionsVal = $('#filter-actions').val();
    const filterActionsValues = Array.isArray(actionsVal) ? actionsVal : (actionsVal ? [actionsVal] : []);
    const countryVal = $('#filter-country').val();
    const filterCountryValues = Array.isArray(countryVal) ? countryVal : (countryVal ? [countryVal] : []);
    const asnVal = $('#filter-asn').val();
    const filterAsnValues = Array.isArray(asnVal) ? asnVal : (asnVal ? [asnVal] : []);
    
    const filterFiles = document.getElementById('filter-files')?.value || '';
    const filterIps = document.getElementById('filter-ips')?.value || '';
    const excludeIps = document.getElementById('exclude-ips')?.value || '';
    const filterSessionId = document.getElementById('filter-session-id')?.value || '';
    const filterDateStart = document.getElementById('filter-date-start')?.value || '';
    const filterDateEnd = document.getElementById('filter-date-end')?.value || '';
    
    currentFilters = {};
    if (filterUserValues.length > 0) currentFilters.user = filterUserValues.join(', ');
    if (filterActionsValues.length > 0) currentFilters.actions = filterActionsValues.join(', ');
    if (filterFiles) currentFilters.files = filterFiles;
    if (filterIps) currentFilters.ips = filterIps;
    if (excludeIps) currentFilters.exclude_ips = excludeIps;
    if (filterCountryValues.length > 0) currentFilters.country = filterCountryValues;
    if (filterAsnValues.length > 0) currentFilters.asn = filterAsnValues;
    if (filterSessionId) currentFilters.session_id = filterSessionId;
    if (filterDateStart) currentFilters.start_date = filterDateStart;
    if (filterDateEnd) currentFilters.end_date = filterDateEnd;
    
    const originalOps = window.timelineOriginalOperations || window.timelineAllOperations || [];
    if (!originalOps || originalOps.length === 0) return;
    
    let filtered = originalOps.filter(op => {
        if (filterWorkloadValues.length > 0 && !filterWorkloadValues.some(val => op.Workload?.toLowerCase() === val.toLowerCase())) {
            return false;
        }
        
        if (filterUserValues.length > 0 && !filterUserValues.some(val => op.user?.toLowerCase() === val.toLowerCase())) {
            return false;
        }
        
        if (filterActionsValues.length > 0 && !filterActionsValues.some(val => op.operation?.toLowerCase() === val.toLowerCase())) {
            return false;
        }
        
        if (filterFiles && !op.subject?.toLowerCase().includes(filterFiles.toLowerCase()) && 
                          !op.folder?.toLowerCase().includes(filterFiles.toLowerCase())) {
            return false;
        }
        
        if (filterIps) {
            const clientIp = op.ClientIP || op.client_ip || op.ClientIPAddress || op.SenderIp || '';
            if (!filterIpsList(clientIp, filterIps)) {
                return false;
            }
        }
        
        if (excludeIps) {
            const clientIp = op.ClientIP || op.client_ip || op.ClientIPAddress || op.SenderIp || '';
            if (filterIpsList(clientIp, excludeIps)) {
                return false;
            }
        }
        
        if (filterCountryValues.length > 0) {
            const opCountry = op.geo_country || '';
            if (!filterCountryValues.includes(opCountry)) {
                return false;
            }
        }
        
        if (filterAsnValues.length > 0) {
            const opAsn = op.asn || '';
            if (!filterAsnValues.includes(opAsn)) {
                return false;
            }
        }
        
        if (filterSessionId) {
            const opSessionId = op.session_id || '';
            if (!opSessionId.toLowerCase().includes(filterSessionId.toLowerCase())) {
                return false;
            }
        }
        
        if (filterDateStart) {
            const opDate = op.timestamp ? new Date(op.timestamp) : null;
            const startDate = new Date(filterDateStart);
            if (!opDate || opDate < startDate) {
                return false;
            }
        }
        
        if (filterDateEnd) {
            const opDate = op.timestamp ? new Date(op.timestamp) : null;
            const endDate = new Date(filterDateEnd);
            endDate.setHours(23, 59, 59, 999);
            if (!opDate || opDate > endDate) {
                return false;
            }
        }
        
        return true;
    });
    
    filtered.sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
        const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
        return dateB - dateA;
    });
    
    window.timelineAllOperations = filtered;
    
    const badge = document.getElementById('badge-timeline');
    if (badge) {
        badge.textContent = filtered.length.toLocaleString();
    }
    
    analyzePatterns(filtered);
    initializeTimelinePagination(filtered);
}

function resetFilters() {
    document.getElementById('filter-workload').value = null;
    $('#filter-workload').val(null).trigger('change');
    
    document.getElementById('filter-user').value = null;
    $('#filter-user').val(null).trigger('change');
    
    document.getElementById('filter-actions').value = null;
    $('#filter-actions').val(null).trigger('change');
    
    document.getElementById('filter-files').value = '';
    document.getElementById('filter-ips').value = '';
    document.getElementById('exclude-ips').value = '';
    $('#filter-country').val([]).trigger('change');
    document.getElementById('filter-session-id').value = '';
    document.getElementById('filter-date-start').value = '';
    document.getElementById('filter-date-end').value = '';
    const sortDropdown = document.getElementById('filter-sort-by');
    if (sortDropdown) {
        sortDropdown.value = 'date';
    }
    currentFilters = {};
    
    if (window.timelineOriginalOperations) {
        window.timelineAllOperations = window.timelineOriginalOperations;
        
        const badge = document.getElementById('badge-timeline');
        if (badge) {
            badge.textContent = window.timelineOriginalOperations.length.toLocaleString();
        }
        
        analyzePatterns(window.timelineOriginalOperations);
        initializeTimelinePagination(window.timelineOriginalOperations);
    }
}

function updateFileInputStatus(elementId, value) {
    const element = document.getElementById(elementId);
    if (value) {
        element.style.display = 'inline';
    } else {
        element.style.display = 'none';
    }
}

function populateFilterDropdowns(operations) {
    const userMap = new Map();
    const uniqueOperations = new Set();
    const uniqueWorkloads = new Set();
    const uniqueCountries = new Map();
    const uniqueAsns = new Map();
    
    operations.forEach(op => {
        if (op.user) {
            const lowerUser = op.user.toLowerCase();
            if (!userMap.has(lowerUser)) {
                userMap.set(lowerUser, op.user);
            }
        }
        if (op.operation) uniqueOperations.add(op.operation);
        if (op.Workload) uniqueWorkloads.add(op.Workload);
        if (op.geo_country_code && op.geo_country) {
            uniqueCountries.set(op.geo_country_code, op.geo_country);
        }
        if (op.asn) {
            const asnDisplay = op.as_name || op.asn;
            uniqueAsns.set(op.asn, asnDisplay);
        }
    });
    
    const workloadSelect = document.getElementById('filter-workload');
    if (workloadSelect) {
        const currentValue = workloadSelect.value;
        workloadSelect.innerHTML = '<option value="">Toutes les workloads</option>';
        Array.from(uniqueWorkloads).sort().forEach(workload => {
            const option = document.createElement('option');
            option.value = workload;
            option.textContent = workload;
            workloadSelect.appendChild(option);
        });
        workloadSelect.value = currentValue;
    }
    
    const userSelect = document.getElementById('filter-user');
    if (userSelect) {
        const currentValue = userSelect.value;
        userSelect.innerHTML = '<option value="">Tous les utilisateurs</option>';
        Array.from(userMap.values()).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())).forEach(user => {
            const option = document.createElement('option');
            option.value = user;
            option.textContent = user;
            userSelect.appendChild(option);
        });
        userSelect.value = currentValue;
    }
    
    const actionsSelect = document.getElementById('filter-actions');
    if (actionsSelect) {
        const currentValues = $(actionsSelect).val() || [];
        actionsSelect.innerHTML = '<option value="">Toutes les actions</option>';
        Array.from(uniqueOperations).sort().forEach(operation => {
            const option = document.createElement('option');
            option.value = operation;
            option.textContent = operation;
            actionsSelect.appendChild(option);
        });
        if (currentValues.length > 0) {
            $(actionsSelect).val(currentValues);
        }
        $(actionsSelect).trigger('change.select2');
    }
    
    const countrySelect = document.getElementById('filter-country');
    if (countrySelect) {
        const currentValues = $(countrySelect).val() || [];
        countrySelect.innerHTML = '<option value="">Tous les pays</option>';
        Array.from(uniqueCountries.values()).sort().forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countrySelect.appendChild(option);
        });
        if (currentValues.length > 0) {
            $(countrySelect).val(currentValues);
        }
        $(countrySelect).trigger('change.select2');
    }
    
    const asnSelect = document.getElementById('filter-asn');
    if (asnSelect) {
        const currentValues = $(asnSelect).val() || [];
        asnSelect.innerHTML = '<option value="">Tous les ASN</option>';
        Array.from(uniqueAsns.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .forEach(([asn, display]) => {
                const option = document.createElement('option');
                option.value = asn;
                option.textContent = display;
                asnSelect.appendChild(option);
            });
        if (currentValues.length > 0) {
            $(asnSelect).val(currentValues);
        }
        $(asnSelect).trigger('change.select2');
    }
}

// Fonctions de filtrage pour la chronologie (legacy)
function applyTimelineFilters() {
    const filterIps = document.getElementById('filter-ips')?.value || '';
    const excludeIps = document.getElementById('exclude-ips')?.value || '';
    const filterUser = document.getElementById('filter-user')?.value || '';
    const filterOperation = document.getElementById('filter-operation')?.value || '';
    
    const originalOps = window.timelineOriginalOperations || window.timelineAllOperations || [];
    if (!originalOps || originalOps.length === 0) return;
    
    let filtered = originalOps.filter(op => {
        if (filterIps) {
            const clientIp = op.ClientIP || op.client_ip || op.ClientIPAddress || op.SenderIp || '';
            if (!clientIp.includes(filterIps)) {
                return false;
            }
        }
        
        if (excludeIps) {
            const clientIp = op.ClientIP || op.client_ip || op.ClientIPAddress || op.SenderIp || '';
            if (clientIp.includes(excludeIps)) {
                return false;
            }
        }
        
        if (filterUser && !op.user?.toLowerCase().includes(filterUser.toLowerCase())) {
            return false;
        }
        
        if (filterOperation && !op.operation?.toLowerCase().includes(filterOperation.toLowerCase())) {
            return false;
        }
        
        return true;
    });
    
    window.timelineAllOperations = filtered;
    initializeTimelinePagination(filtered);
}

function resetTimelineFilters() {
    document.getElementById('filter-ips').value = '';
    document.getElementById('exclude-ips').value = '';
    document.getElementById('filter-user').value = '';
    document.getElementById('filter-operation').value = '';
    
    if (window.timelineOriginalOperations) {
        window.timelineAllOperations = window.timelineOriginalOperations;
        initializeTimelinePagination(window.timelineOriginalOperations);
    }
}
