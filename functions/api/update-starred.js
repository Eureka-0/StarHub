// functions/api/update-starred.js

export async function onRequest(context) {
    const { env } = context;

    const username = env.GITHUB_USERNAME;
    const token = env.GITHUB_TOKEN;

    const ghHeaders = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "cf-pages-update-starred",
    };
    if (token) {
        ghHeaders["Authorization"] = `token ${token}`;
    }

    const perPage = 100; // GitHub API 单页最大 100
    let page = 1;
    const items = [];

    while (true) {
        const resp = await fetch(
            `https://api.github.com/users/${username}/starred?per_page=${perPage}&page=${page}`,
            { headers: ghHeaders }
        );

        if (!resp.ok) {
            return new Response(
                JSON.stringify({ error: "GitHub API error", status: resp.status }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const pageData = await resp.json();
        if (!Array.isArray(pageData) || pageData.length === 0) {
            break; // 没有更多数据了
        }

        // 只保留你需要的字段，减小 JSON 体积
        for (const repo of pageData) {
            items.push({
                name: repo.name,
                html_url: repo.html_url,
                description: repo.description,
                stargazers_count: repo.stargazers_count,
                language: repo.language,
                created_at: repo.created_at,
                updated_at: repo.updated_at,
            });
        }

        if (pageData.length < perPage) {
            // 最后一页
            break;
        }
        page += 1;

        // 安全保护：防止极端情况无限循环
        if (page > 100) break;
    }

    const payload = {
        updatedAt: new Date().toISOString(),
        total: items.length,
        items,
    };

    // 把 JSON 存到 KV（逻辑上就相当于写入一个 data.json）
    await env.STARRED_CACHE.put("starred", JSON.stringify(payload));

    return new Response(
        JSON.stringify({
            ok: true,
            total: items.length,
            updatedAt: payload.updatedAt,
        }),
        {
            headers: { "Content-Type": "application/json" },
        }
    );
}
