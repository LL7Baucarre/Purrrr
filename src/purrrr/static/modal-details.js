// =============================================
// purrrr - Modal Details (Log Details Modal)
// =============================================

// Fonction pour afficher les détails du log dans la modale avancée
function showLogDetails(detail) {
    const auditData = detail.full_data || detail;
    
    window.currentAuditData = auditData;
    
    const workload = auditData.Workload || 'Unknown';
    
    const statusBadge = auditData.ResultStatus === 'Succeeded' || auditData.ResultStatus === 'Success'
        ? '<span class="badge bg-success">✓ Succès</span>'
        : auditData.ResultStatus === 'Failed' || auditData.ResultStatus === 'Failure'
        ? '<span class="badge bg-danger">✗ Échec</span>'
        : auditData.ResultStatus === 'PartiallySucceeded'
        ? '<span class="badge bg-warning text-dark">⚠ Partiel</span>'
        : '<span class="badge bg-secondary">' + (auditData.ResultStatus || '-') + '</span>';
    
    const workloadColors = {
        'Exchange': 'primary',
        'SharePoint': 'success',
        'OneDrive': 'info',
        'AzureActiveDirectory': 'warning',
        'MicrosoftTeams': 'purple',
        'SecurityComplianceCenter': 'danger',
        'PowerBI': 'dark',
        'Sway': 'secondary',
        'Yammer': 'info'
    };
    const wlColor = workloadColors[workload] || 'secondary';
    const workloadLabel = getWorkloadLabel(workload);
    document.getElementById('quick-workload').innerHTML = `<span class="badge bg-${wlColor}">${workloadLabel}</span>`;
    
    document.getElementById('quick-operation').textContent = auditData.Operation || '-';
    document.getElementById('quick-user').textContent = auditData.UserId || '-';
    document.getElementById('quick-date').textContent = formatDate(auditData.CreationTime) || '-';
    document.getElementById('quick-status').innerHTML = statusBadge;
    
    adaptModalTabs(workload, auditData);
    renderInfosTab(auditData);
    renderFoldersTab(auditData);
    renderItemsTab(auditData);
    
    document.getElementById('json-complete').textContent = JSON.stringify(auditData, null, 2);
    setupJsonSearch(auditData);
    
    const modal = new bootstrap.Modal(document.getElementById('logDetailsModal'));
    modal.show();
}

function getWorkloadLabel(workload) {
    const labels = {
        'Exchange': 'Exchange',
        'SharePoint': 'SharePoint',
        'OneDrive': 'OneDrive',
        'AzureActiveDirectory': 'Entra ID (Azure AD)',
        'MicrosoftTeams': 'Microsoft Teams',
        'SecurityComplianceCenter': 'Sécurité & Conformité',
        'PowerBI': 'Power BI',
        'Sway': 'Sway',
        'Yammer': 'Yammer',
        'MicrosoftForms': 'Microsoft Forms',
        'MicrosoftStream': 'Microsoft Stream',
        'ThreatIntelligence': 'Threat Intelligence',
        'PowerApps': 'Power Apps',
        'PowerAutomate': 'Power Automate',
        'Dynamics365': 'Dynamics 365'
    };
    return labels[workload] || workload;
}

