const GitHubAPI = {
    User: "Eureka-0",
    get Base_URL() {
        return `https://api.github.com/users/${this.User}`;
    },
    Header: {
        Accept: "application/vnd.github.v3+json",
    },
};
$("#user").text(`User: ${GitHubAPI.User}`);

async function getStarCount() {
    try {
        const response = await axios.get(
            `${GitHubAPI.Base_URL}/starred?per_page=1`,
            { headers: GitHubAPI.Header }
        );

        const links = response.headers["link"];
        const result = /per_page=1&page=(\d+)>; rel="last"/.exec(links);

        if (result) {
            return parseInt(result[1], 10);
        } else {
            throw new Error(`No match found in ${links}`);
        }
    } catch (error) {
        console.error("Error fetching star count:", error);
        throw error;
    }
}

async function getStarredReposOnePage(perPage, page) {
    try {
        const response = await axios.get(
            `${GitHubAPI.Base_URL}/starred?per_page=${perPage}&page=${page}`,
            { headers: GitHubAPI.Header }
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
        throw error;
    }
}

async function getStarredRepos() {
    try {
        const count = await getStarCount();
        const perPage = 60;
        const pages = Math.ceil(count / perPage);
        const tasks = [];

        for (let page = 1; page <= pages; page++) {
            tasks.push(getStarredReposOnePage(perPage, page));
        }

        const stars = await Promise.all(tasks);
        const allStars = stars.flat(); // 将所有页面的结果合并到一个数组中
        return allStars;
    } catch (error) {
        console.error("Error fetching starred repositories:", error);
        throw error;
    }
}

function constructTable(stars) {
    var table = new Tabulator("#stars-table", {
        data: stars,
        height: "100%",
        layout: "fitDataTable",
        columnDefaults: {
            resizable: true,
        },
        columns: [
            {
                title: "Name", field: "name", formatter: "link", sorter: "string",
                vertAlign: "middle", headerFilter: "input",
                headerFilterPlaceholder: "Search by name...",
                formatterParams: { labelField: "name", urlField: "html_url", target: "_blank" },
            },
            {
                title: "Description", field: "description", formatter: "textarea", width: 700,
                headerFilter: "input", headerFilterPlaceholder: "Search in description...",
            },
            {
                title: "Stars", field: "stargazers_count", hozAlign: "center", vertAlign: "middle",
                formatter: function (cell, formatterParams, onRendered) {
                    value = cell.getValue();
                    if (value >= 1000) {
                        return parseFloat((value / 1000).toFixed(1)) + "k";
                    } else {
                        return value;
                    }
                },
            },
            {
                title: "Language", field: "language", vertAlign: "middle", width: 130,
                sorter: "string", editor: "input", headerFilter: "list",
                headerFilterParams: { valuesLookup: true, clearable: true },
                headerFilterPlaceholder: "Filter...",
            },
            {
                title: "Created At", field: "created_at", sorter: "datetime", hozAlign: "center",
                vertAlign: "middle", width: 200,
                sorterParams: { format: "iso", alignEmptyValues: "top" },
            },
            {
                title: "Updated At", field: "updated_at", sorter: "datetime", hozAlign: "center",
                vertAlign: "middle", width: 200,
                sorterParams: { format: "iso", alignEmptyValues: "top" },
            },
            {
                title: "Archived", field: "archived", hozAlign: "center", vertAlign: "middle",
            },
        ],
    });
}

getStarredRepos().then((stars) => {
    const totalCount = stars.length;
    $("#total-count").text(`Total starred repos: ${totalCount}`);
    constructTable(stars);
}).catch((error) => {
    console.error("Error:", error);
});
