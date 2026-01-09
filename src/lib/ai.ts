
export interface GeneratedCard {
  front: string;
  back: string;
  pronunciation: string;
  example: string;
  exampleMeaning: string;
}

export interface EvaluationResult {
  score: number;
  feedback: string;
}

export const evaluatePronunciation = async (
  apiKey: string,
  targetWord: string,
  userSpeech: string
): Promise<EvaluationResult> => {
  const cleanKey = apiKey.trim();

  const prompt = `Compare the target Korean word/phrase "${targetWord}" with what the user actually said: "${userSpeech}".
  
  Provide a JSON response with:
  - "score": A number between 0 and 100 representing how close the user's speech was to the target. If it's a perfect match or very close, give 100. If it's completely different, give 0.
  - "feedback": A brief, encouraging sentence in English explaining the difference (if any) or praising the accuracy.

  Strictly return valid JSON only.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content || '{}';
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    
    return JSON.parse(cleanText) as EvaluationResult;
  } catch (error) {
    console.error('Error evaluating pronunciation:', error);
    throw error;
  }
};

export const generateFlashcards = async (
  apiKey: string,
  topic: string,
  count: number = 20
): Promise<GeneratedCard[]> => {
  const cleanKey = apiKey.trim();

  const prompt = `Generate a JSON array of ${count} unique Korean vocabulary flashcards for the topic or level: "${topic}". 
  
  Each object must have the following fields:
  - "front": The Korean word or phrase.
  - "back": The English meaning.
  - "pronunciation": The Romanized pronunciation.
  - "example": A simple example sentence in Korean.
  - "exampleMeaning": The English translation of the example sentence.

  Ensure the output is strictly a valid JSON array. Do not include any markdown formatting (like \`\`\`json) or explanation text. Just the raw JSON array.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API Error:', errorData);
      
      if (response.status === 401) {
        throw new Error('Invalid API Key. Please check your key and try again.');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded or insufficient quota. Please check your OpenAI account billing.');
      }
      
      throw new Error(errorData.error?.message || `OpenAI API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content || '[]';
    
    // Clean up markdown code blocks if present (just in case)
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    
    const cards = JSON.parse(cleanText) as GeneratedCard[];
    return cards;
  } catch (error) {
    console.error('Error generating flashcards:', error);
    
    // Handle network errors (often caused by CORS/Auth issues in browser)
    if (error instanceof TypeError && (error.message.includes('Load failed') || error.message.includes('Failed to fetch'))) {
      throw new Error('Connection failed. This is often caused by an invalid API Key (401 Unauthorized). Please check your key.');
    }
    
    throw error; // Re-throw the specific error message
  }
};
