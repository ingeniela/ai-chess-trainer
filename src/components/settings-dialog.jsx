import { Bot, Key, Palette, UserCog, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { GEMINI_MODELS } from "@/lib/google-ai";

const OPENAI_MODELS = [
  { id: "gpt-4o-mini", label: "GPT-4o Mini" },
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { id: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
];

const OPENROUTER_MODELS = [
  { id: "openai/gpt-4o-mini", label: "OpenAI GPT-4o Mini" },
  { id: "openai/gpt-4o", label: "OpenAI GPT-4o" },
  { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { id: "google/gemini-flash-1.5", label: "Gemini Flash 1.5" },
  { id: "meta-llama/llama-3.1-70b-instruct", label: "Llama 3.1 70B" },
];

const LANGUAGE_OPTIONS = [
  { id: "en", label: "English" },
  { id: "es", label: "Espanol" },
  { id: "fr", label: "Francais" },
  { id: "pt", label: "Portugues" },
];

const SETTINGS_TABS = [
  { id: "profile", label: "Profile", icon: UserCog },
  { id: "ai", label: "AI", icon: Bot },
  { id: "board", label: "Board", icon: Palette },
  { id: "sound", label: "Sound", icon: Volume2 },
];

const SOUND_CONTROLS = [
  { id: "master", label: "Master volume" },
  { id: "move", label: "Move sound" },
  { id: "capture", label: "Capture sound" },
  { id: "check", label: "Check sound" },
  { id: "end", label: "Game end sound" },
];

const getStoredVolume = (id, fallback = 80) => {
  const value = Number(localStorage.getItem(`chess-sound-${id}`));
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(100, value));
};

const SettingsDialog = ({ open, onOpenChange }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [provider, setProvider] = useState("google");
  const [googleApiKey, setGoogleApiKey] = useState("");
  const [googleModel, setGoogleModel] = useState("gemini-2.5-flash");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [openaiModel, setOpenaiModel] = useState("gpt-4o-mini");
  const [openRouterApiKey, setOpenRouterApiKey] = useState("");
  const [openRouterModel, setOpenRouterModel] = useState("openai/gpt-4o-mini");
  const [boardLight, setBoardLight] = useState("#edeed1");
  const [boardDark, setBoardDark] = useState("#779952");
  const [language, setLanguage] = useState("en");
  const [elo, setElo] = useState("1000");
  const [soundVolumes, setSoundVolumes] = useState({
    master: 80,
    move: 80,
    capture: 80,
    check: 80,
    end: 80,
  });

  useEffect(() => {
    if (!open) return;

    setActiveTab("profile");
    setProvider(localStorage.getItem("chess-ai-provider") || "google");
    setGoogleApiKey(localStorage.getItem("chess-google-api-key") || "");
    setGoogleModel(
      localStorage.getItem("chess-google-model") || "gemini-2.5-flash",
    );
    setOpenaiApiKey(localStorage.getItem("chess-coach-api-key") || "");
    setOpenaiModel(localStorage.getItem("chess-coach-model") || "gpt-4o-mini");
    setOpenRouterApiKey(localStorage.getItem("chess-openrouter-api-key") || "");
    setOpenRouterModel(
      localStorage.getItem("chess-openrouter-model") || "openai/gpt-4o-mini",
    );
    setBoardLight(localStorage.getItem("chess-board-light") || "#edeed1");
    setBoardDark(localStorage.getItem("chess-board-dark") || "#779952");
    setLanguage(localStorage.getItem("chess-language") || "en");
    setElo(localStorage.getItem("chess-coach-elo") || "1000");
    setSoundVolumes({
      master: getStoredVolume("master"),
      move: getStoredVolume("move"),
      capture: getStoredVolume("capture"),
      check: getStoredVolume("check"),
      end: getStoredVolume("end"),
    });
  }, [open]);

  const handleVolumeChange = (id, value) => {
    setSoundVolumes((previous) => ({
      ...previous,
      [id]: Math.max(0, Math.min(100, Number(value))),
    }));
  };

  const handleSave = () => {
    const parsedElo = Math.max(100, Math.min(3000, parseInt(elo, 10) || 1000));

    localStorage.setItem("chess-ai-provider", provider);
    localStorage.setItem("chess-google-api-key", googleApiKey);
    localStorage.setItem("chess-google-model", googleModel);
    localStorage.setItem("chess-coach-api-key", openaiApiKey);
    localStorage.setItem("chess-coach-model", openaiModel);
    localStorage.setItem("chess-openrouter-api-key", openRouterApiKey);
    localStorage.setItem("chess-openrouter-model", openRouterModel);
    localStorage.setItem("chess-board-light", boardLight);
    localStorage.setItem("chess-board-dark", boardDark);
    localStorage.setItem("chess-language", language);
    localStorage.setItem("chess-coach-elo", String(parsedElo));

    for (const [key, value] of Object.entries(soundVolumes)) {
      localStorage.setItem(`chess-sound-${key}`, String(value));
    }

    document.documentElement.lang = language;
    window.dispatchEvent(new window.Event("chess-settings-updated"));
    onOpenChange(false);
  };

  const isGoogle = provider === "google";
  const isOpenAI = provider === "openai";
  const isOpenRouter = provider === "openrouter";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Configure your AI coach. API keys are stored only in your browser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-1 rounded-md bg-muted p-1">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors sm:text-sm ${
                    active
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {activeTab === "profile" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your ELO Rating</label>
                <Input
                  type="number"
                  placeholder="1000"
                  min={100}
                  max={3000}
                  value={elo}
                  onChange={(e) => setElo(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Used to tailor coaching depth and vocabulary to your level.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">AI Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setProvider("google")}
                    className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      isGoogle
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-transparent hover:bg-accent"
                    }`}
                  >
                    Google Gemini
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider("openai")}
                    className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      isOpenAI
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-transparent hover:bg-accent"
                    }`}
                  >
                    OpenAI
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider("openrouter")}
                    className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      isOpenRouter
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-transparent hover:bg-accent"
                    }`}
                  >
                    OpenRouter
                  </button>
                </div>
              </div>

              {isGoogle && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Google API Key
                    </label>
                    <Input
                      type="password"
                      placeholder="AIza..."
                      value={googleApiKey}
                      onChange={(e) => setGoogleApiKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Get your key at{" "}
                      <span className="font-mono">aistudio.google.com</span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Gemini Model</label>
                    <select
                      value={googleModel}
                      onChange={(e) => setGoogleModel(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {GEMINI_MODELS.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.label} - {model.description}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Gemini models support agentic board control: the AI can
                      move pieces and set positions while teaching.
                    </p>
                  </div>
                </>
              )}

              {isOpenAI && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      OpenAI API Key
                    </label>
                    <Input
                      type="password"
                      placeholder="sk-..."
                      value={openaiApiKey}
                      onChange={(e) => setOpenaiApiKey(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Model</label>
                    <select
                      value={openaiModel}
                      onChange={(e) => setOpenaiModel(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {OPENAI_MODELS.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {isOpenRouter && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      OpenRouter API Key
                    </label>
                    <Input
                      type="password"
                      placeholder="sk-or-v1-..."
                      value={openRouterApiKey}
                      onChange={(e) => setOpenRouterApiKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Uses the OpenRouter OpenAI-compatible chat completions API.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      OpenRouter Model
                    </label>
                    <select
                      value={openRouterModel}
                      onChange={(e) => setOpenRouterModel(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {OPENROUTER_MODELS.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "board" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Light square</label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={boardLight}
                    onChange={(e) => setBoardLight(e.target.value)}
                    className="h-9 w-14 p-1"
                  />
                  <Input
                    value={boardLight}
                    onChange={(e) => setBoardLight(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Dark square</label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={boardDark}
                    onChange={(e) => setBoardDark(e.target.value)}
                    className="h-9 w-14 p-1"
                  />
                  <Input
                    value={boardDark}
                    onChange={(e) => setBoardDark(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "sound" && (
            <div className="space-y-4">
              {SOUND_CONTROLS.map((control) => (
                <div key={control.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium">
                      {control.label}
                    </label>
                    <span className="w-10 text-right text-xs font-semibold tabular-nums text-muted-foreground">
                      {soundVolumes[control.id]}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={soundVolumes[control.id]}
                    onChange={(event) =>
                      handleVolumeChange(control.id, event.target.value)
                    }
                    className="w-full accent-primary"
                  />
                </div>
              ))}

              <p className="text-xs text-muted-foreground">
                Volumes apply to generated board sounds for moves, captures,
                checks, and game endings.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