function adaptModalTabs(workload, auditData) {
    const foldersTab = document.getElementById('folders-tab');
    const itemsTab = document.getElementById('items-tab');
    
    if (foldersTab) foldersTab.closest('.nav-item').style.display = '';
    if (itemsTab) itemsTab.closest('.nav-item').style.display = '';
    
    switch (workload) {
        case 'Exchange':
            if (foldersTab) {
                foldersTab.innerHTML = '<i class="fas fa-folder me-2"></i>Dossiers Mail';
                foldersTab.closest('.nav-item').style.display = (auditData.Folders && auditData.Folders.length > 0) ? '' : 'none';
            }
            if (itemsTab) {
                itemsTab.innerHTML = '<i class="fas fa-envelope me-2"></i>Éléments Mail';
                const hasItems = (auditData.AffectedItems && auditData.AffectedItems.length > 0) || auditData.Item;
                itemsTab.closest('.nav-item').style.display = hasItems ? '' : 'none';
            }
            break;
            
        case 'SharePoint':
        case 'OneDrive':
            if (foldersTab) {
                foldersTab.innerHTML = '<i class="fas fa-folder-open me-2"></i>Fichiers & Dossiers';
                foldersTab.closest('.nav-item').style.display = '';
            }
            if (itemsTab) {
                itemsTab.innerHTML = '<i class="fas fa-file me-2"></i>Détails Fichier';
                itemsTab.closest('.nav-item').style.display = '';
            }
            break;
            
        case 'AzureActiveDirectory':
            if (foldersTab) {
                foldersTab.innerHTML = '<i class="fas fa-key me-2"></i>Propriétés Modifiées';
                const hasModifiedProps = auditData.ModifiedProperties && auditData.ModifiedProperties.length > 0;
                foldersTab.closest('.nav-item').style.display = hasModifiedProps ? '' : 'none';
            }
            if (itemsTab) {
                itemsTab.innerHTML = '<i class="fas fa-user-shield me-2"></i>Cibles';
                const hasTarget = auditData.Target && auditData.Target.length > 0;
                itemsTab.closest('.nav-item').style.display = hasTarget ? '' : 'none';
            }
            break;
            
        case 'MicrosoftTeams':
            if (foldersTab) {
                foldersTab.innerHTML = '<i class="fas fa-users me-2"></i>Équipes & Canaux';
            }
            if (itemsTab) {
                itemsTab.innerHTML = '<i class="fas fa-comments me-2"></i>Détails Teams';
            }
            break;
            
        default:
            if (foldersTab) foldersTab.innerHTML = '<i class="fas fa-folder me-2"></i>Dossiers';
            if (itemsTab) itemsTab.innerHTML = '<i class="fas fa-list me-2"></i>Éléments';
            break;
    }
}

