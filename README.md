# StarHub

![License](https://img.shields.io/badge/license-GPLv3-blue.svg)
[![Cloudflare Pages](https://img.shields.io/website?url=https%3A%2F%2Fstarhub-3zj.pages.dev%2F&up_message=online&up_color=blue&down_message=offline&down_color=red&style=flat)](https://starhub-3zj.pages.dev/)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/Eureka-0/StarHub/refresh-starred.yml?label=update)

A small dashboard for browsing your GitHub starred repositories.  
Built with **Grid.js** on the frontend and **Cloudflare Pages + Functions + KV** on the backend.

## Features

- Fetches all starred repositories for a given GitHub user
- Caches results in Cloudflare KV to avoid hitting the GitHub API on every request
- Simple refresh button to manually re-sync from GitHub
- Search, sort, and paginate using Grid.js
- Deployed as a static site on Cloudflare Pages with serverless API routes

## How it works

- `/api/update-starred`  
  A Cloudflare Function that calls the GitHub REST API (`/users/:username/starred`) page by page, extracts only the required fields, and stores the result JSON into a KV namespace (`STARRED_CACHE`).

- `/api/starred`  
  A Cloudflare Function that reads the cached JSON from `STARRED_CACHE` and returns it to the frontend, along with the GitHub username and profile URL.

- Frontend  
  A static HTML page (`index.html`) that:
  - loads cached starred repositories from `/api/starred`
  - renders them via Grid.js
  - shows the GitHub username as a link
  - exposes a **Refresh** button that triggers `/api/update-starred` and then reloads the data

## Requirements

- A GitHub account
- A Cloudflare account
- A GitHub **personal access token** (optional but recommended to raise rate limits)
- Node.js (only needed if you want to run local tooling; the app itself is static + Functions)

## Deployment

1. **Fork** this repository to your own GitHub account.

2. **Create a Cloudflare Pages project** linked to your forked repository.

3. **Configure environment variables** (see below).

4. **Create a KV namespace** and bind it to your Pages project (see below).

5. **Deploy** the project on Cloudflare Pages. After environment variables and KV bindings are set up, a redeployment is required. You can trigger a redeployment by pushing an empty commit to your forked repository:

   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push
   ```

   or just retry the first deployment from the Cloudflare Pages dashboard.

6. **Configure GitHub Actions** to automatically refresh the starred cache daily (optional). Just make sure to enable the `Refresh Starred Cache` workflow and set the `UPDATE_KEY` secret in your forked repository's settings.

## Environment variables

Configured in **Cloudflare Pages → Settings → Environment Variables**:

- `GITHUB_USERNAME` – GitHub username whose starred repositories you want to display
- `UPDATE_KEY` - A secret key used to authorize requests to `/api/update-starred`. Set this to a random string and use the same string when calling the update endpoint. This should be identical to the `UPDATE_KEY` used in GitHub Actions if you set up automatic updates.
- `GITHUB_TOKEN` – (optional) GitHub personal access token used for authenticated requests

> If `GITHUB_TOKEN` is not set, the app relies on unauthenticated GitHub API calls and may quickly hit rate limits.

## KV binding

Create a **KV namespace** in Cloudflare and bind it to your Pages project:

1. Go to **Cloudflare dashboard → Storage & databases → Workers KV** and create a namespace, e.g. `starred-cache`.
2. In your Pages project settings, under **Settings → Bindings**, add a binding of type **KV Namespace**:
   - Variable name: `STARRED_CACHE`
   - KV namespace: choose the namespace you just created

The code expects the binding to be accessible as `env.STARRED_CACHE`.
