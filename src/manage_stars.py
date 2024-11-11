import asyncio
import json
import re
from datetime import datetime
from itertools import chain
from typing import Any

import httpx
from loguru import logger

from config import GitHubAPI, Paths


def get_star_count() -> int:
    resp = httpx.get(
        f"{GitHubAPI.Base_URL}/starred?per_page=1", headers=GitHubAPI.Header
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
        f"{GitHubAPI.Base_URL}/starred?per_page={per_page}&page={page}"
    )
    return json.loads(resp.text)


async def get_starred_repos():
    count = get_star_count()
    per_page = 60
    pages = range(1, count // per_page + 2)
    client = httpx.AsyncClient(headers=GitHubAPI.Header)
    tasks = [get_starred_repos_one_page(client, per_page, page) for page in pages]
    stars = await asyncio.gather(*tasks)
    await client.aclose()
    return list(chain(*stars))


def get_stars():
    return asyncio.run(get_starred_repos())


def sort_key(line: str):
    result = re.search(r"\| \[(.*?)\]", line)
    if result:
        x = result.group(1)
    else:
        raise ValueError(f"No matched name found in {line}")
    return x.lower()


def stars_to_md(stars: list[dict[str, Any]]) -> str:
    table_head = (
        "---\n"
        + "cssClass: wide-table\n"
        + f"User: {GitHubAPI.User_Name}\n"
        + f"Total Repos: {len(stars)}\n"
        + "My Stars: https://github.com/Eureka-0?tab=stars\n"
        + f"Last Updated: {datetime.now().strftime("%Y-%m-%d, %H:%M:%S")}, GMT+8\n"
        + "---\n\n"
        + "| Name | Description | Stars | Language "
        + "| <div style='width:165px'>Created At (UTC)</div> "
        + "| <div style='width:165px'>Updated At (UTC)</div> |\n"
        + "| --- | --- | --- | --- | --- | --- |\n"
    )
    lines = []
    for star in stars:
        name = f"[{star['name']}]({star['html_url']})"
        description = star["description"]
        if description is None:
            description = ""
        else:
            description = description.replace("|", r"\|")
        stars_count = int(star["stargazers_count"])
        if stars_count >= 1000:
            stars_count = f"{stars_count / 1000:.1f}k"
        language = star["language"]
        crated_at = star["created_at"].replace("T", " ").replace("Z", "")
        updated_at = star["updated_at"].replace("T", " ").replace("Z", "")
        lines.append(
            f"| {name} | {description} | {stars_count} | {language} "
            f"| {crated_at} | {updated_at} |"
        )

        archived = star["archived"]
        if archived:
            logger.warning(f"Archived: {name}")
    return table_head + "\n".join(sorted(lines, key=sort_key))


def extract_stars_from_md(md_table: str) -> set[str]:
    lines = md_table.split("\n")
    stars = []
    for line in lines:
        if not line.startswith("|"):
            continue
        name = line.split("|")[1].strip()
        if name == "Name" or name == "---":
            continue
        result = re.search(r"\[(.*?)\]", name)
        assert result
        stars.append(result.group(1))
    return set(stars)


def main():
    stars = get_stars()
    md_table = stars_to_md(stars)

    with open(Paths.Obsidian_Memo / "GitHub Stars.md", "r") as f:
        old_md_table = f.read()

    old_stars = extract_stars_from_md(old_md_table)
    new_stars = set(star["name"] for star in stars)
    diff1 = new_stars.difference(old_stars)
    diff2 = old_stars.difference(new_stars)
    if old_stars == set(star["name"] for star in stars):
        return
    elif diff1:
        logger.info(f"New stars: {diff1}")
    elif diff2:
        logger.info(f"Unstarred: {diff2}")

    with open(Paths.Obsidian_Memo / "GitHub Stars.md", "w") as f:
        f.write(md_table)
    logger.info("GitHub Stars.md updated.")
    print()
