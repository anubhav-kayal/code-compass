export class ChatStream {
  private abortController: AbortController | null = null;

  async streamMessage(
    repoId: string,
    message: string,
    conversationId: string | undefined,
    onChunk: (text: string) => void,
    onDone: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    this.abortController = new AbortController();

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoId, message, conversationId }),
        signal: this.abortController.signal,
      });

      if (!response.ok) throw new Error("Stream request failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        onChunk(text);
      }

      onDone();
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        onError(error);
      }
    }
  }

  cancel(): void {
    this.abortController?.abort();
  }
}