function renderInfosTab(auditData) {
    let specificContent = '';
    
    if (auditData.Operation) {
        specificContent = renderOperationDetails(auditData.Operation, auditData);
    }
    
    const workload = auditData.Workload || '';
    const workloadLabel = getWorkloadLabel(workload);
    
    const clientIp = auditData.ClientIP || auditData.ClientIPAddress || auditData.ActorIPAddress || auditData.SenderIp || '-';
    
    let workloadSpecificFields = '';
    
    if (workload === 'Exchange') {
        workloadSpecificFields = `
            ${auditData.MailboxOwnerUPN ? `
            <div class="json-item">
                <span class="json-key">Propriétaire boîte mail:</span>
                <span class="json-value">${auditData.MailboxOwnerUPN}</span>
            </div>` : ''}
            ${auditData.LogonType !== undefined ? `
            <div class="json-item">
                <span class="json-key">Type de connexion:</span>
                <span class="json-value"><span class="badge bg-info">${getLogonTypeLabel(auditData.LogonType)}</span></span>
            </div>` : ''}
            ${auditData.ExternalAccess !== undefined ? `
            <div class="json-item">
                <span class="json-key">Accès externe:</span>
                <span class="json-value">${auditData.ExternalAccess ? '<span class="badge bg-warning text-dark">Oui</span>' : 'Non'}</span>
            </div>` : ''}
            ${auditData.ClientInfoString ? `
            <div class="json-item">
                <span class="json-key">Info Client:</span>
                <span class="json-value">${formatClientInfo(auditData.ClientInfoString)}</span>
            </div>` : ''}
        `;
    } else if (workload === 'SharePoint' || workload === 'OneDrive') {
        workloadSpecificFields = `
            ${auditData.SiteUrl ? `
            <div class="json-item">
                <span class="json-key">Site:</span>
                <span class="json-value"><a href="${auditData.SiteUrl}" target="_blank"><small>${auditData.SiteUrl}</small></a></span>
            </div>` : ''}
            ${auditData.SourceRelativeUrl ? `
            <div class="json-item">
                <span class="json-key">Chemin:</span>
                <span class="json-value"><code>${auditData.SourceRelativeUrl}</code></span>
            </div>` : ''}
            ${auditData.SourceFileName ? `
            <div class="json-item">
                <span class="json-key">Fichier/Dossier:</span>
                <span class="json-value"><strong>${auditData.SourceFileName}</strong></span>
            </div>` : ''}
            ${auditData.UserAgent ? `
            <div class="json-item">
                <span class="json-key">User Agent:</span>
                <span class="json-value"><small class="text-muted">${auditData.UserAgent}</small></span>
            </div>` : ''}
        `;
    } else if (workload === 'AzureActiveDirectory') {
        workloadSpecificFields = `
            ${auditData.ObjectId ? `
            <div class="json-item">
                <span class="json-key">Application/Objet:</span>
                <span class="json-value"><code>${auditData.ObjectId}</code></span>
            </div>` : ''}
            ${auditData.LogonError ? `
            <div class="json-item">
                <span class="json-key">Erreur:</span>
                <span class="json-value"><span class="badge bg-danger">${auditData.LogonError}</span></span>
            </div>` : ''}
        `;
    } else if (workload === 'MicrosoftTeams') {
        workloadSpecificFields = `
            ${auditData.TeamName ? `
            <div class="json-item">
                <span class="json-key">Équipe:</span>
                <span class="json-value"><strong>${auditData.TeamName}</strong></span>
            </div>` : ''}
            ${auditData.ChannelName ? `
            <div class="json-item">
                <span class="json-key">Canal:</span>
                <span class="json-value"><span class="badge bg-secondary"># ${auditData.ChannelName}</span></span>
            </div>` : ''}
        `;
    }
    
    const infosHtml = `
        <div class="info-section">
            <h6 class="info-section-title">Informations Principales</h6>
            <div class="info-section-content">
                <div class="json-item">
                    <span class="json-key">Date:</span>
                    <span class="json-value">${formatDate(auditData.CreationTime)}</span>
                </div>
                <div class="json-item">
                    <span class="json-key">Workload:</span>
                    <span class="json-value"><strong>${workloadLabel}</strong></span>
                </div>
                <div class="json-item">
                    <span class="json-key">Opération:</span>
                    <span class="json-value"><strong>${auditData.Operation || '-'}</strong></span>
                </div>
                <div class="json-item">
                    <span class="json-key">Utilisateur:</span>
                    <span class="json-value">${auditData.UserId || '-'}</span>
                </div>
                <div class="json-item">
                    <span class="json-key">Statut:</span>
                    <span class="json-value">${auditData.ResultStatus || '-'}</span>
                </div>
                <div class="json-item">
                    <span class="json-key">IP Client:</span>
                    <span class="json-value"><code>${clientIp}</code></span>
                </div>
                ${auditData._geo_country ? `
                <div class="json-item">
                    <span class="json-key">Géolocalisation:</span>
                    <span class="json-value"><span class="badge bg-info text-white">
                        ${auditData._geo_country}${auditData._geo_country_code ? ' (' + auditData._geo_country_code + ')' : ''}
                    </span></span>
                </div>` : ''}
                ${workloadSpecificFields}
            </div>
        </div>
        ${specificContent}
    `;
    
    document.getElementById('infos-container').innerHTML = infosHtml;
}

