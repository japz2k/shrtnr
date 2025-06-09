const form = document.getElementById('shorten-form');
const urlInput = document.getElementById('url-input');
const customCodeInput = document.getElementById('custom-code');
const resultDiv = document.getElementById('result');
const errorDiv = document.getElementById('error');
const spinner = document.getElementById('spinner');
const authActions = document.getElementById('auth-actions');

function updateAuthUI() {
    authActions.innerHTML = '';
    const token = localStorage.getItem('token');
    if (token) {
        // Show dashboard and logout
        const dashBtn = document.createElement('button');
        dashBtn.textContent = 'Dashboard';
        dashBtn.className = 'auth-btn';
        dashBtn.onclick = () => window.location.href = '/dashboard.html';
        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Logout';
        logoutBtn.className = 'auth-btn';
        logoutBtn.onclick = () => {
            localStorage.removeItem('token');
            updateAuthUI();
            errorDiv.textContent = '';
            resultDiv.textContent = '';
        };
        authActions.appendChild(dashBtn);
        authActions.appendChild(logoutBtn);
    } else {
        // Show login/register
        const loginBtn = document.createElement('button');
        loginBtn.textContent = 'Login';
        loginBtn.className = 'auth-btn';
        loginBtn.onclick = () => window.location.href = '/login.html';
        const regBtn = document.createElement('button');
        regBtn.textContent = 'Register';
        regBtn.className = 'auth-btn';
        regBtn.onclick = () => window.location.href = '/register.html';
        authActions.appendChild(loginBtn);
        authActions.appendChild(regBtn);
    }
}

updateAuthUI();

function requireAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        errorDiv.textContent = 'Not authenticated';
        setTimeout(() => window.location.href = '/login.html', 1200);
        return null;
    }
    return token;
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    resultDiv.textContent = '';
    errorDiv.textContent = '';
    spinner.style.display = 'block';

    // Find custom code input if present
    const customCodeInput = document.getElementById('custom-code');
    const customCode = customCodeInput ? customCodeInput.value.trim() : '';
    const urlValue = urlInput.value;
    let token = localStorage.getItem('token');

    // Only require JWT if custom code is provided
    if (customCode && !token) {
        errorDiv.textContent = 'Login required for custom codes.';
        spinner.style.display = 'none';
        setTimeout(() => window.location.href = '/login.html', 1200);
        return;
    }

    // Prepare request body
    const body = { url: urlValue };
    if (customCode) body.custom_code = customCode;

    // Prepare headers
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    try {
        const response = await fetch('/shorten', {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || 'Failed to shorten URL');
        }
        resultDiv.innerHTML = `<span>Shortened URL:</span> <a href="${data.short_url}" target="_blank">${data.short_url}</a>`;
    } catch (err) {
        errorDiv.textContent = err.message;
        if (err.message.toLowerCase().includes('unauthorized')) {
            setTimeout(() => window.location.href = '/login.html', 1200);
        }
    } finally {
        spinner.style.display = 'none';
    }
});
