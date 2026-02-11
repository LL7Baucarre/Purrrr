// =============================================
// purrrr - All Workload-Specific Renderers
// =============================================

// =============================================
// EXCHANGE OPERATIONS RENDERER
// =============================================
function renderExchangeOperationDetails(operation, auditData) {
    if (operation.includes('InboxRule')) {
        return renderRuleDetails(auditData);
    } else if (operation === 'Update') {
        return renderUpdateDetails(auditData);
    } else if (operation === 'MailItemsAccessed') {
        return renderMailAccessDetails(auditData);
    } else if (operation === 'MoveToDeletedItems') {
        return renderMoveDetails(auditData);
    } else if (operation === 'TIMailData') {
        return renderTIMailDataDetails(auditData);
    } else if (operation === 'Send') {
        return renderExchangeSendDetails(auditData);
    } else if (operation === 'HardDelete' || operation === 'SoftDelete') {
        return renderExchangeDeleteDetails(operation, auditData);
    } else if (operation === 'Create') {
        return renderExchangeCreateDetails(auditData);
    } else if (operation === 'Copy' || operation === 'Move') {
        return renderExchangeMoveDetails(operation, auditData);
    } else if (operation === 'MailboxLogin') {
        return renderExchangeMailboxLoginDetails(auditData);
    } else if (operation === 'SearchQueryInitiatedExchange') {
        return renderExchangeSearchDetails(auditData);
    } else if (operation.startsWith('Set-') || operation.startsWith('Remove-') || operation.startsWith('New-') || operation.startsWith('Enable-') || operation.startsWith('Disable-')) {
        return renderExchangeCmdletDetails(operation, auditData);
    } else {
        return renderGenericOperationDetails(operation, auditData);
    }
}

function renderExchangeSendDetails(auditData) {
    const item = auditData.Item || {};
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title"><i class="fas fa-paper-plane me-2 text-primary"></i>Envoi de Message</h6>
            <div class="info-section-content">
                ${item.Subject ? `
                <div class="json-item">
                    <span class="json-key">Sujet:</span>
                    <span class="json-value"><strong>"${item.Subject}"</strong></span>
                </div>` : ''}
                ${item.ParentFolder?.Path ? `
                <div class="json-item">
                    <span class="json-key">Dossier:</span>
                    <span class="json-value"><code>${item.ParentFolder.Path.replace(/\\\\/g, '/')}</code></span>
                </div>` : ''}
                ${item.SizeInBytes ? `
                <div class="json-item">
                    <span class="json-key">Taille:</span>
                    <span class="json-value">${formatBytes(item.SizeInBytes)}</span>
                </div>` : ''}
                ${item.Attachments ? `
                <div class="json-item">
                    <span class="json-key">Pièces jointes:</span>
                    <span class="json-value"><code>${item.Attachments}</code></span>
                </div>` : ''}
                ${auditData.ClientInfoString ? `
                <div class="json-item">
                    <span class="json-key">Client:</span>
                    <span class="json-value"><small>${formatClientInfo(auditData.ClientInfoString)}</small></span>
                </div>` : ''}
            </div>
        </div>
    `;
}

function renderExchangeDeleteDetails(operation, auditData) {
    const affectedItems = auditData.AffectedItems || [];
    const opLabel = operation === 'HardDelete' ? 'Suppression Définitive' : 'Suppression Temporaire';
    const opColor = operation === 'HardDelete' ? 'danger' : 'warning';
    
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title"><i class="fas fa-trash me-2 text-${opColor}"></i>${opLabel}</h6>
            <div class="info-section-content">
                <div class="json-item">
                    <span class="json-key">Éléments Affectés:</span>
                    <span class="json-value"><span class="badge bg-${opColor}">${affectedItems.length}</span></span>
                </div>
                ${auditData.Folder?.Path ? `
                <div class="json-item">
                    <span class="json-key">Dossier Source:</span>
                    <span class="json-value"><code>${auditData.Folder.Path.replace(/\\\\/g, '/')}</code></span>
                </div>` : ''}
                ${affectedItems.length > 0 ? `
                <div class="json-subsection mt-3">
                    <h6 class="text-${opColor}"><i class="fas fa-trash me-2"></i>Éléments Supprimés</h6>
                    ${affectedItems.slice(0, 10).map(item => `
                    <div class="json-item">
                        <span class="json-key">Sujet:</span>
                        <span class="json-value">"${item.Subject || 'Sans sujet'}"</span>
                    </div>`).join('')}
                    ${affectedItems.length > 10 ? `<div class="text-muted mt-2"><em>... et ${affectedItems.length - 10} autres éléments</em></div>` : ''}
                </div>` : ''}
            </div>
        </div>
    `;
}

function renderExchangeCreateDetails(auditData) {
    const item = auditData.Item || {};
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title"><i class="fas fa-plus-circle me-2 text-success"></i>Création d'Élément</h6>
            <div class="info-section-content">
                ${item.Subject ? `
                <div class="json-item">
                    <span class="json-key">Sujet:</span>
                    <span class="json-value"><strong>"${item.Subject}"</strong></span>
                </div>` : ''}
                ${item.ParentFolder?.Path ? `
                <div class="json-item">
                    <span class="json-key">Dossier:</span>
                    <span class="json-value"><code>${item.ParentFolder.Path.replace(/\\\\/g, '/')}</code></span>
                </div>` : ''}
                ${item.SizeInBytes ? `
                <div class="json-item">
                    <span class="json-key">Taille:</span>
                    <span class="json-value">${formatBytes(item.SizeInBytes)}</span>
                </div>` : ''}
            </div>
        </div>
    `;
}

function renderExchangeMoveDetails(operation, auditData) {
    const title = operation === 'Copy' ? 'Copie d\'Élément' : 'Déplacement d\'Élément';
    const icon = operation === 'Copy' ? 'fa-copy' : 'fa-arrows-alt';
    const item = auditData.Item || {};
    
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title"><i class="fas ${icon} me-2 text-info"></i>${title}</h6>
            <div class="info-section-content">
                ${item.Subject ? `
                <div class="json-item">
                    <span class="json-key">Sujet:</span>
                    <span class="json-value"><strong>"${item.Subject}"</strong></span>
                </div>` : ''}
                ${auditData.Folder?.Path ? `
                <div class="json-item">
                    <span class="json-key">Dossier Source:</span>
                    <span class="json-value"><code>${auditData.Folder.Path.replace(/\\\\/g, '/')}</code></span>
                </div>` : ''}
                ${auditData.DestFolder?.Path ? `
                <div class="json-item">
                    <span class="json-key">Dossier Destination:</span>
                    <span class="json-value"><code>${auditData.DestFolder.Path.replace(/\\\\/g, '/')}</code></span>
                </div>` : ''}
            </div>
        </div>
    `;
}

