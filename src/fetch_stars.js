const GitHubAPI = {
  User: "Eureka-0",
  get Base_URL() {
    return `https://api.github.com/users/${this.User}`;
  },
  Header: {
    Accept: "application/vnd.github.v3+json",
  },
};
$("#user").text(`User: ${GitHubAPI.User}`);

async function getStarCount() {
  try {
    const response = await axios.get(
      `${GitHubAPI.Base_URL}/starred?per_page=1`,
      {
        headers: GitHubAPI.Header,
      }
    );

    const links = response.headers["link"];
    const result = /per_page=1&page=(\d+)>; rel="last"/.exec(links);

    if (result) {
      return parseInt(result[1], 10);
    } else {
      throw new Error(`No match found in ${links}`);
    }
  } catch (error) {
    console.error("Error fetching star count:", error);
    throw error;
  }
}

async function getStarredReposOnePage(perPage, page) {
  try {
    const response = await axios.get(
      `${GitHubAPI.Base_URL}/starred?per_page=${perPage}&page=${page}`,
      {
        headers: GitHubAPI.Header,
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching page ${page}:`, error);
    throw error;
  }
}

async function getStarredRepos() {
  try {
    const count = await getStarCount();
    const perPage = 60;
    const pages = Math.ceil(count / perPage);
    const tasks = [];

    for (let page = 1; page <= pages; page++) {
      tasks.push(getStarredReposOnePage(perPage, page));
    }

    const stars = await Promise.all(tasks);
    const allStars = stars.flat(); // 将所有页面的结果合并到一个数组中
    return allStars;
  } catch (error) {
    console.error("Error fetching starred repositories:", error);
    throw error;
  }
}

// getStarredRepos()
//   .then((stars) => {
//     saveAs(
//       new Blob([JSON.stringify(stars, null, 2)], {
//         type: "application/json",
//       }),
//       "stars.json"
//     );
//   })
//   .catch((error) => {
//     console.error("Error:", error);
//   });
