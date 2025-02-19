import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI, { ClientOptions } from 'openai';

const configuration: ClientOptions = {
  apiKey: process.env.OPENAI_API_KEY,
};
const openai = new OpenAI(configuration);

export default async function (
  req: NextApiRequest,
  res: NextApiResponse<{ result: string } | { error: { message: string } }>
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

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: req.body.messages,
    });
    res
      .status(200)
      .json({ result: completion.choices[0].message.content || '' });
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