function renderExchangeMailboxLoginDetails(auditData) {
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title"><i class="fas fa-sign-in-alt me-2 text-success"></i>Connexion Boîte Mail</h6>
            <div class="info-section-content">
                <div class="json-item">
                    <span class="json-key">Boîte mail:</span>
                    <span class="json-value"><strong>${auditData.MailboxOwnerUPN || auditData.UserId || '-'}</strong></span>
                </div>
                ${auditData.LogonType !== undefined ? `
                <div class="json-item">
                    <span class="json-key">Type de connexion:</span>
                    <span class="json-value"><span class="badge bg-info">${getLogonTypeLabel(auditData.LogonType)}</span></span>
                </div>` : ''}
                ${auditData.ClientInfoString ? `
                <div class="json-item">
                    <span class="json-key">Client:</span>
                    <span class="json-value"><small>${formatClientInfo(auditData.ClientInfoString)}</small></span>
                </div>` : ''}
                ${auditData.ExternalAccess !== undefined ? `
                <div class="json-item">
                    <span class="json-key">Accès externe:</span>
                    <span class="json-value">${auditData.ExternalAccess ? '<span class="badge bg-warning">Oui</span>' : '<span class="badge bg-secondary">Non</span>'}</span>
                </div>` : ''}
            </div>
        </div>
    `;
}

function renderExchangeSearchDetails(auditData) {
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title"><i class="fas fa-search me-2 text-info"></i>Recherche Exchange</h6>
            <div class="info-section-content">
                ${auditData.QueryText ? `
                <div class="json-item">
                    <span class="json-key">Requête:</span>
                    <span class="json-value"><code>${auditData.QueryText}</code></span>
                </div>` : ''}
                ${auditData.QueryCorrelationId ? `
                <div class="json-item">
                    <span class="json-key">ID Corrélation:</span>
                    <span class="json-value"><small class="font-monospace">${auditData.QueryCorrelationId}</small></span>
                </div>` : ''}
            </div>
        </div>
    `;
}

function renderExchangeCmdletDetails(operation, auditData) {
    const parameters = auditData.Parameters || [];
    
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title"><i class="fas fa-terminal me-2 text-dark"></i>Commande Exchange: ${operation}</h6>
            <div class="info-section-content">
                ${auditData.ObjectId ? `
                <div class="json-item">
                    <span class="json-key">Objet cible:</span>
                    <span class="json-value"><code>${auditData.ObjectId}</code></span>
                </div>` : ''}
                ${parameters.length > 0 ? `
                <div class="json-subsection mt-3">
                    <h6 class="text-info"><i class="fas fa-cogs me-2"></i>Paramètres (${parameters.length})</h6>
                    ${parameters.slice(0, 20).map(param => `
                    <div class="json-item">
                        <span class="json-key">${param.Name || '-'}:</span>
                        <span class="json-value"><code>${param.Value || '-'}</code></span>
                    </div>`).join('')}
                    ${parameters.length > 20 ? `<div class="text-muted mt-2"><em>... et ${parameters.length - 20} autres paramètres</em></div>` : ''}
                </div>` : ''}
            </div>
        </div>
    `;
}

function formatClientInfo(clientInfoString) {
    if (!clientInfoString) return '-';
    if (clientInfoString.includes('Client=OWA')) return '<span class="badge bg-primary">Outlook Web Access</span>';
    if (clientInfoString.includes('Client=REST')) return '<span class="badge bg-info">REST API</span>';
    if (clientInfoString.includes('Client=Outlook')) return '<span class="badge bg-success">Outlook Desktop</span>';
    if (clientInfoString.includes('Client=Exchange')) return '<span class="badge bg-secondary">Exchange</span>';
    if (clientInfoString.includes('Client=ActiveSync')) return '<span class="badge bg-warning text-dark">ActiveSync</span>';
    if (clientInfoString.includes('Client=POP3')) return '<span class="badge bg-danger">POP3</span>';
    if (clientInfoString.includes('Client=IMAP')) return '<span class="badge bg-danger">IMAP</span>';
    return `<code>${clientInfoString.substring(0, 60)}${clientInfoString.length > 60 ? '...' : ''}</code>`;
}

// =============================================
// SHAREPOINT / ONEDRIVE OPERATIONS RENDERER
// =============================================
function renderSharePointOperationDetails(operation, auditData) {
    if (operation.startsWith('File') || operation === 'FilePreviewed') {
        return renderSharePointFileDetails(operation, auditData);
    }
    if (operation.startsWith('Folder')) {
        return renderSharePointFolderDetails(operation, auditData);
    }
    if (operation.includes('Sharing') || operation.includes('AnonymousLink') || 
        operation.includes('CompanyLink') || operation.includes('SecureLink') ||
        operation.startsWith('AddedToSecure') || operation === 'SharingSet' ||
        operation === 'SharingRevoked' || operation === 'SharingInvitationCreated') {
        return renderSharePointSharingDetails(operation, auditData);
    }
    if (operation === 'SearchQueryPerformed') {
        return renderSharePointSearchDetails(auditData);
    }
    if (operation === 'PageViewed' || operation === 'PageViewedExtended') {
        return renderSharePointPageDetails(auditData);
    }
    if (operation.includes('Site') || operation.includes('site')) {
        return renderSharePointSiteDetails(operation, auditData);
    }
    if (operation.includes('Sync') || operation === 'FileSyncDownloadedFull' || 
        operation === 'FileSyncUploadedFull') {
        return renderSharePointSyncDetails(operation, auditData);
    }
    
    return renderGenericOperationDetails(operation, auditData);
}

function renderSharePointFileDetails(operation, auditData) {
    const opIcons = {
        'FileAccessed': { icon: 'fa-eye', color: 'info', label: 'Fichier Consulté' },
        'FileAccessedExtended': { icon: 'fa-eye', color: 'info', label: 'Fichier Consulté (étendu)' },
        'FileDownloaded': { icon: 'fa-download', color: 'success', label: 'Fichier Téléchargé' },
        'FileUploaded': { icon: 'fa-upload', color: 'primary', label: 'Fichier Uploadé' },
        'FileModified': { icon: 'fa-edit', color: 'warning', label: 'Fichier Modifié' },
        'FileModifiedExtended': { icon: 'fa-edit', color: 'warning', label: 'Fichier Modifié (étendu)' },
        'FileDeleted': { icon: 'fa-trash', color: 'danger', label: 'Fichier Supprimé' },
        'FileDeletedFirstStageRecycleBin': { icon: 'fa-trash', color: 'danger', label: 'Fichier en Corbeille' },
        'FileRecycled': { icon: 'fa-recycle', color: 'warning', label: 'Fichier Recyclé' },
        'FileMoved': { icon: 'fa-arrows-alt', color: 'info', label: 'Fichier Déplacé' },
        'FileRenamed': { icon: 'fa-i-cursor', color: 'info', label: 'Fichier Renommé' },
        'FileCopied': { icon: 'fa-copy', color: 'info', label: 'Fichier Copié' },
        'FileCheckedOut': { icon: 'fa-lock', color: 'warning', label: 'Fichier Verrouillé' },
        'FileCheckedIn': { icon: 'fa-lock-open', color: 'success', label: 'Fichier Déverrouillé' },
        'FilePreviewed': { icon: 'fa-search', color: 'secondary', label: 'Aperçu Fichier' },
        'FileVersionsAllDeleted': { icon: 'fa-history', color: 'danger', label: 'Versions Supprimées' },
        'FileSensitivityLabelApplied': { icon: 'fa-tag', color: 'info', label: 'Label de Sensibilité Appliqué' },
        'FileMalwareDetected': { icon: 'fa-bug', color: 'danger', label: 'Malware Détecté' },
    };
    
    const opInfo = opIcons[operation] || { icon: 'fa-file', color: 'secondary', label: operation };
    
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title"><i class="fas ${opInfo.icon} me-2 text-${opInfo.color}"></i>${opInfo.label}</h6>
            <div class="info-section-content">
                ${auditData.SourceFileName ? `
                <div class="json-item">
                    <span class="json-key">Nom du fichier:</span>
                    <span class="json-value"><strong>${auditData.SourceFileName}</strong></span>
                </div>` : ''}
                ${auditData.SourceRelativeUrl ? `
                <div class="json-item">
                    <span class="json-key">Chemin source:</span>
                    <span class="json-value"><code>${auditData.SourceRelativeUrl}</code></span>
                </div>` : ''}
                ${auditData.DestinationFileName ? `
                <div class="json-item">
                    <span class="json-key">Nom destination:</span>
                    <span class="json-value"><strong>${auditData.DestinationFileName}</strong></span>
                </div>` : ''}
                ${auditData.DestinationRelativeUrl ? `
                <div class="json-item">
                    <span class="json-key">Chemin destination:</span>
                    <span class="json-value"><code>${auditData.DestinationRelativeUrl}</code></span>
                </div>` : ''}
                ${auditData.SiteUrl ? `
                <div class="json-item">
                    <span class="json-key">Site:</span>
                    <span class="json-value"><a href="${auditData.SiteUrl}" target="_blank">${auditData.SiteUrl}</a></span>
                </div>` : ''}
                ${auditData.ObjectId ? `
                <div class="json-item">
                    <span class="json-key">URL complète:</span>
                    <span class="json-value"><small><code>${auditData.ObjectId}</code></small></span>
                </div>` : ''}
                ${auditData.ItemType ? `
                <div class="json-item">
                    <span class="json-key">Type:</span>
                    <span class="json-value"><span class="badge bg-secondary">${auditData.ItemType}</span></span>
                </div>` : ''}
                ${auditData.UserAgent ? `
                <div class="json-item">
                    <span class="json-key">User Agent:</span>
                    <span class="json-value"><small class="text-muted">${auditData.UserAgent}</small></span>
                </div>` : ''}
                ${auditData.FileSizeBytes ? `
                <div class="json-item">
                    <span class="json-key">Taille:</span>
                    <span class="json-value">${formatBytes(auditData.FileSizeBytes)}</span>
                </div>` : ''}
                ${auditData.SourceFileExtension ? `
                <div class="json-item">
                    <span class="json-key">Extension:</span>
                    <span class="json-value"><span class="badge bg-dark">${auditData.SourceFileExtension}</span></span>
                </div>` : ''}
                ${auditData.SensitivityLabelId ? `
                <div class="json-item">
                    <span class="json-key">Label Sensibilité:</span>
                    <span class="json-value"><span class="badge bg-info">${auditData.SensitivityLabelId}</span></span>
                </div>` : ''}
            </div>
        </div>
    `;
}

