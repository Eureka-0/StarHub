from github import Auth, Github


def main():
    auth = Auth.Token("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")
    g = Github(auth=auth)
    stars = g.get_user().get_starred()
    for star in stars:
        print(star.name)
        print(star.url)
        print(star.description)
        print(star.get_languages())
        print(star.topics)
        break