// Dispatch par Workload puis par Operation
function renderOperationDetails(operation, auditData) {
    const workload = auditData.Workload || '';
    
    if (workload === 'Exchange') {
        return renderExchangeOperationDetails(operation, auditData);
    }
    
    if (workload === 'SharePoint' || workload === 'OneDrive') {
        return renderSharePointOperationDetails(operation, auditData);
    }
    
    if (workload === 'AzureActiveDirectory') {
        return renderEntraOperationDetails(operation, auditData);
    }
    
    if (workload === 'MicrosoftTeams') {
        return renderTeamsOperationDetails(operation, auditData);
    }
    
    if (workload === 'SecurityComplianceCenter' || workload === 'ThreatIntelligence') {
        return renderSecurityOperationDetails(operation, auditData);
    }
    
    if (workload === 'PowerBI') {
        return renderPowerBIOperationDetails(operation, auditData);
    }
    
    // Fallback: detect by operation name
    if (operation.includes('InboxRule') || operation === 'MailItemsAccessed' || 
        operation === 'MoveToDeletedItems' || operation === 'TIMailData' ||
        operation === 'Send' || operation === 'HardDelete' || operation === 'SoftDelete') {
        return renderExchangeOperationDetails(operation, auditData);
    }
    
    if (operation.startsWith('File') || operation.startsWith('Folder') || 
        operation === 'PageViewed' || operation === 'SearchQueryPerformed' ||
        operation.startsWith('SharingSet') || operation.startsWith('AnonymousLink') ||
        operation.startsWith('CompanyLink') || operation === 'SiteCollectionCreated') {
        return renderSharePointOperationDetails(operation, auditData);
    }
    
    if (operation === 'UserLoggedIn' || operation === 'UserLoginFailed' ||
        operation.startsWith('Add ') || operation.startsWith('Update ') ||
        operation.startsWith('Delete ') || operation.startsWith('Set ') ||
        operation.startsWith('Reset ') || operation.startsWith('Change ') ||
        operation.startsWith('Disable ') || operation.startsWith('Enable ')) {
        return renderEntraOperationDetails(operation, auditData);
    }
    
    return renderGenericOperationDetails(operation, auditData);
}

// Onglet Folders
function renderFoldersTab(auditData) {
    const workload = auditData.Workload || '';
    const container = document.getElementById('folders-container');
    
    if (workload === 'Exchange' || (auditData.Folders && auditData.Folders.length > 0)) {
        if (!auditData.Folders || auditData.Folders.length === 0) {
            container.innerHTML = '<div class="alert alert-info">Aucun dossier mail dans ce log</div>';
            return;
        }
        let foldersHtml = '';
        auditData.Folders.forEach((folder, idx) => {
            foldersHtml += `
                <div class="info-section">
                    <h6 class="info-section-title">Dossier: ${folder.Path || 'N/A'}</h6>
                    <div class="info-section-content">
                        ${folder.FolderItems ? folder.FolderItems.map((item, itemIdx) => `
                            <div class="json-item" style="margin-bottom: 15px; border-left: 3px solid #6c757d;">
                                <div><span class="json-key">Sujet:</span> <span class="json-value">${item.Subject || 'N/A'}</span></div>
                                <div><span class="json-key">Taille:</span> <span class="json-value">${item.SizeInBytes ? formatBytes(item.SizeInBytes) : 'N/A'}</span></div>
                                <div><span class="json-key">Date Création:</span> <span class="json-value">${formatDate(item.CreationTime)}</span></div>
                                <div><span class="json-key">InternetMessageId:</span> <span class="json-value" style="font-size: 0.8rem;">${item.InternetMessageId || '-'}</span></div>
                            </div>
                        `).join('') : '<div class="alert alert-sm alert-info m-0">Aucun item</div>'}
                    </div>
                </div>
            `;
        });
        container.innerHTML = foldersHtml;
        return;
    }
    
    if (workload === 'SharePoint' || workload === 'OneDrive') {
        let fileHtml = `
            <div class="info-section">
                <h6 class="info-section-title"><i class="fas fa-folder-open me-2 text-success"></i>Détails Fichier / Dossier</h6>
                <div class="info-section-content">
                    ${auditData.SourceFileName ? `
                    <div class="json-item">
                        <span class="json-key">Nom:</span>
                        <span class="json-value"><strong>${auditData.SourceFileName}</strong></span>
                    </div>` : ''}
                    ${auditData.SourceRelativeUrl ? `
                    <div class="json-item">
                        <span class="json-key">Chemin Source:</span>
                        <span class="json-value"><code>${auditData.SourceRelativeUrl}</code></span>
                    </div>` : ''}
                    ${auditData.DestinationFileName ? `
                    <div class="json-item">
                        <span class="json-key">Nom Destination:</span>
                        <span class="json-value"><strong>${auditData.DestinationFileName}</strong></span>
                    </div>` : ''}
                    ${auditData.DestinationRelativeUrl ? `
                    <div class="json-item">
                        <span class="json-key">Chemin Destination:</span>
                        <span class="json-value"><code>${auditData.DestinationRelativeUrl}</code></span>
                    </div>` : ''}
                    ${auditData.ItemType ? `
                    <div class="json-item">
                        <span class="json-key">Type:</span>
                        <span class="json-value"><span class="badge bg-secondary">${auditData.ItemType}</span></span>
                    </div>` : ''}
                    ${auditData.SiteUrl ? `
                    <div class="json-item">
                        <span class="json-key">Site:</span>
                        <span class="json-value"><a href="${auditData.SiteUrl}" target="_blank">${auditData.SiteUrl}</a></span>
                    </div>` : ''}
                    ${auditData.ObjectId ? `
                    <div class="json-item">
                        <span class="json-key">URL Complète:</span>
                        <span class="json-value"><small><code>${auditData.ObjectId}</code></small></span>
                    </div>` : ''}
                </div>
            </div>
        `;
        container.innerHTML = fileHtml;
        return;
    }
    
    if (workload === 'AzureActiveDirectory') {
        if (!auditData.ModifiedProperties || auditData.ModifiedProperties.length === 0) {
            container.innerHTML = '<div class="alert alert-info">Aucune propriété modifiée dans ce log</div>';
            return;
        }
        container.innerHTML = renderEntraModifiedPropertiesSection(auditData);
        return;
    }
    
    container.innerHTML = '<div class="alert alert-info">Aucun dossier dans ce log</div>';
}

