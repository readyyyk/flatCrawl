/**
 * Client-side JavaScript for the FlatCrawl Data Viewer
 */

// Global variables
let csvData = [];
let hasChanges = false;

// DOM elements
const dataTable = document.getElementById('dataTable');
const saveBtn = document.getElementById('saveBtn');
const syncBtn = document.getElementById('syncBtn');
const statusEl = document.getElementById('status');
const loadingEl = document.getElementById('loading');

/**
 * Format date from Unix timestamp
 * @param {string|number} timestamp Unix timestamp
 * @returns {string} Formatted date string
 */
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
}

/**
 * Show status message
 * @param {string} message Message to show
 * @param {boolean} isError Whether the message is an error
 */
function showStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.className = 'status ' + (isError ? 'error' : 'success');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 5000);
}

/**
 * Show/hide loading indicator
 * @param {boolean} isLoading Whether to show the loading indicator
 */
function setLoading(isLoading) {
    loadingEl.style.display = isLoading ? 'flex' : 'none';
}

function parseCSV(csvString) {
    const lines = csvString.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(header => header.trim());
    
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = line.split(',');
        
        if (values.length === headers.length) {
            const obj = {};
            
            headers.forEach((header, index) => {
                let value = values[index].trim();
                
                // Convert boolean strings to actual booleans
                if (value === 'true' || value === 'false') {
                    value = value === 'true';
                }
                
                obj[header] = value;
            });
            
            result.push(obj);
        }
    }
    
    return result;
}

/**
 * Fetch data from the server
 */
async function fetchData() {
    try {
        setLoading(true);
        const gistUrl = 'https://gist.githubusercontent.com/readyyyk/fd68b80a07dacb4d00508834fe95c724/raw?q='+Date.now();
        const response = await fetch(gistUrl);
        
        if (!response.ok) {
            throw new Error('Failed to fetch data from GitHub Gist');
        }
        
        const csvString = await response.text();
        csvData = parseCSV(csvString);
        renderTable();
        showStatus('Data loaded from GH Gists');
    } catch (error) {
        console.error('Error fetching data:', error);
        showStatus('Error loading data: ' + error.message, true);
    } finally {
        setLoading(false);
    }
}

/**
 * Show a confirmation dialog
 * @param {string} message Message to show
 * @returns {Promise<boolean>} Promise that resolves to true if confirmed, false otherwise
 */
function showConfirmDialog(message) {
    return new Promise((resolve) => {
        // Create dialog container
        const dialogContainer = document.createElement('div');
        dialogContainer.className = 'confirm-dialog';
        
        // Create dialog content
        const dialogContent = document.createElement('div');
        dialogContent.className = 'confirm-dialog-content';
        
        // Add message
        const messageEl = document.createElement('p');
        messageEl.textContent = message;
        dialogContent.appendChild(messageEl);
        
        // Add buttons
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'confirm-dialog-buttons';
        
        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(dialogContainer);
            resolve(false);
        });
        
        // Confirm button
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn btn-danger';
        confirmBtn.textContent = 'Archive';
        confirmBtn.addEventListener('click', () => {
            document.body.removeChild(dialogContainer);
            resolve(true);
        });
        
        // Add buttons to container
        buttonsContainer.appendChild(cancelBtn);
        buttonsContainer.appendChild(confirmBtn);
        dialogContent.appendChild(buttonsContainer);
        
        // Add content to dialog
        dialogContainer.appendChild(dialogContent);
        
        // Add dialog to body
        document.body.appendChild(dialogContainer);
    });
}

/**
 * Archive a record
 * @param {string} id Record ID
 */
