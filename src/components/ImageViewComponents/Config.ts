const REPO_COLORS: Record<string, { bg: string; color: string }> = {
  nginx: { bg: "rgba(0,212,255,0.12)", color: "#00d4ff" },
  postgres: { bg: "rgba(100,181,246,0.15)", color: "#64b5f6" },
  redis: { bg: "rgba(255,82,82,0.12)", color: "#ff5252" },
  node: { bg: "rgba(0,230,118,0.12)", color: "#00e676" },
  python: { bg: "rgba(255,213,79,0.12)", color: "#ffd54f" },
  alpine: { bg: "rgba(179,136,255,0.12)", color: "#b388ff" },
  ubuntu: { bg: "rgba(255,171,64,0.12)", color: "#ffab40" },
  traefik: { bg: "rgba(0,230,118,0.12)", color: "#00e676" },
  mysql: { bg: "rgba(255,171,64,0.12)", color: "#ffab40" },
  mongo: { bg: "rgba(0,230,118,0.12)", color: "#00e676" },
};

export function repoColor(repo: string) {
  return (
    REPO_COLORS[repo.toLowerCase()] ?? {
      bg: "var(--bg4)",
      color: "var(--text-muted)",
    }
  );
}
