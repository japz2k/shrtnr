const form = document.getElementById('login-form');
const msgDiv = document.getElementById('login-msg');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgDiv.textContent = '';
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    if (!email || !password) {
        msgDiv.textContent = 'Email and password required.';
        return;
    }
    try {
        const res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
        });
        const data = await res.json();
        if (res.ok && data.access_token) {
            localStorage.setItem('token', data.access_token);
            msgDiv.style.color = '#388e3c';
            msgDiv.textContent = 'Login successful! Redirecting...';
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1200);
        } else {
            msgDiv.style.color = '#d32f2f';
            msgDiv.textContent = data.detail || 'Login failed.';
        }
    } catch (err) {
        msgDiv.style.color = '#d32f2f';
        msgDiv.textContent = 'Network error.';
    }
});
