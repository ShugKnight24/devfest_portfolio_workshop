import { useState, useEffect } from "react";
import { GithubLogo, Star, GitFork } from "./Icons";
import { Skeleton } from "./Skeleton";

/**
 * GitHub Repos Component
 *
 * Fetches and displays a user's GitHub repositories dynamically.
 * Great for showing real, live data on your portfolio!
 *
 * Learning concepts:
 * - API fetching with useEffect
 * - Loading and error states
 * - Conditional rendering
 *
 * Usage:
 * <GithubRepos username="yourusername" />
 */

export const GithubRepos = ({
  username,
  count = 6,
  showForks = false,
  sortBy = "updated", // "updated", "stars", "name"
}) => {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }

    const fetchRepos = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://api.github.com/users/${username}/repos?sort=${sortBy}&per_page=100`
        );

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "GitHub user not found"
              : "Failed to fetch repositories"
          );
        }

        let data = await response.json();

        // Filter out forks if not wanted
        if (!showForks) {
          data = data.filter((repo) => !repo.fork);
        }

        // Sort by stars if requested
        if (sortBy === "stars") {
          data.sort((a, b) => b.stargazers_count - a.stargazers_count);
        }

        // Take only the requested count
        setRepos(data.slice(0, count));
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchRepos();
  }, [username, count, showForks, sortBy]);

  // Language colors (subset of GitHub's language colors)
  const languageColors = {
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    Python: "#3572A5",
    Java: "#b07219",
    "C++": "#f34b7d",
    C: "#555555",
    "C#": "#178600",
    Go: "#00ADD8",
    Rust: "#dea584",
    Ruby: "#701516",
    PHP: "#4F5D95",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    HTML: "#e34c26",
    CSS: "#563d7c",
    SCSS: "#c6538c",
    Vue: "#41b883",
    Shell: "#89e051",
    Dart: "#00B4AB",
  };

  if (!username) {
    return (
      <div className="section-container">
        <div className="text-center p-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
          <p className="text-yellow-700 dark:text-yellow-300">
            Add your GitHub username to{" "}
            <code className="bg-yellow-100 dark:bg-yellow-900/50 px-1 rounded">
              portfolioData.js
            </code>{" "}
            to display your repos!
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <section className="section-container">
        <h2 className="section-title">Latest from GitHub</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: count }).map((_, i) => (
            <Skeleton.GitHubRepo key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section-container">
        <h2 className="section-title">Latest from GitHub</h2>
        <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300">{error}</p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">
            Check your username in portfolioData.js
          </p>
        </div>
      </section>
    );
  }

  if (repos.length === 0) {
    return (
      <section className="section-container">
        <h2 className="section-title">Latest from GitHub</h2>
        <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <p className="text-gray-600 dark:text-gray-400">
            No public repositories found for @{username}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="section-container">
      <div className="flex items-center justify-center gap-3 mb-8">
        <GithubLogo className="w-8 h-8 text-gray-800 dark:text-gray-200" />
        <h2 className="section-title mb-0!">Latest from GitHub</h2>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {repos.map((repo) => (
          <a
            key={repo.id}
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1"
          >
            {/* Repo name */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 group-hover:text-(--color-primary) transition-colors truncate pr-2">
                {repo.name}
              </h3>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-(--color-primary) transition-colors shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 min-h-10">
              {repo.description || "No description available"}
            </p>

            {/* Stats and language */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                {/* Language */}
                {repo.language && (
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor:
                          languageColors[repo.language] || "#858585",
                      }}
                    />
                    <span className="text-gray-600 dark:text-gray-400">
                      {repo.language}
                    </span>
                  </div>
                )}

                {/* Stars */}
                {repo.stargazers_count > 0 && (
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Star className="w-4 h-4" />
                    <span>{repo.stargazers_count}</span>
                  </div>
                )}

                {/* Forks */}
                {repo.forks_count > 0 && (
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <GitFork className="w-4 h-4" />
                    <span>{repo.forks_count}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Topics/Tags */}
            {repo.topics && repo.topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {repo.topics.slice(0, 3).map((topic) => (
                  <span
                    key={topic}
                    className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </a>
        ))}
      </div>

      {/* View all link */}
      <div className="text-center mt-8">
        <a
          href={`https://github.com/${username}?tab=repositories`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-(--color-primary) hover:underline font-medium"
        >
          View all repositories on GitHub
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </a>
      </div>
    </section>
  );
};

export default GithubRepos;
