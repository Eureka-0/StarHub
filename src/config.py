from pathlib import Path


class Paths:
    Obsidian_ICloud = Path(
        "/Users/lxlong/Library/Mobile Documents/iCloud~md~obsidian/Documents"
    )
    Obsidian_Memo = Obsidian_ICloud / "/Personal Notes/备忘录"


class GithubAPI:
    User_Name = "Eureka-0"
    Base_URL = f"https://api.github.com/users/{User_Name}"
    Access_Token = "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"
    Header = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 6.1; WOW64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/63.0.3239.132 Safari/537.36 QIHU 360SE"
        ),
        "Authorization": f"token {Access_Token}",
    }
