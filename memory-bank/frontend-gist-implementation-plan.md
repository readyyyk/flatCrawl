# Frontend GitHub Gist Integration Implementation Plan

This document outlines the specific steps and code changes needed to implement direct GitHub Gist integration from the frontend without requiring a backend server.

## Overview

We'll modify the standalone `viewer.html` file to:
1. Add GitHub OAuth authentication
2. Use the GitHub API directly to read and update Gists
3. Store the authentication token securely in the browser

## Required Changes

### 1. Create a GitHub OAuth Application

1. Go to GitHub Developer Settings: https://github.com/settings/developers
2. Create a new OAuth App with:
   - Application name: "FlatCrawl Viewer"
   - Homepage URL: The URL where your viewer.html will be hosted
   - Authorization callback URL: Same as Homepage URL
3. Note the Client ID (the Client Secret will be used in the proxy server)

### 2. Set Up a Minimal OAuth Proxy Server

Since the GitHub OAuth flow requires a client secret which should not be exposed in frontend code, we need a small proxy server to exchange the code for a token. This can be deployed as a serverless function (e.g., Netlify Functions, Vercel Serverless Functions).

```javascript
// oauth-proxy.js
exports.handler = async function(event, context) {
  const { code } = event.queryStringParameters;
  
  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Code is required' })
    };
  }
  
  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    });
    
    const data = await response.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to exchange code for token' })
    };
  }
};
```

### 3. Modify viewer.html

#### 3.1 Add Authentication UI

Add this HTML to the header section:

```html
<div class="auth-container">
  <div id="login-section" style="display: none;">
    <h3>GitHub Authentication Required</h3>
    <p>To save changes to GitHub Gist, you need to authorize with GitHub.</p>
    <button id="githubLoginBtn" class="btn btn-primary">Login with GitHub</button>
  </div>
  <div id="logged-in-section" style="display: none;">
    <p>Logged in as: <span id="username"></span></p>
    <button id="logoutBtn" class="btn btn-outline-secondary">Logout</button>
  </div>
</div>
```

Add these styles:

```css
.auth-container {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

#### 3.2 Add GitHub OAuth and Gist Client Code

Add this JavaScript before the existing script:

```javascript
// GitHub OAuth Client
class GitHubOAuthClient {
  constructor(clientId, proxyUrl) {
    this.clientId = clientId;
    this.proxyUrl = proxyUrl;
    this.tokenKey = 'github_token';
    this.userKey = 'github_user';
    this.gistIdKey = 'github_gist_id';
  }

  // Initiate OAuth flow
  login() {
    const redirectUri = window.location.href.split('?')[0];
    const state = this.generateRandomState();
    localStorage.setItem('oauth_state', state);
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=gist&state=${state}`;
    window.location.href = authUrl;
  }

  // Generate random state for CSRF protection
  generateRandomState() {
    return Math.random().toString(36).substring(2, 15);
  }

  // Handle OAuth callback
  async handleCallback(code, state) {
    const savedState = localStorage.getItem('oauth_state');
    if (state !== savedState) {
      throw new Error('Invalid state parameter');
    }
    
    localStorage.removeItem('oauth_state');
    
    const response = await fetch(`${this.proxyUrl}?code=${code}`);
    const data = await response.json();
    
    if (data.access_token) {
      this.saveToken(data.access_token);
      await this.fetchUserInfo();
      return true;
    }
    return false;
  }

  // Save token to localStorage
  saveToken(token) {
    localStorage.setItem(this.tokenKey, token);
  }

  // Get token from localStorage
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  // Save Gist ID
  saveGistId(gistId) {
    localStorage.setItem(this.gistIdKey, gistId);
  }

  // Get Gist ID
  getGistId() {
    return localStorage.getItem(this.gistIdKey);
  }

  // Check if user is logged in
  isLoggedIn() {
    return !!this.getToken();
  }

  // Fetch user info
  async fetchUserInfo() {
    const token = this.getToken();
    if (!token) return null;
    
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`
      }
    });
    
    if (response.ok) {
      const user = await response.json();
      localStorage.setItem(this.userKey, JSON.stringify(user));
      return user;
    }
    
    return null;
  }

  // Get user info from localStorage
  getUserInfo() {
    const userJson = localStorage.getItem(this.userKey);
    return userJson ? JSON.parse(userJson) : null;
  }

  // Logout
  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    // Don't remove gistId to remember it for next login
  }
}

// GitHub Gist Client
class GitHubGistClient {
  constructor(oauthClient) {
    this.oauthClient = oauthClient;
    this.baseUrl = 'https://api.github.com';
  }