function renderSharePointFolderDetails(operation, auditData) {
    const opLabels = {
        'FolderCreated': { icon: 'fa-folder-plus', color: 'success', label: 'Dossier Créé' },
        'FolderDeleted': { icon: 'fa-folder-minus', color: 'danger', label: 'Dossier Supprimé' },
        'FolderModified': { icon: 'fa-folder', color: 'warning', label: 'Dossier Modifié' },
        'FolderMoved': { icon: 'fa-folder', color: 'info', label: 'Dossier Déplacé' },
        'FolderRenamed': { icon: 'fa-folder', color: 'info', label: 'Dossier Renommé' },
        'FolderCopied': { icon: 'fa-folder', color: 'info', label: 'Dossier Copié' },
    };
    
    const opInfo = opLabels[operation] || { icon: 'fa-folder', color: 'secondary', label: operation };
    
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title"><i class="fas ${opInfo.icon} me-2 text-${opInfo.color}"></i>${opInfo.label}</h6>
            <div class="info-section-content">
                ${auditData.SourceFileName ? `
                <div class="json-item">
                    <span class="json-key">Nom:</span>
                    <span class="json-value"><strong>${auditData.SourceFileName}</strong></span>
                </div>` : ''}
                ${auditData.SourceRelativeUrl ? `
                <div class="json-item">
                    <span class="json-key">Chemin:</span>
                    <span class="json-value"><code>${auditData.SourceRelativeUrl}</code></span>
                </div>` : ''}
                ${auditData.DestinationRelativeUrl ? `
                <div class="json-item">
                    <span class="json-key">Destination:</span>
                    <span class="json-value"><code>${auditData.DestinationRelativeUrl}</code></span>
                </div>` : ''}
                ${auditData.SiteUrl ? `
                <div class="json-item">
                    <span class="json-key">Site:</span>
                    <span class="json-value"><a href="${auditData.SiteUrl}" target="_blank">${auditData.SiteUrl}</a></span>
                </div>` : ''}
            </div>
        </div>
    `;
}

function renderSharePointSharingDetails(operation, auditData) {
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title"><i class="fas fa-share-alt me-2 text-primary"></i>Partage: ${operation}</h6>
            <div class="info-section-content">
                ${auditData.SourceFileName ? `
                <div class="json-item">
                    <span class="json-key">Élément partagé:</span>
                    <span class="json-value"><strong>${auditData.SourceFileName}</strong></span>
                </div>` : ''}
                ${auditData.ObjectId ? `
                <div class="json-item">
                    <span class="json-key">URL:</span>
                    <span class="json-value"><small><code>${auditData.ObjectId}</code></small></span>
                </div>` : ''}
                ${auditData.TargetUserOrGroupName ? `
                <div class="json-item">
                    <span class="json-key">Partagé avec:</span>
                    <span class="json-value"><span class="badge bg-info">${auditData.TargetUserOrGroupName}</span></span>
                </div>` : ''}
                ${auditData.TargetUserOrGroupType ? `
                <div class="json-item">
                    <span class="json-key">Type de cible:</span>
                    <span class="json-value">${auditData.TargetUserOrGroupType}</span>
                </div>` : ''}
                ${auditData.EventData ? `
                <div class="json-item">
                    <span class="json-key">Données:</span>
                    <span class="json-value"><small>${typeof auditData.EventData === 'string' ? auditData.EventData : JSON.stringify(auditData.EventData)}</small></span>
                </div>` : ''}
                ${auditData.UniqueSharingId ? `
                <div class="json-item">
                    <span class="json-key">ID Partage:</span>
                    <span class="json-value"><small class="font-monospace">${auditData.UniqueSharingId}</small></span>
                </div>` : ''}
            </div>
        </div>
    `;
}

function renderSharePointSearchDetails(auditData) {
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title"><i class="fas fa-search me-2 text-info"></i>Recherche SharePoint</h6>
            <div class="info-section-content">
                ${auditData.QueryText ? `
                <div class="json-item">
                    <span class="json-key">Requête:</span>
                    <span class="json-value"><code>${auditData.QueryText}</code></span>
                </div>` : ''}
                ${auditData.SearchScope !== undefined ? `
                <div class="json-item">
                    <span class="json-key">Portée:</span>
                    <span class="json-value">${auditData.SearchScope}</span>
                </div>` : ''}
                ${auditData.ResultCount !== undefined ? `
                <div class="json-item">
                    <span class="json-key">Résultats:</span>
                    <span class="json-value"><span class="badge bg-primary">${auditData.ResultCount}</span></span>
                </div>` : ''}
            </div>
        </div>
    `;
}

function renderSharePointPageDetails(auditData) {
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title"><i class="fas fa-file-alt me-2 text-info"></i>Page Consultée</h6>
            <div class="info-section-content">
                ${auditData.SourceFileName ? `
                <div class="json-item">
                    <span class="json-key">Page:</span>
                    <span class="json-value"><strong>${auditData.SourceFileName}</strong></span>
                </div>` : ''}
                ${auditData.ObjectId ? `
                <div class="json-item">
                    <span class="json-key">URL:</span>
                    <span class="json-value"><small><code>${auditData.ObjectId}</code></small></span>
                </div>` : ''}
                ${auditData.SiteUrl ? `
                <div class="json-item">
                    <span class="json-key">Site:</span>
                    <span class="json-value"><a href="${auditData.SiteUrl}" target="_blank">${auditData.SiteUrl}</a></span>
                </div>` : ''}
            </div>
        </div>
    `;
}

