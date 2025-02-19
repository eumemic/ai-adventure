import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI, { ClientOptions } from 'openai';

const configuration: ClientOptions = {
  apiKey: process.env.OPENAI_API_KEY,
};
const openai = new OpenAI(configuration);

export default async function (
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message:
          'OpenAI API key not configured, please follow instructions in README.md',
      },
    });
    return;
  }

  // Set headers for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: req.body.messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      console.error(error.status, error.error);
      res.status(error.status).json({
        error: {
          message: error.message,
        },
      });
    } else {
      console.error(`Error with OpenAI API request: ${error}`);
      res.status(500).json({
        error: {
          message: 'An error occurred during your request.',
        },
      });
    }
  }
}
