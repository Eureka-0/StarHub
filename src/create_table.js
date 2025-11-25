let grid;

const tableContainer = document.getElementById('stars-table');
const userLink = document.getElementById('github-user-link');
const refreshBtn = document.getElementById('refresh-btn');

// 初始化加载
loadStarred()
    .then(data => {
        if (userLink && data.username && data.profileUrl) {
            userLink.textContent = data.username;
            userLink.href = data.profileUrl;
        }

        const rows = makeRows(data);
        tableContainer.innerHTML = '';
        renderGrid(rows);
    })
    .catch(err => {
        console.error('Failed to load GitHub user info:', err);
        tableContainer.innerHTML = `<div class="error">${err.message}</div>`;
    });


// 刷新按钮：调用 /api/update-starred，然后重新渲染
refreshBtn.addEventListener('click', async () => {
    const originalText = refreshBtn.textContent;

    // 按钮进入加载状态
    refreshBtn.disabled = true;
    refreshBtn.classList.add('is-loading');
    refreshBtn.textContent = 'Refreshing…';

    try {
        const resp = await fetch('/api/update-starred', { method: 'POST' });
        if (!resp.ok) {
            throw new Error('Update failed');
        }
        const result = await resp.json();
        console.log('Updated:', result);

        // 更新完成后重新拉取并渲染
        const data = await loadStarred();
        const rows = makeRows(data);
        renderGrid(rows);
    } catch (err) {
        console.error(err);
        alert('刷新失败，请查看控制台');
    } finally {
        // 恢复按钮状态
        refreshBtn.disabled = false;
        refreshBtn.classList.remove('is-loading');
        refreshBtn.textContent = originalText;
    }
});

async function loadStarred() {
    tableContainer.innerHTML = '<div class="loading">Loading starred repositories…</div>';

    const res = await fetch('/api/starred');
    if (!res.ok) {
        // 尝试解析后端的 error 字段
        const errorBody = await res.json().catch(() => ({}));
        const message = errorBody.error || `Failed to load starred repos (status ${res.status})`;
        throw new Error(message);
    }

    return res.json();
}

function makeRows(data) {
    return data.cached.items.map(repo => [
        [repo.name, repo.html_url],
        repo.description,
        repo.stargazers_count,
        repo.language,
        repo.created_at,
        repo.updated_at,
    ]);
}

function nameFormatter(cell) {
    const [name, url] = cell;
    return gridjs.html(`<a href="${url}" target="_blank" class="name-cell">${name}</a>`);
}

function starCountFormatter(cell) {
    if (cell >= 1000) {
        return (cell / 1000)
            .toFixed(1)
            .replace(/\.0$/, '') + 'k';
    }
    return cell.toString();
}

function timeFormatter(cell) {
    const date = new Date(cell);
    return date.toISOString().replace('T', ' ').split('.')[0].concat(' UTC');
}

// ===== 渲染 Grid.js =====
function renderGrid(rows) {
    if (grid) {
        grid.updateConfig({ data: rows }).forceRender();
        return;
    }

    grid = new gridjs.Grid({
        width: "100%",
        search: true,
        columns: [
            { name: "Name", sort: true, formatter: nameFormatter },
            { name: "Description" },
            { name: "Stars", sort: true, formatter: starCountFormatter },
            { name: "Language", sort: true },
            { name: "Created At", sort: true, formatter: timeFormatter },
            { name: "Updated At", sort: true, formatter: timeFormatter },
        ],
        data: rows,
        pagination: { limit: 50 },
    }).render(tableContainer);
}