function renderSharePointSiteDetails(operation, auditData) {
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title"><i class="fas fa-globe me-2 text-primary"></i>Opération Site: ${operation}</h6>
            <div class="info-section-content">
                ${auditData.SiteUrl ? `
                <div class="json-item">
                    <span class="json-key">Site:</span>
                    <span class="json-value"><a href="${auditData.SiteUrl}" target="_blank">${auditData.SiteUrl}</a></span>
                </div>` : ''}
                ${auditData.ObjectId ? `
                <div class="json-item">
                    <span class="json-key">Objet:</span>
                    <span class="json-value"><code>${auditData.ObjectId}</code></span>
                </div>` : ''}
                ${auditData.TargetUserOrGroupName ? `
                <div class="json-item">
                    <span class="json-key">Cible:</span>
                    <span class="json-value">${auditData.TargetUserOrGroupName}</span>
                </div>` : ''}
            </div>
        </div>
    `;
}

function renderSharePointSyncDetails(operation, auditData) {
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title"><i class="fas fa-sync me-2 text-info"></i>Synchronisation: ${operation}</h6>
            <div class="info-section-content">
                ${auditData.SourceFileName ? `
                <div class="json-item">
                    <span class="json-key">Fichier:</span>
                    <span class="json-value"><strong>${auditData.SourceFileName}</strong></span>
                </div>` : ''}
                ${auditData.SourceRelativeUrl ? `
                <div class="json-item">
                    <span class="json-key">Chemin:</span>
                    <span class="json-value"><code>${auditData.SourceRelativeUrl}</code></span>
                </div>` : ''}
                ${auditData.UserAgent ? `
                <div class="json-item">
                    <span class="json-key">User Agent:</span>
                    <span class="json-value"><small class="text-muted">${auditData.UserAgent}</small></span>
                </div>` : ''}
            </div>
        </div>
    `;
}

// =============================================
// ENTRA ID (AZURE AD) OPERATIONS RENDERER
// =============================================
function renderEntraOperationDetails(operation, auditData) {
    if (operation === 'UserLoggedIn' || operation === 'UserLoginFailed') {
        return renderEntraLoginDetails(operation, auditData);
    }
    if (operation.includes('user') || operation.includes('User') || 
        operation.includes('member') || operation.includes('Member')) {
        return renderEntraUserManagementDetails(operation, auditData);
    }
    if (operation.includes('password') || operation.includes('Password') ||
        operation.includes('Reset ') || operation.includes('Change ')) {
        return renderEntraPasswordDetails(operation, auditData);
    }
    if (operation.includes('group') || operation.includes('Group')) {
        return renderEntraGroupDetails(operation, auditData);
    }
    if (operation.includes('application') || operation.includes('Application') ||
        operation.includes('service principal') || operation.includes('ServicePrincipal') ||
        operation.includes('OAuth') || operation.includes('Consent')) {
        return renderEntraAppDetails(operation, auditData);
    }
    if (operation.includes('role') || operation.includes('Role')) {
        return renderEntraRoleDetails(operation, auditData);
    }
    if (operation.includes('policy') || operation.includes('Policy') ||
        operation.includes('ConditionalAccess')) {
        return renderEntraPolicyDetails(operation, auditData);
    }
    
    return renderEntraGenericDetails(operation, auditData);
}

function renderEntraLoginDetails(operation, auditData) {
    const isFailure = operation === 'UserLoginFailed';
    const icon = isFailure ? 'fa-times-circle' : 'fa-sign-in-alt';
    const color = isFailure ? 'danger' : 'success';
    const label = isFailure ? 'Échec de Connexion' : 'Connexion Utilisateur';
    
    const extendedProps = {};
    if (Array.isArray(auditData.ExtendedProperties)) {
        auditData.ExtendedProperties.forEach(prop => {
            extendedProps[prop.Name] = prop.Value;
        });
    }
    
    const deviceProps = {};
    if (Array.isArray(auditData.DeviceProperties)) {
        auditData.DeviceProperties.forEach(prop => {
            deviceProps[prop.Name] = prop.Value;
        });
    }
    
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title"><i class="fas ${icon} me-2 text-${color}"></i>${label}</h6>
            <div class="info-section-content">
                ${extendedProps.UserAgent ? `
                <div class="json-item">
                    <span class="json-key">User Agent:</span>
                    <span class="json-value"><small>${extendedProps.UserAgent}</small></span>
                </div>` : ''}
                ${extendedProps.RequestType ? `
                <div class="json-item">
                    <span class="json-key">Type de requête:</span>
                    <span class="json-value"><span class="badge bg-secondary">${extendedProps.RequestType}</span></span>
                </div>` : ''}
                ${extendedProps.ResultStatusDetail ? `
                <div class="json-item">
                    <span class="json-key">Détail du statut:</span>
                    <span class="json-value">${extendedProps.ResultStatusDetail}</span>
                </div>` : ''}
                ${auditData.LogonError ? `
                <div class="json-item">
                    <span class="json-key">Erreur:</span>
                    <span class="json-value"><span class="badge bg-danger">${auditData.LogonError}</span></span>
                </div>` : ''}
                ${auditData.ObjectId ? `
                <div class="json-item">
                    <span class="json-key">Application:</span>
                    <span class="json-value"><code>${auditData.ObjectId}</code></span>
                </div>` : ''}
                
                ${Object.keys(deviceProps).length > 0 ? `
                <div class="json-subsection mt-3">
                    <h6 class="text-info"><i class="fas fa-laptop me-2"></i>Appareil</h6>
                    ${deviceProps.OS ? `
                    <div class="json-item">
                        <span class="json-key">OS:</span>
                        <span class="json-value">${deviceProps.OS}</span>
                    </div>` : ''}
                    ${deviceProps.BrowserType ? `
                    <div class="json-item">
                        <span class="json-key">Navigateur:</span>
                        <span class="json-value">${deviceProps.BrowserType}</span>
                    </div>` : ''}
                    ${deviceProps.DisplayName ? `
                    <div class="json-item">
                        <span class="json-key">Nom appareil:</span>
                        <span class="json-value">${deviceProps.DisplayName}</span>
                    </div>` : ''}
                    ${deviceProps.IsCompliant ? `
                    <div class="json-item">
                        <span class="json-key">Conforme:</span>
                        <span class="json-value">${deviceProps.IsCompliant === 'True' ? '<span class="badge bg-success">Oui</span>' : '<span class="badge bg-warning">Non</span>'}</span>
                    </div>` : ''}
                    ${deviceProps.IsManaged ? `
                    <div class="json-item">
                        <span class="json-key">Géré:</span>
                        <span class="json-value">${deviceProps.IsManaged === 'True' ? '<span class="badge bg-success">Oui</span>' : '<span class="badge bg-warning">Non</span>'}</span>
                    </div>` : ''}
                </div>` : ''}
                
                ${auditData.Actor && auditData.Actor.length > 0 ? `
                <div class="json-subsection mt-3">
                    <h6 class="text-muted"><i class="fas fa-user me-2"></i>Acteurs</h6>
                    ${auditData.Actor.map(actor => `
                    <div class="json-item">
                        <span class="json-key">${actor.Type === 0 ? 'UPN' : actor.Type === 3 ? 'ObjectId' : 'Type ' + actor.Type}:</span>
                        <span class="json-value"><small>${actor.ID || '-'}</small></span>
                    </div>`).join('')}
                </div>` : ''}
            </div>
        </div>
    `;
}

function renderEntraUserManagementDetails(operation, auditData) {
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title"><i class="fas fa-user-cog me-2 text-primary"></i>${operation}</h6>
            <div class="info-section-content">
                ${auditData.ObjectId ? `
                <div class="json-item">
                    <span class="json-key">Objet cible:</span>
                    <span class="json-value"><code>${auditData.ObjectId}</code></span>
                </div>` : ''}
                ${renderEntraTargetSection(auditData)}
                ${renderEntraModifiedPropertiesSection(auditData)}
            </div>
        </div>
    `;
}

