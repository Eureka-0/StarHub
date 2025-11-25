// 先填充 header 中的 GitHub 用户链接
fetch('/api/starred?page=1&per_page=1')
    .then(res => res.json())
    .then(data => {
        const link = document.getElementById('github-user-link');
        if (link && data.username && data.profileUrl) {
            link.textContent = data.username;
            link.href = data.profileUrl;
        }
    })
    .catch(err => {
        console.error('Failed to load GitHub user info:', err);
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
    pagination: { limit: 50, },
    server: {
        url: `/api/starred`,
        then: data => data.map(repo => [
            [repo.name, repo.html_url],
            repo.description,
            repo.stargazers_count,
            repo.language,
            repo.created_at,
            repo.updated_at,
        ]),
        total: data => data.length,
    }
}).render(document.getElementById("stars-table"));
