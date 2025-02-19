import { useCallback, useEffect, useState } from 'react';
import type { OpenAI } from 'openai';

export function useGeneratedText(
  messages: OpenAI.ChatCompletionMessageParam[]
) {
  return useGenerated('/api/generate-text', JSON.stringify({ messages }));
}

export function useGeneratedImage(prompt: string | undefined) {
  return useGenerated(
    '/api/generate-image',
    prompt
      ? JSON.stringify({
          prompt,
        })
      : undefined
  );
}

function useGenerated(
  url: string,
  body: string | undefined
): [string | undefined, string | undefined, () => Promise<void>, boolean] {
  const [result, setResult] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isComplete, setIsComplete] = useState(false);

  const regenerate = useCallback(async () => {
    setResult(undefined);
    setErrorMessage(undefined);
    setIsComplete(false);

    if (!body) return;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      if (response.status !== 200) {
        const data = await response.json();
        throw (
          data.error?.message ||
          new Error(`Request failed with status ${response.status}`)
        );
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      let accumulatedContent = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Convert the chunk to text
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        // Process each SSE message
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const { content } = JSON.parse(data);
              accumulatedContent += content;
              setResult(accumulatedContent);
            } catch (e) {
              console.error('Error parsing SSE message:', e);
            }
          }
        }
      }

      reader.releaseLock();
      setIsComplete(true);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : String(e));
      setIsComplete(true);
    }
  }, [url, body]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  return [result, errorMessage, regenerate, isComplete];
}
