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
                title: "Name",
                field: "name",
                formatter: "link",
                sorter: "string",
                vertAlign: "middle",
                formatterParams: {
                    labelField: "name",
                    urlField: "html_url",
                    target: "_blank",
                },
                headerFilter: "input",
                headerFilterPlaceholder: "Search by name...",
            },
            {
                title: "Description",
                field: "description",
                formatter: "textarea",
                width: 700,
                headerFilter: "input",
                headerFilterPlaceholder: "Search in description...",
            },
            {
                title: "Stars",
                field: "stargazers_count",
                hozAlign: "center",
                vertAlign: "middle",
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
                title: "Language",
                field: "language",
                vertAlign: "middle",
                width: 130,
                sorter: "string",
                editor: "input",
                headerFilter: "list",
                headerFilterParams: {
                    valuesLookup: true,
                    clearable: true,
                },
                headerFilterPlaceholder: "Filter...",
            },
            {
                title: "Created At",
                field: "created_at",
                sorter: "datetime",
                hozAlign: "center",
                vertAlign: "middle",
                width: 200,
                sorterParams: {
                    format: "iso",
                    alignEmptyValues: "top",
                },
            },
            {
                title: "Updated At",
                field: "updated_at",
                sorter: "datetime",
                hozAlign: "center",
                vertAlign: "middle",
                width: 200,
                sorterParams: {
                    format: "iso",
                    alignEmptyValues: "top",
                },
            },
            {
                title: "Archived",
                field: "archived",
                hozAlign: "center",
                vertAlign: "middle",
            },
        ],
    });
}

getStarredRepos()
    .then((stars) => {
        const totalCount = stars.length;
        $("#total-count").text(`Total starred repos: ${totalCount}`);
        constructTable(stars);
    })
    .catch((error) => {
        console.error("Error:", error);
    });
