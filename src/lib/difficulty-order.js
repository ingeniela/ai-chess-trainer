const DIFFICULTY_RANK = {
  easy: 10,
  beginner: 10,
  medium: 20,
  intermediate: 20,
  club: 20,
  hard: 30,
  advanced: 30,
  expert: 40,
  master: 50,
};

export const compareByDifficulty = (left, right) => {
  const leftRank =
    DIFFICULTY_RANK[String(left?.difficulty ?? "").toLowerCase()] ?? 999;
  const rightRank =
    DIFFICULTY_RANK[String(right?.difficulty ?? "").toLowerCase()] ?? 999;

  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  return String(left?.title ?? left?.name ?? left?.id ?? "").localeCompare(
    String(right?.title ?? right?.name ?? right?.id ?? ""),
  );
};