// Onglet Items
function renderItemsTab(auditData) {
    const workload = auditData.Workload || '';
    let itemsHtml = '';
    
    if (workload === 'Exchange' || auditData.AffectedItems || auditData.Item) {
        if (auditData.AffectedItems && auditData.AffectedItems.length > 0) {
            itemsHtml += `
                <div class="info-section">
                    <h6 class="info-section-title"><i class="fas fa-envelope me-2 text-danger"></i>Éléments Affectés (${auditData.AffectedItems.length})</h6>
                    <div class="info-section-content">
                        ${auditData.AffectedItems.map((item, idx) => `
                            <div class="json-item" style="border-left: 3px solid #dc3545;">
                                <div><span class="json-key">Sujet:</span> <span class="json-value">${item.Subject || 'N/A'}</span></div>
                                <div><span class="json-key">Dossier Parent:</span> <span class="json-value">${item.ParentFolder?.Path || 'N/A'}</span></div>
                                <div><span class="json-key">Pièces jointes:</span> <span class="json-value">${item.Attachments || 'Aucune'}</span></div>
                                <div><span class="json-key">InternetMessageId:</span> <span class="json-value" style="font-size: 0.8rem;">${item.InternetMessageId || '-'}</span></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        if (auditData.Item) {
            itemsHtml += `
                <div class="info-section">
                    <h6 class="info-section-title"><i class="fas fa-envelope-open-text me-2 text-primary"></i>Détails Item</h6>
                    <div class="info-section-content">
                        <div><span class="json-key">Sujet:</span> <span class="json-value">${auditData.Item.Subject || 'N/A'}</span></div>
                        <div><span class="json-key">Taille:</span> <span class="json-value">${formatBytes(auditData.Item.SizeInBytes)}</span></div>
                        <div><span class="json-key">Dossier Parent:</span> <span class="json-value">${auditData.Item.ParentFolder?.Path || 'N/A'}</span></div>
                        <div><span class="json-key">Pièces jointes:</span> <span class="json-value">${auditData.Item.Attachments || 'Aucune'}</span></div>
                    </div>
                </div>
            `;
        }
    }
    
    if (workload === 'SharePoint' || workload === 'OneDrive') {
        itemsHtml += `
            <div class="info-section">
                <h6 class="info-section-title"><i class="fas fa-file-alt me-2 text-success"></i>Détails du Fichier</h6>
                <div class="info-section-content">
                    ${auditData.SourceFileName ? `<div class="json-item"><span class="json-key">Nom:</span> <span class="json-value"><strong>${auditData.SourceFileName}</strong></span></div>` : ''}
                    ${auditData.SourceFileExtension ? `<div class="json-item"><span class="json-key">Extension:</span> <span class="json-value"><span class="badge bg-dark">${auditData.SourceFileExtension}</span></span></div>` : ''}
                    ${auditData.FileSizeBytes ? `<div class="json-item"><span class="json-key">Taille:</span> <span class="json-value">${formatBytes(auditData.FileSizeBytes)}</span></div>` : ''}
                    ${auditData.ItemType ? `<div class="json-item"><span class="json-key">Type:</span> <span class="json-value">${auditData.ItemType}</span></div>` : ''}
                    ${auditData.ListItemUniqueId ? `<div class="json-item"><span class="json-key">ID Unique:</span> <span class="json-value"><small class="font-monospace">${auditData.ListItemUniqueId}</small></span></div>` : ''}
                    ${auditData.ObjectId ? `<div class="json-item"><span class="json-key">URL:</span> <span class="json-value"><small><code>${auditData.ObjectId}</code></small></span></div>` : ''}
                </div>
            </div>
        `;
    }
    
    if (workload === 'AzureActiveDirectory' && auditData.Target && auditData.Target.length > 0) {
        itemsHtml += `
            <div class="info-section">
                <h6 class="info-section-title"><i class="fas fa-crosshairs me-2 text-warning"></i>Objets Cibles</h6>
                <div class="info-section-content">
                    ${auditData.Target.map(target => {
                        const typeLabels = {
                            0: 'UPN', 1: 'ID Application', 2: 'Nom', 3: 'ObjectId', 
                            4: 'ID Appareil', 5: 'Rôle', 6: 'Nom Rôle', 8: 'Domaine',
                            10: 'Groupe'
                        };
                        const typeLabel = typeLabels[target.Type] || 'Type ' + target.Type;
                        return `
                        <div class="json-item" style="border-left: 3px solid #ffc107;">
                            <span class="json-key">${typeLabel}:</span>
                            <span class="json-value"><small>${target.ID || '-'}</small></span>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    if (workload === 'MicrosoftTeams') {
        itemsHtml += `
            <div class="info-section">
                <h6 class="info-section-title"><i class="fas fa-comments me-2"></i>Détails Teams</h6>
                <div class="info-section-content">
                    ${auditData.TeamName ? `<div class="json-item"><span class="json-key">Équipe:</span> <span class="json-value"><strong>${auditData.TeamName}</strong></span></div>` : ''}
                    ${auditData.ChannelName ? `<div class="json-item"><span class="json-key">Canal:</span> <span class="json-value"># ${auditData.ChannelName}</span></div>` : ''}
                    ${auditData.TeamGuid ? `<div class="json-item"><span class="json-key">ID Équipe:</span> <span class="json-value"><small class="font-monospace">${auditData.TeamGuid}</small></span></div>` : ''}
                    ${auditData.CommunicationType ? `<div class="json-item"><span class="json-key">Type Communication:</span> <span class="json-value">${auditData.CommunicationType}</span></div>` : ''}
                </div>
            </div>
        `;
    }

    if (!itemsHtml) {
        itemsHtml = '<div class="alert alert-info">Aucun élément pour ce log</div>';
    }

    document.getElementById('items-container').innerHTML = itemsHtml;
}

// JSON Search
function setupJsonSearch(auditData) {
    const searchInput = document.getElementById('json-search');
    const clearBtn = document.getElementById('search-clear');
    
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        if (query.length > 0) {
            highlightSearchResults(query, auditData);
        } else {
            clearSearch();
        }
    });
    
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearch();
    });
}

function highlightSearchResults(query, auditData) {
    const jsonComplete = document.getElementById('json-complete');
    let json = JSON.stringify(auditData, null, 2);
    
    const highlighted = json.replace(
        new RegExp(`(${query})`, 'gi'),
        '<span class="search-match">$1</span>'
    );
    
    jsonComplete.innerHTML = highlighted;
}

function clearSearch() {
    const jsonComplete = document.getElementById('json-complete');
    if (window.currentAuditData) {
        jsonComplete.textContent = JSON.stringify(window.currentAuditData, null, 2);
    }
}
