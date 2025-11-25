export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    const page = Number(url.searchParams.get("page") || "1");
    const perPage = Number(url.searchParams.get("per_page") || "50");

    const username = env.GITHUB_USERNAME; // 你要展示的 GitHub 用户名, 在 Cloudflare 项目设置里配置
    const token = env.GITHUB_TOKEN; // GitHub 访问令牌, 在 Cloudflare 项目设置里配置

    const ghHeaders = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "cf-pages-functions-github-proxy",
    };

    if (token) {
        ghHeaders["Authorization"] = `token ${token}`;
    }

    // ---------- 1. 计算总数：per_page=1 + Link 头 ----------
    const countResp = await fetch(
        `https://api.github.com/users/${username}/starred?per_page=1`,
        { headers: ghHeaders }
    );

    if (!countResp.ok) {
        return new Response(
            JSON.stringify({ error: "Failed to fetch count from GitHub" }),
            {
                status: countResp.status,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    const link = countResp.headers.get("Link");
    let total = 0;

    if (link) {
        // 典型格式: <...page=2>; rel="next", <...page=299>; rel="last"
        const match = link.match(/&page=(\d+)>;\s*rel="last"/);
        if (match) {
            // 因为 per_page=1，所以最后一页页码就是总数
            total = parseInt(match[1], 10);
        }
    } else {
        // 没有 Link 头，说明 0 或 1 条记录
        const arr = await countResp.json();
        total = Array.isArray(arr) ? arr.length : 0;
    }

    // ---------- 2. 拉取当前页数据 ----------
    const dataResp = await fetch(
        `https://api.github.com/users/${username}/starred?per_page=${perPage}&page=${page}`,
        { headers: ghHeaders }
    );

    if (!dataResp.ok) {
        return new Response(
            JSON.stringify({ error: "Failed to fetch data from GitHub" }),
            {
                status: dataResp.status,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    const items = await dataResp.json();

    // ---------- 3. 返回 JSON 给前端 ----------
    return new Response(
        JSON.stringify({ items, total, username, profileUrl: `https://github.com/${username}`, }),
        {
            headers: {
                "Content-Type": "application/json",
                // 页面和函数同域，不一定需要 CORS；如需跨域可视情况加：
                // "Access-Control-Allow-Origin": "*",
            },
        }
    );
}