window.archiveRecord = async function(id) {
    console.log(`Attempting to archive record with ID: ${id}`);
    const confirmed = await showConfirmDialog('Are you sure you want to archive this record?');
    
    console.log(`User confirmed: ${confirmed}`);
    if (!confirmed) {
        console.log('Archive operation cancelled by user');
        return;
    }
    
    const rowIndex = csvData.findIndex(r => r.id === id);
    console.log(`Found row at index: ${rowIndex}`);
    if (rowIndex !== -1) {
        console.log(`Setting archived=true for record ${id}`);
        csvData[rowIndex].archived = true;
        hasChanges = true;
        renderTable();
        showStatus('Record archived. Click "Save Changes" to save.');
    } else {
        console.error(`Could not find record with ID: ${id}`);
    }
}

/**
 * Render the table with data
 */
function renderTable() {
    dataTable.innerHTML = '';
    
    // Sort data to move archived items to the bottom
    const sortedData = [...csvData].sort((a, b) => {
        if (a.archived && !b.archived) return 1;
        if (!a.archived && b.archived) return -1;
        return 0;
    });
    
    // Count archived records
    const archivedCount = sortedData.filter(row => row.archived).length;
    
    console.log('Sorted data:', sortedData.map(row => `${row.id}: archived=${row.archived}`).join(', '));
    console.log(`Archived records: ${archivedCount}`);
    
    // Add a message if there are archived records
    if (archivedCount > 0) {
        const statusEl = document.getElementById('status');
        statusEl.textContent = `${archivedCount} archived record(s) moved to the bottom of the table`;
        statusEl.className = 'status info';
        statusEl.style.display = 'block';
    }
    
    // Find the index of the first archived record
    const firstArchivedIndex = sortedData.findIndex(row => row.archived);
    
    // Loop through the sorted data and render each row
    sortedData.forEach((row, index) => {
        // If this is the first archived record, add a separator row
        if (archivedCount > 0 && index === firstArchivedIndex) {
            const separatorRow = document.createElement('tr');
            separatorRow.className = 'archived-separator';
            
            const separatorCell = document.createElement('td');
            separatorCell.colSpan = 11; // Span all columns
            separatorCell.textContent = '--- Archived Records ---';
            separatorCell.style.textAlign = 'center';
            separatorCell.style.backgroundColor = '#f8d7da';
            separatorCell.style.color = '#721c24';
            separatorCell.style.fontWeight = 'bold';
            separatorCell.style.padding = '10px';
            
            separatorRow.appendChild(separatorCell);
            dataTable.appendChild(separatorRow);
        }
        
        const tr = document.createElement('tr');
        
        // Apply archived styling if the record is archived
        if (row.archived) {
            tr.className = 'archived-row';
        }
        
        // ID
        const idCell = document.createElement('td');
        if (row.archived) {
            idCell.innerHTML = `${row.id} <span class="badge bg-secondary">Archived</span>`;
        } else {
            idCell.textContent = row.id;
        }
        tr.appendChild(idCell);
        
        // Source
        const sourceCell = document.createElement('td');
        sourceCell.textContent = row.source;
        tr.appendChild(sourceCell);
        
        // Cost
        const costCell = document.createElement('td');
        const costInput = document.createElement('input');
        costInput.type = 'text';
        costInput.className = 'cost-input';
        costInput.value = row.cost || '';
        costInput.dataset.id = row.id;
        costInput.addEventListener('change', () => {
            const rowIndex = csvData.findIndex(r => r.id === row.id);
            if (rowIndex !== -1) {
                csvData[rowIndex].cost = costInput.value;
                hasChanges = true;
            }
        });
        costCell.appendChild(costInput);
        tr.appendChild(costCell);
        
        // URL
        const urlCell = document.createElement('td');
        urlCell.className = 'url-cell';
        const urlLink = document.createElement('a');
        urlLink.href = row.url;
        urlLink.textContent = row.url;
        urlLink.target = '_blank';
        urlCell.appendChild(urlLink);
        tr.appendChild(urlCell);
        
        // Date Added
        const dateCell = document.createElement('td');
        dateCell.textContent = formatDate(row.dateAdded);
        tr.appendChild(dateCell);
        
        // Boolean fields (Seen, OK, Called, Active)
        const booleanFields = ['seen', 'ok', 'called', 'active'];
        
        booleanFields.forEach(field => {
            const cell = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'form-check-input';
            checkbox.checked = row[field];
            checkbox.dataset.id = row.id;
            checkbox.dataset.field = field;
            
            checkbox.addEventListener('change', () => {
                // Update the data
                const rowIndex = csvData.findIndex(r => r.id === row.id);
                if (rowIndex !== -1) {
                    csvData[rowIndex][field] = checkbox.checked;
                    hasChanges = true;
                }
            });
            
            cell.appendChild(checkbox);
            tr.appendChild(cell);
        });
        
        // Archived
        const archivedCell = document.createElement('td');
        const archivedCheckbox = document.createElement('input');
        archivedCheckbox.type = 'checkbox';
        archivedCheckbox.className = 'form-check-input';
        archivedCheckbox.checked = row.archived || false;
        archivedCheckbox.dataset.id = row.id;
        archivedCheckbox.dataset.field = 'archived';
        
        archivedCheckbox.addEventListener('change', () => {
            // Update the data
            const rowIndex = csvData.findIndex(r => r.id === row.id);
            if (rowIndex !== -1) {
                csvData[rowIndex].archived = archivedCheckbox.checked;
                hasChanges = true;
                
                // Update row styling
                if (archivedCheckbox.checked) {
                    tr.className = 'archived-row';
                } else {
                    tr.className = '';
                }
            }
        });
        
        archivedCell.appendChild(archivedCheckbox);
        tr.appendChild(archivedCell);
        
        // Actions
        const actionsCell = document.createElement('td');
        
        // Actions buttons
        let actionsHtml = `
            <button class="btn btn-sm btn-outline-primary" onclick="window.open('${row.url}', '_blank')">Open</button>
        `;
        
        // Archive button (only show if not already archived)
        console.log(`Row ${row.id} archived status:`, row.archived);
        if (!row.archived) {
            console.log(`Adding archive button for row ${row.id}`);
            actionsHtml += `
                <button class="btn btn-sm btn-secondary" style="margin-left: 5px; background-color: #6c757d; color: white;" onclick="archiveRecord('${row.id}')">Archive</button>
            `;
        } else {
            console.log(`Row ${row.id} is archived, not adding archive button`);
        }
        
        actionsCell.innerHTML = actionsHtml;
        
        tr.appendChild(actionsCell);
        
        dataTable.appendChild(tr);
    });
}

