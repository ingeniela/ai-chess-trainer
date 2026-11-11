import { beforeEach, describe, expect, it, vi } from "vitest";

const generateContent = vi.fn();

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn(function GoogleGenAI() {
    this.models = { generateContent };
  }),
  createPartFromFunctionResponse: (id, name, response) => ({
    functionResponse: { id, name, response },
  }),
}));

const { sendGoogleChatMessage } = await import("@/lib/google-ai");

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("sendGoogleChatMessage", () => {
  beforeEach(() => generateContent.mockReset());

  it("requires an API key", async () => {
    await expect(
      sendGoogleChatMessage({ messages: [], fen: START, apiKey: "" }),
    ).rejects.toThrow(/API key/);
  });

  it("sends the coach persona as config.systemInstruction", async () => {
    generateContent.mockResolvedValue({ text: "Hello", functionCalls: [] });

    const result = await sendGoogleChatMessage({
      messages: [{ role: "user", content: "Hi" }],
      fen: START,
      apiKey: "test-key",
      elo: 1200,
    });

    expect(result.text).toBe("Hello");
    const request = generateContent.mock.calls[0][0];
    expect(request.systemInstruction).toBeUndefined();
    expect(request.config.systemInstruction).toContain(START);
    expect(request.config.systemInstruction).toContain("1200");
    expect(
      request.config.tools[0].functionDeclarations.length,
    ).toBeGreaterThan(0);
  });

  it("runs board actions requested by the model and continues the loop", async () => {
    generateContent
      .mockResolvedValueOnce({
        functionCalls: [{ name: "make_move", args: { san: "e4" }, id: "1" }],
        candidates: [{ content: { role: "model", parts: [{ text: "" }] } }],
      })
      .mockResolvedValueOnce({ text: "I played e4.", functionCalls: [] });

    const onAction = vi.fn();
    const result = await sendGoogleChatMessage({
      messages: [{ role: "user", content: "Show me e4" }],
      fen: START,
      apiKey: "test-key",
      onAction,
    });

    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: "MAKE_MOVE", san: "e4" }),
    );
    expect(result.actions).toHaveLength(1);
    expect(result.text).toBe("I played e4.");
    expect(generateContent).toHaveBeenCalledTimes(2);
  });
});