function renderEntraPasswordDetails(operation, auditData) {
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title"><i class="fas fa-key me-2 text-warning"></i>${operation}</h6>
            <div class="info-section-content">
                ${auditData.ObjectId ? `
                <div class="json-item">
                    <span class="json-key">Utilisateur cible:</span>
                    <span class="json-value"><strong>${auditData.ObjectId}</strong></span>
                </div>` : ''}
                ${renderEntraTargetSection(auditData)}
            </div>
        </div>
    `;
}

function renderEntraGroupDetails(operation, auditData) {
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title"><i class="fas fa-users me-2 text-info"></i>${operation}</h6>
            <div class="info-section-content">
                ${auditData.ObjectId ? `
                <div class="json-item">
                    <span class="json-key">Groupe:</span>
                    <span class="json-value"><code>${auditData.ObjectId}</code></span>
                </div>` : ''}
                ${renderEntraTargetSection(auditData)}
                ${renderEntraModifiedPropertiesSection(auditData)}
            </div>
        </div>
    `;
}

function renderEntraAppDetails(operation, auditData) {
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title"><i class="fas fa-puzzle-piece me-2 text-success"></i>${operation}</h6>
            <div class="info-section-content">
                ${auditData.ObjectId ? `
                <div class="json-item">
                    <span class="json-key">Application:</span>
                    <span class="json-value"><code>${auditData.ObjectId}</code></span>
                </div>` : ''}
                ${renderEntraTargetSection(auditData)}
                ${renderEntraModifiedPropertiesSection(auditData)}
            </div>
        </div>
    `;
}

function renderEntraRoleDetails(operation, auditData) {
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title"><i class="fas fa-user-shield me-2 text-danger"></i>${operation}</h6>
            <div class="info-section-content">
                ${auditData.ObjectId ? `
                <div class="json-item">
                    <span class="json-key">Rôle / Cible:</span>
                    <span class="json-value"><code>${auditData.ObjectId}</code></span>
                </div>` : ''}
                ${renderEntraTargetSection(auditData)}
                ${renderEntraModifiedPropertiesSection(auditData)}
            </div>
        </div>
    `;
}

function renderEntraPolicyDetails(operation, auditData) {
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title"><i class="fas fa-shield-alt me-2 text-dark"></i>${operation}</h6>
            <div class="info-section-content">
                ${auditData.ObjectId ? `
                <div class="json-item">
                    <span class="json-key">Politique:</span>
                    <span class="json-value"><code>${auditData.ObjectId}</code></span>
                </div>` : ''}
                ${renderEntraTargetSection(auditData)}
                ${renderEntraModifiedPropertiesSection(auditData)}
            </div>
        </div>
    `;
}

function renderEntraGenericDetails(operation, auditData) {
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title"><i class="fas fa-id-badge me-2 text-warning"></i>${operation}</h6>
            <div class="info-section-content">
                ${auditData.ObjectId ? `
                <div class="json-item">
                    <span class="json-key">Objet:</span>
                    <span class="json-value"><code>${auditData.ObjectId}</code></span>
                </div>` : ''}
                ${renderEntraTargetSection(auditData)}
                ${renderEntraModifiedPropertiesSection(auditData)}
            </div>
        </div>
    `;
}

function renderEntraTargetSection(auditData) {
    if (!auditData.Target || !Array.isArray(auditData.Target) || auditData.Target.length === 0) {
        return '';
    }
    
    return `
        <div class="json-subsection mt-3">
            <h6 class="text-info"><i class="fas fa-crosshairs me-2"></i>Cibles</h6>
            ${auditData.Target.map(target => `
            <div class="json-item">
                <span class="json-key">${target.Type === 0 ? 'UPN' : target.Type === 2 ? 'Nom' : target.Type === 3 ? 'ObjectId' : target.Type === 5 ? 'Rôle' : target.Type === 6 ? 'Nom Rôle' : target.Type === 10 ? 'Groupe' : 'Type ' + target.Type}:</span>
                <span class="json-value"><small>${target.ID || '-'}</small></span>
            </div>`).join('')}
        </div>
    `;
}

function renderEntraModifiedPropertiesSection(auditData) {
    if (!auditData.ModifiedProperties || !Array.isArray(auditData.ModifiedProperties) || auditData.ModifiedProperties.length === 0) {
        return '';
    }
    
    return `
        <div class="json-subsection mt-3">
            <h6 class="text-warning"><i class="fas fa-edit me-2"></i>Propriétés Modifiées (${auditData.ModifiedProperties.length})</h6>
            ${auditData.ModifiedProperties.slice(0, 15).map(prop => {
                const name = prop.Name || '-';
                const oldVal = prop.OldValue ? (typeof prop.OldValue === 'string' ? prop.OldValue.substring(0, 100) : JSON.stringify(prop.OldValue).substring(0, 100)) : '';
                const newVal = prop.NewValue ? (typeof prop.NewValue === 'string' ? prop.NewValue.substring(0, 100) : JSON.stringify(prop.NewValue).substring(0, 100)) : '';
                return `
                <div class="json-item" style="border-left: 3px solid #ffc107; padding-left: 8px;">
                    <div><span class="json-key">${name}</span></div>
                    ${oldVal ? `<div><small class="text-muted">Ancien: <code>${oldVal}${(prop.OldValue || '').length > 100 ? '...' : ''}</code></small></div>` : ''}
                    ${newVal ? `<div><small class="text-success">Nouveau: <code>${newVal}${(prop.NewValue || '').length > 100 ? '...' : ''}</code></small></div>` : ''}
                </div>`;
            }).join('')}
            ${auditData.ModifiedProperties.length > 15 ? `<div class="text-muted mt-2"><em>... et ${auditData.ModifiedProperties.length - 15} autres propriétés</em></div>` : ''}
        </div>
    `;
}