/**
 * Save changes to the server
 */
async function saveChanges() {
    if (!hasChanges) {
        showStatus('No changes to save');
        return;
    }
    
    try {
        setLoading(true);
        const response = await fetch('/api/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(csvData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save changes');
        }
        
        const result = await response.json();
        showStatus('Changes saved successfully. Use "Sync to GitHub Gist" to update the Gist.');
        hasChanges = false;
    } catch (error) {
        console.error('Error saving changes:', error);
        showStatus('Error saving changes: ' + error.message, true);
    } finally {
        setLoading(false);
    }
}

/**
 * Sync to GitHub Gist
 */
async function syncToGist() {
    try {
        setLoading(true);
        
        // First save any changes to the local file
        if (hasChanges) {
            await saveChanges();
        }
        
        // Then trigger the sync to GitHub Gist
        const response = await fetch('/api/sync', {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error('Failed to sync to GitHub Gist');
        }
        
        const result = await response.json();
        showStatus('Successfully synced to GitHub Gist');
        
        // Reload data from the server after syncing
        setTimeout(fetchData, 2000);
    } catch (error) {
        console.error('Error syncing to Gist:', error);
        showStatus('Error syncing to Gist: ' + error.message, true);
    } finally {
        setLoading(false);
    }
}

// Event listeners
saveBtn.addEventListener('click', saveChanges);
syncBtn.addEventListener('click', syncToGist);

// Initialize
document.addEventListener('DOMContentLoaded', fetchData);