import asyncio
import json
import re
from itertools import chain
from typing import Any

import httpx

from config import GithubAPI


def get_star_count() -> int:
    resp = httpx.get(
        f"{GithubAPI.Base_URL}/starred?per_page=1", headers=GithubAPI.Header
    ).raise_for_status()
    links = resp.headers["link"]
    result = re.search(r"per_page=1&page=(\d+)>; rel=\"last\"", links)
    if result:
        return int(result.group(1))
    else:
        raise ValueError(f"No match found in {links}")


async def get_starred_repos_one_page(
    client: httpx.AsyncClient, per_page: int, page: int
) -> list[dict[str, Any]]:
    resp = await client.get(
        f"{GithubAPI.Base_URL}/starred?per_page={per_page}&page={page}"
    )
    return json.loads(resp.text)


async def get_starred_repos():
    count = get_star_count()
    per_page = 60
    pages = range(1, count // per_page + 2)
    client = httpx.AsyncClient(headers=GithubAPI.Header)
    tasks = [get_starred_repos_one_page(client, per_page, page) for page in pages]
    stars = await asyncio.gather(*tasks)
    await client.aclose()
    return list(chain(*stars))


def get_stars():
    return asyncio.run(get_starred_repos())


def main():
    stars = get_stars()
    # md_table = (
    #     "---\n"
    #     "cssClass: wide-table\n"
    #     "---\n\n"
    #     "| Name | Description | Topics |\n"
    #     "| ---- | ----------- | ------ |\n"
    # )
    # for star in stars:
    #     description = star.description
    #     if description is None:
    #         description = ""
    #     else:
    #         description = description.replace("|", r"\|")
    #     md_table += (
    #         f"| [{star.name}]({star.html_url}) | {description} | {star.topics} |\n"
    #     )

    # with open(Paths.OBSIDIAN_VAULT / "stars.md", "w") as f:
    #     f.write(md_table)
