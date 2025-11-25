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
    pagination: {
        limit: 50,
        server: {
            url: (_, page, limit) => `/api/starred?per_page=${limit}&page=${page + 1}`,
        }
    },
    server: {
        url: `/api/starred`,
        then: data => data.items.map(repo => [
            [repo.name, repo.html_url],
            repo.description,
            repo.stargazers_count,
            repo.language,
            repo.created_at,
            repo.updated_at,
        ]),
        total: data => data.total,
    }
}).render(document.getElementById("stars-table"));

