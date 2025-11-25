// ===== 基本配置 =====
const GITHUB_USER = "Eureka-0";
const BASE_URL = `https://api.github.com/users/${GITHUB_USER}`;
const HEADERS = {
    Accept: "application/vnd.github.v3+json",
}

const tableContainer = document.getElementById("stars-table");


// ===== 工具函数 =====
async function fetchStarredCount() {
    const response = await fetch(
        `${BASE_URL}/starred?per_page=1`,
        { headers: HEADERS }
    );

    if (!response.ok) {
        // 尝试输出一些更友好的错误信息（比如被限流）
        const remaining = response.headers.get("X-RateLimit-Remaining");
        if (response.status === 403 && remaining === "0") {
            throw new Error("GitHub API 已达到未认证访问的速率上限，请稍后再试。");
        }
        throw new Error(`GitHub API 请求失败，状态码: ${response.status}`);
    }

    const link = response.headers.get("link");

    if (link) {
        // 格式类似：
        // <https://api.github.com/.../starred?per_page=1&page=2>; rel="next",
        // <https://api.github.com/.../starred?per_page=1&page=468>; rel="last"
        const match = link.match(/<[^>]*[?&]page=(\d+)[^>]*>;\s*rel="last"/);
        if (match) {
            // 因为 per_page=1，所以页数 = 总条数
            return parseInt(match[1], 10);
        }
    }

    // 没有 Link 头，说明总数 <= 1，直接用 body 的长度
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


// ===== 渲染 Grid.js =====
function renderGrid(totalCount) {
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
                url: (_, page, limit) => `${BASE_URL}/starred?per_page=${limit}&page=${page + 1}`,
            }
        },
        server: {
            url: `${BASE_URL}/starred`,
            headers: HEADERS,
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
    }).render(tableContainer);
}


// ===== 初始化逻辑 =====
async function init() {
    // 简单的加载状态
    tableContainer.innerHTML =
        '<div class="loading">Loading your starred repositories...</div>';

    try {
        const totalCount = await fetchStarredCount();
        console.log("Total starred repositories:", totalCount);

        tableContainer.innerHTML = ""; // 清空加载提示
        renderGrid(totalCount);
    } catch (error) {
        console.error(error);
        tableContainer.innerHTML = `
      <div class="error">
        <p>加载 starred 仓库失败：</p>
        <pre>${error.message}</pre>
      </div>
    `;
    }
}

init();