  // Get headers with authorization
  getHeaders() {
    const token = this.oauthClient.getToken();
    return {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
  }

  // Get a Gist
  async getGist(gistId) {
    const response = await fetch(`${this.baseUrl}/gists/${gistId}`, {
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Gist: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Update a Gist
  async updateGist(gistId, filename, content) {
    const files = {};
    files[filename] = { content };
    
    const response = await fetch(`${this.baseUrl}/gists/${gistId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ files })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update Gist: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Create a new Gist
  async createGist(filename, content, description, isPublic = false) {
    const files = {};
    files[filename] = { content };
    
    const response = await fetch(`${this.baseUrl}/gists`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        description,
        public: isPublic,
        files
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create Gist: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // List user's Gists
  async listGists() {
    const response = await fetch(`${this.baseUrl}/gists`, {
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to list Gists: ${response.statusText}`);
    }
    
    return await response.json();
  }
}
```

#### 3.3 Modify the Existing JavaScript

Replace the existing script with:

```javascript
// Initialize OAuth and Gist clients
const GITHUB_CLIENT_ID = 'your-github-client-id';
const OAUTH_PROXY_URL = 'https://your-oauth-proxy-url.com/.netlify/functions/oauth-proxy';
const CSV_FILENAME = 'urls.csv';

const oauthClient = new GitHubOAuthClient(GITHUB_CLIENT_ID, OAUTH_PROXY_URL);
const gistClient = new GitHubGistClient(oauthClient);

// Global variables
let csvData = [];
let hasChanges = false;

// DOM elements
const dataTable = document.getElementById('dataTable');
const saveBtn = document.getElementById('saveBtn');
const syncBtn = document.getElementById('syncBtn');
const statusEl = document.getElementById('status');
const loadingEl = document.getElementById('loading');
const loginSection = document.getElementById('login-section');
const loggedInSection = document.getElementById('logged-in-section');
const usernameSpan = document.getElementById('username');
const githubLoginBtn = document.getElementById('githubLoginBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Format date from Unix timestamp
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
}

// Show status message
function showStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.className = 'status ' + (isError ? 'error' : 'success');
    statusEl.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 5000);
}

// Show/hide loading indicator
function setLoading(isLoading) {
    loadingEl.style.display = isLoading ? 'flex' : 'none';
}

// Parse CSV string to JSON
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

// Convert JSON data back to CSV
function convertToCSV(data) {
    if (data.length === 0) return '';
    
    // Get headers from the first object
    const headers = Object.keys(data[0]);
    
    // Create CSV header row
    let csv = headers.join(',') + '\n';
    
    // Add data rows
    data.forEach(row => {
        const values = headers.map(header => {
            // Convert boolean values to strings
            if (typeof row[header] === 'boolean') {
                return row[header].toString();
            }
            return row[header];
        });
        csv += values.join(',') + '\n';
    });
    
    return csv;
}

// Check login status and update UI
function checkLoginStatus() {
    if (oauthClient.isLoggedIn()) {
        const user = oauthClient.getUserInfo();
        if (user) {
            loginSection.style.display = 'none';
            loggedInSection.style.display = 'block';
            usernameSpan.textContent = user.login;
            saveBtn.disabled = false;
            syncBtn.disabled = false;
        } else {
            loginSection.style.display = 'block';
            loggedInSection.style.display = 'none';
            saveBtn.disabled = true;
            syncBtn.disabled = true;
        }
    } else {
        loginSection.style.display = 'block';
        loggedInSection.style.display = 'none';
        saveBtn.disabled = true;
        syncBtn.disabled = true;
    }
}

// Handle OAuth callback
async function handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
        try {
            setLoading(true);
            const success = await oauthClient.handleCallback(code, state);
            
            if (success) {
                // Remove code from URL
                window.history.replaceState({}, document.title, window.location.pathname);
                checkLoginStatus();
                
                // Check if we have a saved Gist ID
                if (oauthClient.getGistId()) {
                    await fetchData();
                } else {
                    showStatus('Please select or create a Gist to store your data');
                    // Here you could add UI to select or create a Gist
                }
            }
        } catch (error) {
            console.error('Error handling OAuth callback:', error);
            showStatus('Error during authentication: ' + error.message, true);
        } finally {
            setLoading(false);
        }
    }
}

// Fetch data from GitHub Gist
async function fetchData() {
    try {
        setLoading(true);
        
        // Check if logged in
        if (!oauthClient.isLoggedIn()) {
            checkLoginStatus();
            setLoading(false);
            return;
        }
        
        const gistId = oauthClient.getGistId();
        if (!gistId) {
            showStatus('No Gist ID configured. Please set a Gist ID first.', true);
            setLoading(false);
            return;
        }
        
        const gist = await gistClient.getGist(gistId);
        
        // Get CSV content from the Gist
        if (!gist.files[CSV_FILENAME]) {
            showStatus(`File ${CSV_FILENAME} not found in Gist`, true);
            setLoading(false);
            return;
        }
        
        const csvString = gist.files[CSV_FILENAME].content;
        csvData = parseCSV(csvString);
        renderTable();
        showStatus('Data loaded successfully from GitHub Gist');
    } catch (error) {
        console.error('Error fetching data:', error);
        showStatus('Error loading data: ' + error.message, true);
    } finally {
        setLoading(false);
    }
}

