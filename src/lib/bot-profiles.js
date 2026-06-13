import { Baby, Brain, Crown, Flame, Shield, Swords } from "lucide-react";

export const BOT_PROFILES = [
  {
    id: "newcomer",
    name: "Newcomer",
    elo: 400,
    style: "Learning basics",
    skill: 0,
    movetime: 80,
    icon: Baby,
  },
  {
    id: "casual",
    name: "Casual",
    elo: 800,
    style: "Simple tactics",
    skill: 3,
    movetime: 150,
    icon: Shield,
  },
  {
    id: "club",
    name: "Club Player",
    elo: 1200,
    style: "Balanced",
    skill: 8,
    movetime: 450,
    icon: Swords,
  },
  {
    id: "attacker",
    name: "Attacker",
    elo: 1400,
    style: "Sharp tactical play",
    skill: 10,
    movetime: 650,
    icon: Flame,
  },
  {
    id: "strategist",
    name: "Strategist",
    elo: 1600,
    style: "Positional pressure",
    skill: 13,
    movetime: 900,
    icon: Brain,
  },
  {
    id: "master",
    name: "Master",
    elo: 2000,
    style: "Serious engine",
    skill: 18,
    movetime: 1500,
    icon: Crown,
  },
];

const LEGACY_DIFFICULTY_TO_BOT = {
  easy: "casual",
  medium: "club",
  hard: "master",
};

export const getBotProfile = (id = "club") => {
  const normalizedId = LEGACY_DIFFICULTY_TO_BOT[id] ?? id;
  return (
    BOT_PROFILES.find((profile) => profile.id === normalizedId) ??
    BOT_PROFILES.find((profile) => profile.id === "club")
  );
};

export const getBotProfileLabel = (id) => {
  const profile = getBotProfile(id);
  return `${profile.name} (${profile.elo})`;
};
