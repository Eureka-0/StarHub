// functions/api/starred.js

export async function onRequest(context) {
    const { env } = context;

    const username = env.GITHUB_USERNAME;

    const cached = await env.STARRED_CACHE.get("starred");
    if (!cached) {
        // 还没初始化缓存，提示前端先调用 /api/update-starred
        return new Response(
            JSON.stringify({
                error: "No cached data. Please run /api/update-starred first.",
            }),
            { status: 404, headers: { "Content-Type": "application/json" } }
        );
    }

    // 直接把整份 JSON 返回给前端
    return new Response(
        JSON.stringify({
            items: JSON.parse(cached),
            username: username,
            profileUrl: `https://github.com/${username}`,
        }),
        {
            headers: {
                "Content-Type": "application/json",
            },
        });
}
