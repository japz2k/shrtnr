// Fetch and render user's links from /my-links
const token = localStorage.getItem('token');
const linksList = document.getElementById('links-list');
const errorDiv = document.getElementById('dashboard-error');

function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'}[tag]));
}

async function fetchLinks() {
    linksList.innerHTML = '<div class="spinner"></div>';
    errorDiv.textContent = '';
    try {
        const res = await fetch('/my-links', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        let data = {};
        try { data = await res.json(); } catch {}
        if (!res.ok) {
            let msg = data.detail || res.statusText || 'Failed to fetch links.';
            errorDiv.textContent = msg;
            // If unauthorized, redirect to login after a moment
            if (res.status === 401) {
                setTimeout(() => {
                    localStorage.removeItem('token');
                    window.location.href = '/login.html';
                }, 1200);
            }
            linksList.innerHTML = '';
            return;
        }
        renderLinks(data.links);
    } catch (err) {
        linksList.innerHTML = '';
        errorDiv.textContent = err.message;
    }
}

function renderLinks(links) {
    if (!links.length) {
        linksList.innerHTML = '<div class="empty">No links yet.</div>';
        return;
    }
    linksList.innerHTML = '';
    links.forEach(link => {
        const shortUrl = `${window.location.origin}/${escapeHtml(link.short_code)}`;
        const row = document.createElement('div');
        row.className = 'link-row';
        row.innerHTML = `
            <div class="link-cell url-cell" title="${escapeHtml(link.original_url)}">
                <a href="${escapeHtml(link.original_url)}" target="_blank">${escapeHtml(link.original_url)}</a>
            </div>
            <div class="link-cell short-cell">
                <span>${escapeHtml(link.short_code)}</span>
                <button class="copy-btn" title="Copy" data-url="${shortUrl}">📋</button>
                <button class="open-btn" title="Open" onclick="window.open('${shortUrl}','_blank')">🔗</button>
            </div>
            <div class="link-cell clicks-cell">${link.total_clicks}</div>
        `;
        linksList.appendChild(row);
    });
    // Add copy event listeners
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            navigator.clipboard.writeText(this.dataset.url);
            this.textContent = '✅';
            setTimeout(() => this.textContent = '📋', 1200);
        });
    });
}

// Add logout button
if (!document.getElementById('logout-btn')) {
    const btn = document.createElement('button');
    btn.id = 'logout-btn';
    btn.textContent = 'Logout';
    btn.className = 'back-btn';
    btn.style.marginTop = '18px';
    btn.onclick = () => {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    };
    document.querySelector('.container').appendChild(btn);
}

document.addEventListener('DOMContentLoaded', fetchLinks);