// =============================================
// MICROSOFT TEAMS OPERATIONS RENDERER
// =============================================
function renderTeamsOperationDetails(operation, auditData) {
    const teamsIcons = {
        'MemberAdded': { icon: 'fa-user-plus', color: 'success', label: 'Membre Ajouté' },
        'MemberRemoved': { icon: 'fa-user-minus', color: 'danger', label: 'Membre Retiré' },
        'TeamCreated': { icon: 'fa-users', color: 'success', label: 'Équipe Créée' },
        'TeamDeleted': { icon: 'fa-users-slash', color: 'danger', label: 'Équipe Supprimée' },
        'ChannelAdded': { icon: 'fa-hashtag', color: 'info', label: 'Canal Ajouté' },
        'ChannelDeleted': { icon: 'fa-hashtag', color: 'danger', label: 'Canal Supprimé' },
        'MessageSent': { icon: 'fa-comment', color: 'primary', label: 'Message Envoyé' },
        'MessageUpdated': { icon: 'fa-edit', color: 'warning', label: 'Message Modifié' },
        'MessageDeleted': { icon: 'fa-comment-slash', color: 'danger', label: 'Message Supprimé' },
        'ChatCreated': { icon: 'fa-comments', color: 'info', label: 'Conversation Créée' },
        'MeetingStarted': { icon: 'fa-video', color: 'success', label: 'Réunion Démarrée' },
        'MeetingEnded': { icon: 'fa-video-slash', color: 'secondary', label: 'Réunion Terminée' },
        'MeetingParticipantJoined': { icon: 'fa-sign-in-alt', color: 'info', label: 'Participant Rejoint' },
        'MeetingParticipantLeft': { icon: 'fa-sign-out-alt', color: 'secondary', label: 'Participant Parti' },
        'TabAdded': { icon: 'fa-plus-square', color: 'info', label: 'Onglet Ajouté' },
        'TabRemoved': { icon: 'fa-minus-square', color: 'warning', label: 'Onglet Retiré' },
        'AppInstalled': { icon: 'fa-puzzle-piece', color: 'success', label: 'Application Installée' },
        'BotAddedToTeam': { icon: 'fa-robot', color: 'info', label: 'Bot Ajouté' },
    };
    
    const opInfo = teamsIcons[operation] || { icon: 'fa-comment-dots', color: 'secondary', label: operation };
    
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title"><i class="fas ${opInfo.icon} me-2 text-${opInfo.color}"></i>${opInfo.label}</h6>
            <div class="info-section-content">
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
                ${auditData.ChatName ? `
                <div class="json-item">
                    <span class="json-key">Conversation:</span>
                    <span class="json-value">${auditData.ChatName}</span>
                </div>` : ''}
                ${auditData.Members && auditData.Members.length > 0 ? `
                <div class="json-subsection mt-3">
                    <h6 class="text-info"><i class="fas fa-users me-2"></i>Membres (${auditData.Members.length})</h6>
                    ${auditData.Members.slice(0, 10).map(member => `
                    <div class="json-item">
                        <span class="json-key">${member.Role || 'Membre'}:</span>
                        <span class="json-value"><small>${member.UPN || member.DisplayName || '-'}</small></span>
                    </div>`).join('')}
                    ${auditData.Members.length > 10 ? `<div class="text-muted"><em>... et ${auditData.Members.length - 10} autres</em></div>` : ''}
                </div>` : ''}
                ${auditData.MessageId ? `
                <div class="json-item">
                    <span class="json-key">ID Message:</span>
                    <span class="json-value"><small class="font-monospace">${auditData.MessageId}</small></span>
                </div>` : ''}
                ${auditData.CommunicationType ? `
                <div class="json-item">
                    <span class="json-key">Type:</span>
                    <span class="json-value"><span class="badge bg-info">${auditData.CommunicationType}</span></span>
                </div>` : ''}
            </div>
        </div>
    `;
}

// =============================================
// SECURITY & COMPLIANCE CENTER RENDERER
// =============================================
function renderSecurityOperationDetails(operation, auditData) {
    if (operation === 'TIMailData') {
        return renderTIMailDataDetails(auditData);
    }
    
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title"><i class="fas fa-shield-alt me-2 text-danger"></i>Sécurité & Conformité: ${operation}</h6>
            <div class="info-section-content">
                ${auditData.ObjectId ? `
                <div class="json-item">
                    <span class="json-key">Objet:</span>
                    <span class="json-value"><code>${auditData.ObjectId}</code></span>
                </div>` : ''}
                ${auditData.AlertType ? `
                <div class="json-item">
                    <span class="json-key">Type d'alerte:</span>
                    <span class="json-value"><span class="badge bg-danger">${auditData.AlertType}</span></span>
                </div>` : ''}
                ${auditData.Severity ? `
                <div class="json-item">
                    <span class="json-key">Sévérité:</span>
                    <span class="json-value"><span class="badge bg-${auditData.Severity === 'High' ? 'danger' : auditData.Severity === 'Medium' ? 'warning' : 'info'}">${auditData.Severity}</span></span>
                </div>` : ''}
                ${auditData.Comments ? `
                <div class="json-item">
                    <span class="json-key">Commentaires:</span>
                    <span class="json-value">${auditData.Comments}</span>
                </div>` : ''}
                ${auditData.Data ? `
                <div class="json-subsection mt-3">
                    <h6 class="text-warning"><i class="fas fa-database me-2"></i>Données</h6>
                    <pre class="bg-light p-2 rounded" style="max-height: 200px; overflow-y: auto; font-size: 0.8rem;">${typeof auditData.Data === 'string' ? auditData.Data : JSON.stringify(auditData.Data, null, 2)}</pre>
                </div>` : ''}
            </div>
        </div>
    `;
}

// =============================================
// POWER BI OPERATIONS RENDERER
// =============================================
function renderPowerBIOperationDetails(operation, auditData) {
    const pbiIcons = {
        'ViewDashboard': { icon: 'fa-tachometer-alt', color: 'info', label: 'Dashboard Consulté' },
        'ViewReport': { icon: 'fa-chart-bar', color: 'info', label: 'Rapport Consulté' },
        'ExportReport': { icon: 'fa-download', color: 'warning', label: 'Rapport Exporté' },
        'PrintReport': { icon: 'fa-print', color: 'secondary', label: 'Rapport Imprimé' },
        'CreateDashboard': { icon: 'fa-plus-circle', color: 'success', label: 'Dashboard Créé' },
        'DeleteDashboard': { icon: 'fa-trash', color: 'danger', label: 'Dashboard Supprimé' },
        'ShareDashboard': { icon: 'fa-share-alt', color: 'primary', label: 'Dashboard Partagé' },
        'GetRefreshHistory': { icon: 'fa-history', color: 'secondary', label: 'Historique Rafraîchissement' },
    };
    
    const opInfo = pbiIcons[operation] || { icon: 'fa-chart-line', color: 'secondary', label: operation };
    
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title"><i class="fas ${opInfo.icon} me-2 text-${opInfo.color}"></i>${opInfo.label}</h6>
            <div class="info-section-content">
                ${auditData.DashboardName ? `
                <div class="json-item">
                    <span class="json-key">Dashboard:</span>
                    <span class="json-value"><strong>${auditData.DashboardName}</strong></span>
                </div>` : ''}
                ${auditData.ReportName ? `
                <div class="json-item">
                    <span class="json-key">Rapport:</span>
                    <span class="json-value"><strong>${auditData.ReportName}</strong></span>
                </div>` : ''}
                ${auditData.DatasetName ? `
                <div class="json-item">
                    <span class="json-key">Dataset:</span>
                    <span class="json-value">${auditData.DatasetName}</span>
                </div>` : ''}
                ${auditData.WorkspaceName ? `
                <div class="json-item">
                    <span class="json-key">Workspace:</span>
                    <span class="json-value"><span class="badge bg-secondary">${auditData.WorkspaceName}</span></span>
                </div>` : ''}
                ${auditData.ObjectId ? `
                <div class="json-item">
                    <span class="json-key">Objet:</span>
                    <span class="json-value"><code>${auditData.ObjectId}</code></span>
                </div>` : ''}
            </div>
        </div>
    `;
}

// =============================================
// LEGACY / GENERIC RENDERERS
// =============================================

function renderRuleDetails(auditData) {
    if (!auditData.Parameters || !Array.isArray(auditData.Parameters)) {
        return '';
    }
    
    const parameters = {};
    auditData.Parameters.forEach(param => {
        if (param.Name && param.Value !== undefined) {
            parameters[param.Name] = param.Value;
        }
    });
    
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title">Détails de la Règle</h6>
            <div class="info-section-content">
                ${parameters.Name ? `
                <div class="json-item">
                    <span class="json-key">Nom de la règle:</span>
                    <span class="json-value"><strong>"${parameters.Name}"</strong></span>
                </div>
                ` : ''}
                
                <div class="json-subsection mt-3">
                    <h6 class="text-primary"><i class="fas fa-filter me-2"></i>Conditions</h6>
                    ${parameters.From ? `
                    <div class="json-item">
                        <span class="json-key">De (From):</span>
                        <span class="json-value"><code>${parameters.From}</code></span>
                    </div>
                    ` : ''}
                    ${parameters.SubjectContainsWords ? `
                    <div class="json-item">
                        <span class="json-key">Sujet contient:</span>
                        <span class="json-value"><code>${parameters.SubjectContainsWords}</code></span>
                    </div>
                    ` : ''}
                    ${parameters.BodyContainsWords ? `
                    <div class="json-item">
                        <span class="json-key">Corps contient:</span>
                        <span class="json-value"><code>${parameters.BodyContainsWords}</code></span>
                    </div>
                    ` : ''}
                    ${parameters.SentTo ? `
                    <div class="json-item">
                        <span class="json-key">Envoyé à:</span>
                        <span class="json-value"><code>${parameters.SentTo}</code></span>
                    </div>
                    ` : ''}
                    ${!parameters.From && !parameters.SubjectContainsWords && !parameters.BodyContainsWords && !parameters.SentTo ? 
                        '<div class="text-muted"><em>Aucune condition définie</em></div>' : ''}
                </div>

                <div class="json-subsection mt-3">
                    <h6 class="text-success"><i class="fas fa-cog me-2"></i>Actions</h6>
                    ${parameters.DeleteMessage === 'True' ? `
                    <div class="json-item">
                        <span class="json-key">Supprimer le message:</span>
                        <span class="json-value text-danger"><strong>Oui</strong></span>
                    </div>
                    ` : ''}
                    ${parameters.MoveToFolder ? `
                    <div class="json-item">
                        <span class="json-key">Déplacer vers:</span>
                        <span class="json-value"><code>${parameters.MoveToFolder}</code></span>
                    </div>
                    ` : ''}
                    ${parameters.MarkAsRead === 'True' ? `
                    <div class="json-item">
                        <span class="json-key">Marquer comme lu:</span>
                        <span class="json-value text-info"><strong>Oui</strong></span>
                    </div>
                    ` : ''}
                    ${parameters.ForwardTo ? `
                    <div class="json-item">
                        <span class="json-key">Transférer à:</span>
                        <span class="json-value"><code>${parameters.ForwardTo}</code></span>
                    </div>
                    ` : ''}
                    ${parameters.RedirectTo ? `
                    <div class="json-item">
                        <span class="json-key">Rediriger vers:</span>
                        <span class="json-value"><code>${parameters.RedirectTo}</code></span>
                    </div>
                    ` : ''}
                    ${parameters.StopProcessingRules === 'True' ? `
                    <div class="json-item">
                        <span class="json-key">Arrêter le traitement des règles:</span>
                        <span class="json-value text-warning"><strong>Oui</strong></span>
                    </div>
                    ` : ''}
                    ${!parameters.DeleteMessage && !parameters.MoveToFolder && !parameters.MarkAsRead && !parameters.ForwardTo && !parameters.RedirectTo && !parameters.StopProcessingRules ? 
                        '<div class="text-muted"><em>Aucune action définie</em></div>' : ''}
                </div>
            </div>
        </div>
    `;
}