// Render the table with data
function renderTable() {
    dataTable.innerHTML = '';
    
    csvData.forEach(row => {
        const tr = document.createElement('tr');
        
        // ID
        const idCell = document.createElement('td');
        idCell.textContent = row.id;
        tr.appendChild(idCell);
        
        // Source
        const sourceCell = document.createElement('td');
        sourceCell.textContent = row.source;
        tr.appendChild(sourceCell);
        
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
        
        // Actions
        const actionsCell = document.createElement('td');
        const openBtn = document.createElement('button');
        openBtn.className = 'btn btn-sm btn-outline-primary';
        openBtn.textContent = 'Open';
        openBtn.addEventListener('click', () => {
            window.open(row.url, '_blank');
        });
        actionsCell.appendChild(openBtn);
        tr.appendChild(actionsCell);
        
        dataTable.appendChild(tr);
    });
}

// Save changes to GitHub Gist
async function saveChanges() {
    if (!hasChanges) {
        showStatus('No changes to save');
        return;
    }
    
    try {
        setLoading(true);
        
        // Check if logged in
        if (!oauthClient.isLoggedIn()) {
            showStatus('Please login with GitHub first', true);
            checkLoginStatus();
            setLoading(false);
            return;
        }
        
        const gistId = oauthClient.getGistId();
        if (!gistId) {
            showStatus('No Gist ID configured. Please set a Gist ID first.', true);
            setLoading(false);
            return;
        }
        
        const csvString = convertToCSV(csvData);
        
        await gistClient.updateGist(gistId, CSV_FILENAME, csvString);
        
        showStatus('Changes saved successfully to GitHub Gist');
        hasChanges = false;
    } catch (error) {
        console.error('Error saving changes:', error);
        showStatus('Error saving changes: ' + error.message, true);
    } finally {
        setLoading(false);
    }
}

// Set Gist ID (this could be expanded to a UI for selecting from user's Gists)
function setGistId(gistId) {
    oauthClient.saveGistId(gistId);
    showStatus(`Gist ID set to: ${gistId}`);
    fetchData();
}

// Event listeners
githubLoginBtn.addEventListener('click', () => oauthClient.login());
logoutBtn.addEventListener('click', () => {
    oauthClient.logout();
    checkLoginStatus();
    csvData = [];
    renderTable();
});
saveBtn.addEventListener('click', saveChanges);
syncBtn.addEventListener('click', saveChanges); // Same as save for direct Gist integration

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    handleOAuthCallback();
    checkLoginStatus();
    
    // If logged in and has Gist ID, fetch data
    if (oauthClient.isLoggedIn() && oauthClient.getGistId()) {
        fetchData();
    }
    
    // For testing/demo purposes, you can set a default Gist ID
    // Uncomment and replace with your Gist ID
    // if (!oauthClient.getGistId()) {
    //     setGistId('your-gist-id-here');
    // }
});
```

### 4. Deploy the Solution

1. Deploy the OAuth proxy server to a serverless platform like Netlify or Vercel
2. Update the `GITHUB_CLIENT_ID` and `OAUTH_PROXY_URL` constants in the viewer.html file
3. Host the viewer.html file on a static hosting service (GitHub Pages, Netlify, Vercel, etc.)

## Additional Enhancements (Optional)

1. **Gist Selection UI**: Add a dropdown or modal to let users select from their Gists or create a new one
2. **Error Handling**: Improve error handling with more specific error messages and retry logic
3. **Token Refresh**: Implement token refresh logic if using expiring tokens
4. **Offline Support**: Add offline capabilities with local storage as a backup
5. **Security Enhancements**: Encrypt the token before storing in localStorage

## Testing

1. Test the OAuth flow by clicking the "Login with GitHub" button
2. Verify that you can fetch data from an existing Gist
3. Make changes to the data and save them back to the Gist
4. Verify that the changes are reflected in the Gist on GitHub
5. Test the logout functionality

## Troubleshooting

1. **CORS Issues**: Ensure your OAuth proxy server has proper CORS headers
2. **Authentication Errors**: Check that your GitHub OAuth app is configured correctly
3. **Gist Access Issues**: Verify that the token has the `gist` scope
4. **Rate Limiting**: Be aware of GitHub API rate limits