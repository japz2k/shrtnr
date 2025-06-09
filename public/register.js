const form = document.getElementById('register-form');
const msgDiv = document.getElementById('register-msg');

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
        const res = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            msgDiv.style.color = '#388e3c';
            msgDiv.textContent = 'Registration successful! You can now log in.';
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1200);
        } else {
            msgDiv.style.color = '#d32f2f';
            msgDiv.textContent = data.detail || 'Registration failed.';
        }
    } catch (err) {
        msgDiv.style.color = '#d32f2f';
        msgDiv.textContent = 'Network error.';
    }
});
