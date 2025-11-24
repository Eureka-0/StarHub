const GitHubAPI = {
    user: "Eureka-0",
    get baseUrl() {
        return `https://api.github.com/users/${this.user}`;
    },
    header: {
        Accept: "application/vnd.github.v3+json",
    },
};

async function fetchStarredCount() {
    const response = await fetch(
        `${GitHubAPI.baseUrl}/starred?per_page=1`,
        { headers: GitHubAPI.header }
    );

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const link = response.headers.get("link");

    if (link) {
        const match = link.match(/per_page=1&page=(\d+)>;\s*rel="last"/);
        if (match) {
            return parseInt(match[1], 10);
        }
    }

    const data = await response.json();
    return Array.isArray(data) ? data.length : 0;
}

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

function renderGrid(totalCount) {
    new gridjs.Grid({
        width: "100%",
        search: true,
        columns: [
            { name: "Name", sort: true, width: "160px", formatter: nameFormatter },
            { name: "Description" },
            { name: "Stars", sort: true, width: "130px", formatter: starCountFormatter },
            { name: "Language", sort: true, width: "160px" },
            { name: "Created At", formatter: timeFormatter },
            { name: "Updated At", formatter: timeFormatter },
        ],
        pagination: {
            limit: 50,
            server: {
                url: (_, page, limit) => `${GitHubAPI.baseUrl}/starred?per_page=${limit}&page=${page + 1}`,
            }
        },
        server: {
            url: `${GitHubAPI.baseUrl}/starred`,
            headers: GitHubAPI.header,
            then: data => data.map(repo => [
                [repo.name, repo.html_url],
                repo.description,
                repo.stargazers_count,
                repo.language,
                repo.created_at,
                repo.updated_at,
            ]),
            total: () => totalCount,
        }
    }).render(document.getElementById("stars-table"));
}

fetchStarredCount().then((totalCount) => {
    renderGrid(totalCount);
}).catch((error) => {
    console.error("Error fetching starred repositories:", error);
});