function renderUpdateDetails(auditData) {
    const item = auditData.Item || {};
    const modifiedProps = auditData.ModifiedProperties || [];
    
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title">Détails de la Mise à Jour</h6>
            <div class="info-section-content">
                ${item.Subject ? `
                    <div class="json-item">
                        <span class="json-key">Sujet:</span>
                        <span class="json-value"><strong>"${item.Subject}"</strong></span>
                    </div>
                ` : ''}
                
                ${item.ParentFolder?.Path ? `
                    <div class="json-item">
                        <span class="json-key">Dossier:</span>
                        <span class="json-value"><code>${item.ParentFolder.Path.replace(/\\\\/g, '/')}</code></span>
                    </div>
                ` : ''}
                
                ${item.SizeInBytes ? `
                    <div class="json-item">
                        <span class="json-key">Taille:</span>
                        <span class="json-value">${Math.round(item.SizeInBytes / 1024)} KB</span>
                    </div>
                ` : ''}
                
                ${modifiedProps.length > 0 ? `
                <div class="json-subsection mt-3">
                    <h6 class="text-warning"><i class="fas fa-edit me-2"></i>Propriétés Modifiées</h6>
                    ${modifiedProps.map(prop => {
                        const propLabels = {
                            'RecipientCollection': 'Destinataires',
                            'AllAttachmentsHidden': 'Pièces jointes cachées',
                            'ItemClass': 'Type d\'élément',
                            'Subject': 'Sujet',
                            'Body': 'Corps du message'
                        };
                        return `
                            <span class="json-item">
                                <span class="json-value badge bg-warning text-dark">${propLabels[prop] || prop}</span>
                            </span>
                        `;
                    }).join('')}
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

function renderMailAccessDetails(auditData) {
    const folders = auditData.Folders || [];
    const operationProps = auditData.OperationProperties || [];
    const accessType = operationProps.find(p => p.Name === 'MailAccessType')?.Value || 'Unknown';
    
    const accessTypeLabels = {
        'Bind': 'Consultation',
        'Sync': 'Synchronisation',
        'Search': 'Recherche'
    };
    
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title">Détails d'Accès aux Messages</h6>
            <div class="info-section-content">
                <div class="json-item">
                    <span class="json-key">Type d'Accès:</span>
                    <span class="json-value badge bg-info">${accessTypeLabels[accessType] || accessType}</span>
                </div>
                
                ${folders.length > 0 ? `
                <div class="mt-3">
                    <h6 class="text-primary mb-2"><i class="fas fa-folder me-2"></i>Dossiers Consultés (${folders.length})</h6>
                    ${folders.slice(0, 5).map(folder => `
                        <div class="json-item">
                            <span class="json-key">Dossier:</span>
                            <span class="json-value">${folder.FolderItems?.length || 0} élément(s)</span>
                        </div>
                        ${folder.FolderItems?.slice(0, 2).map(item => `
                            <div class="ms-3 mt-1">
                                <small class="text-muted">"${item.Subject || 'Sans sujet'}"</small>
                            </div>
                        `).join('') || ''}
                    `).join('')}
                    ${folders.length > 5 ? `<div class="text-muted mt-2"><em>... et ${folders.length - 5} autres dossiers</em></div>` : ''}
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

function renderMoveDetails(auditData) {
    const affectedItems = auditData.AffectedItems || [];
    const sourceFolder = auditData.Folder?.Path?.replace(/\\\\/g, '/');
    const destFolder = auditData.DestFolder?.Path?.replace(/\\\\/g, '/');
    
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title">Détails de Suppression</h6>
            <div class="info-section-content">
                <div class="json-item">
                    <span class="json-key">Éléments Affectés:</span>
                    <span class="json-value badge bg-danger">${affectedItems.length}</span>
                </div>
                
                ${sourceFolder ? `
                <div class="json-item">
                    <span class="json-key">Dossier Source:</span>
                    <span class="json-value"><code>${sourceFolder}</code></span>
                </div>
                ` : ''}
                
                ${destFolder ? `
                <div class="json-item">
                    <span class="json-key">Dossier Destination:</span>
                    <span class="json-value"><code>${destFolder}</code></span>
                </div>
                ` : ''}
                
                ${affectedItems.length > 0 ? `
                <div class="json-subsection mt-3">
                    <h6 class="text-danger"><i class="fas fa-trash me-2"></i>Éléments Supprimés</h6>
                    ${affectedItems.slice(0, 5).map(item => `
                    <div class="json-item">
                        <span class="json-key">Élément:</span>
                        <span class="json-value">"${item.Subject || 'Sans sujet'}"</span>
                    </div>
                    ${item.InternetMessageId ? `<div class="json-item ms-3"><small class="text-muted">ID: ${item.InternetMessageId}</small></div>` : ''}
                    `).join('')}
                    ${affectedItems.length > 5 ? `<div class="text-muted mt-2"><em>... et ${affectedItems.length - 5} autres éléments</em></div>` : ''}
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

function renderTIMailDataDetails(auditData) {
    const recipientList = auditData.Recipients || [];
    const attachments = auditData.AttachmentData || [];
    const authDetails = auditData.AuthDetails || [];
    const threats = auditData.ThreatsAndDetectionTech || [];
    
    const verdictColors = {
        'Phish': 'danger',
        'Malware': 'danger',
        'Spam': 'warning',
        'Clean': 'success',
        'Unknown': 'secondary'
    };
    const verdictColor = verdictColors[auditData.Verdict] || 'secondary';
    
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title">
                <i class="fas fa-shield-alt me-2"></i> Threat Intelligence - Détails du Mail
            </h6>
            <div class="info-section-content">
                <div class="json-item">
                    <span class="json-key">Sujet:</span>
                    <span class="json-value"><strong>"${auditData.Subject || '-'}"</strong></span>
                </div>
                
                <div class="json-item">
                    <span class="json-key">Verdict:</span>
                    <span class="json-value"><span class="badge bg-${verdictColor}">${auditData.Verdict || 'Unknown'}</span></span>
                </div>
                
                ${auditData.PhishConfidenceLevel ? `
                <div class="json-item">
                    <span class="json-key">Niveau de confiance Phish:</span>
                    <span class="json-value"><strong>${auditData.PhishConfidenceLevel}</strong></span>
                </div>
                ` : ''}
                
                <div class="json-subsection mt-3">
                    <h6 class="text-info"><i class="fas fa-envelope me-2"></i>Informations d'Email</h6>
                    
                    <div class="json-item">
                        <span class="json-key">Expéditeur (P1):</span>
                        <span class="json-value"><code>${auditData.P1Sender || '-'}</code></span>
                    </div>
                    
                    ${auditData.P2Sender && auditData.P2Sender !== auditData.P1Sender ? `
                    <div class="json-item">
                        <span class="json-key">Expéditeur (P2):</span>
                        <span class="json-value"><code>${auditData.P2Sender}</code></span>
                    </div>
                    ` : ''}
                    
                    ${recipientList.length > 0 ? `
                    <div class="json-item">
                        <span class="json-key">Destinataires:</span>
                        <span class="json-value">
                            <ul class="list-unstyled mb-0 ms-3">
                                ${recipientList.map(r => `<li><code>${r}</code></li>`).join('')}
                            </ul>
                        </span>
                    </div>
                    ` : ''}
                    
                    <div class="json-item">
                        <span class="json-key">IP Expéditeur:</span>
                        <span class="json-value"><code>${auditData.SenderIp || '-'}</code></span>
                    </div>
                </div>
                
                ${threats.length > 0 ? `
                <div class="json-subsection mt-3">
                    <h6 class="text-danger"><i class="fas fa-exclamation-triangle me-2"></i>Menaces Détectées</h6>
                    ${threats.map(threat => `
                    <div class="json-item">
                        <span class="json-value badge bg-danger">${threat}</span>
                    </div>
                    `).join('')}
                    
                    ${auditData.DetectionMethod ? `
                    <div class="json-item mt-2">
                        <span class="json-key">Méthode de détection:</span>
                        <span class="json-value">${auditData.DetectionMethod}</span>
                    </div>
                    ` : ''}
                    
                    ${auditData.DetectionType ? `
                    <div class="json-item">
                        <span class="json-key">Type de détection:</span>
                        <span class="json-value">${auditData.DetectionType}</span>
                    </div>
                    ` : ''}
                </div>
                ` : ''}
                
                ${authDetails.length > 0 ? `
                <div class="json-subsection mt-3">
                    <h6 class="text-success"><i class="fas fa-check-circle me-2"></i>Vérifications d'Authentification</h6>
                    ${authDetails.map(auth => {
                        const isPass = auth.Value === 'Pass' || auth.Value === 'pass';
                        return `
                        <div class="json-item">
                            <span class="json-key">${auth.Name}:</span>
                            <span class="json-value">
                                <span class="badge ${isPass ? 'bg-success' : 'bg-warning'} text-white">
                                    ${auth.Value}
                                </span>
                            </span>
                        </div>
                        `;
                    }).join('')}
                </div>
                ` : ''}
                
                ${attachments.length > 0 ? `
                <div class="json-subsection mt-3">
                    <h6 class="text-warning"><i class="fas fa-paperclip me-2"></i>Pièces Jointes (${attachments.length})</h6>
                    <div style="max-height: 300px; overflow-y: auto;">
                        <table class="table table-sm table-borderless mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Nom</th>
                                    <th>Type</th>
                                    <th>Verdict</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${attachments.map(att => {
                                    const verdictText = att.FileVerdict === 0 ? 'Clean' : 'Suspicious';
                                    const verdictClass = att.FileVerdict === 0 ? 'success' : 'warning';
                                    return `
                                    <tr>
                                        <td><small><code>${att.FileName || '-'}</code></small></td>
                                        <td><small>${att.FileType || '-'}</small></td>
                                        <td><small><span class="badge bg-${verdictClass}">${verdictText}</span></small></td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                ` : ''}
                
                <div class="json-subsection mt-3">
                    <h6 class="text-muted"><i class="fas fa-info-circle me-2"></i>Statut de Livraison</h6>
                    
                    ${auditData.DeliveryAction ? `
                    <div class="json-item">
                        <span class="json-key">Action de livraison:</span>
                        <span class="json-value">${auditData.DeliveryAction}</span>
                    </div>
                    ` : ''}
                    
                    ${auditData.OriginalDeliveryLocation ? `
                    <div class="json-item">
                        <span class="json-key">Emplacement de livraison d'origine:</span>
                        <span class="json-value"><code>${auditData.OriginalDeliveryLocation}</code></span>
                    </div>
                    ` : ''}
                    
                    ${auditData.LatestDeliveryLocation ? `
                    <div class="json-item">
                        <span class="json-key">Dernier emplacement de livraison:</span>
                        <span class="json-value"><code>${auditData.LatestDeliveryLocation}</code></span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="json-subsection mt-3">
                    <h6 class="text-muted"><i class="fas fa-clock me-2"></i>Horodatages</h6>
                    
                    ${auditData.CreationTime ? `
                    <div class="json-item">
                        <span class="json-key">Créé le:</span>
                        <span class="json-value"><small>${formatDate(auditData.CreationTime)}</small></span>
                    </div>
                    ` : ''}
                    
                    ${auditData.MessageTime ? `
                    <div class="json-item">
                        <span class="json-key">Temps du message:</span>
                        <span class="json-value"><small>${formatDate(auditData.MessageTime)}</small></span>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function renderGenericOperationDetails(operation, auditData) {
    const item = auditData.Item || {};
    const parameters = auditData.Parameters || [];
    
    const operationLabels = {
        'Send': 'Envoi de Message',
        'Create': 'Création d\'Élément',
        'Copy': 'Copie d\'Élément',
        'Move': 'Déplacement',
        'HardDelete': 'Suppression Définitive',
        'SoftDelete': 'Suppression Temporaire'
    };
    
    const title = operationLabels[operation] || operation;
    
    return `
        <div class="info-section mt-3">
            <h6 class="info-section-title">Détails de l'Opération: ${title}</h6>
            <div class="info-section-content">
                ${item.Subject ? `
                <div class="json-item">
                    <span class="json-key">Élément:</span>
                    <span class="json-value"><strong>"${item.Subject}"</strong></span>
                </div>
                ` : ''}
                
                ${item.ParentFolder?.Path ? `
                <div class="json-item">
                    <span class="json-key">Dossier:</span>
                    <span class="json-value"><code>${item.ParentFolder.Path.replace(/\\\\/g, '/')}</code></span>
                </div>
                ` : ''}
                
                ${parameters.length > 0 && parameters.length <= 10 ? `
                <div class="json-subsection mt-3">
                    <h6 class="text-info"><i class="fas fa-cogs me-2"></i>Paramètres</h6>
                    ${parameters.map(param => `
                    <div class="json-item">
                        <span class="json-key">${param.Name}:</span>
                        <span class="json-value"><code>${param.Value}</code></span>
                    </div>
                    `).join('')}
                </div>
                ` : ''}
            </div>
        </div>
    `;
}
