// 先填充 header 中的 GitHub 用户链接
fetch('/api/starred')
    .then(res => res.json())
    .then(data => {
        const link = document.getElementById('github-user-link');
        if (link && data.username && data.profileUrl) {
            link.textContent = data.username;
            link.href = data.profileUrl;
        }

        rows = data.items.map(repo => [
            [repo.name, repo.html_url],
            repo.description,
            repo.stargazers_count,
            repo.language,
            repo.created_at,
            repo.updated_at,
        ]);

        renderGrid(rows);
    })
    .catch(err => {
        console.error('Failed to load GitHub user info:', err);
    });


// 刷新按钮：调用 /api/update-starred，然后重新渲染
document.getElementById('refresh-btn').addEventListener('click', async () => {
    try {
        const resp = await fetch('/api/update-starred', { method: 'POST' });
        if (!resp.ok) {
            throw new Error('Update failed');
        }
        const result = await resp.json();
        console.log('Updated:', result);

        // 更新完成后重新拉取并渲染
        fetch('/api/starred')
            .then(res => res.json())
            .then(data => {
                const rows = data.items.map(repo => [
                    [repo.name, repo.html_url],
                    repo.description,
                    repo.stargazers_count,
                    repo.language,
                    repo.created_at,
                    repo.updated_at,
                ]);

                renderGrid(rows);
            })
            .catch(err => {
                console.error('Failed to reload starred repos:', err);
                alert('刷新失败，请查看控制台');
            });
    } catch (err) {
        console.error(err);
        alert('刷新失败，请查看控制台');
    }
});


function nameFormatter(cell) {
    const [name, url] = cell;
    return gridjs.html(`<a href="${url}" target="_blank" class="name-cell">${name}</a>`);
}

function starCountFormatter(cell) {
    if (cell >= 1000) {
        return (cell / 1000).toFixed(1) + "k";
    } else {
        return cell.toString();
    }
}

function timeFormatter(cell) {
    const date = new Date(cell);
    return date.toISOString().replace('T', ' ').split('.')[0].concat(' UTC');
}

// ===== 渲染 Grid.js =====
function renderGrid(rows) {
    new gridjs.Grid({
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
    }).render(document.getElementById("stars-table"));
}
