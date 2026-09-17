import fetch from 'node-fetch';

/**
 * Generates live MCQs using Gemini API (gemini-3.6-flash)
 */
export const generateAIQuestionsForSkill = async (skillTitle, category, difficulty = 'INTERMEDIATE', count = 5) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('GEMINI_API_KEY is missing in backend .env, using local dynamic questions');
    return null;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

  const prompt = `You are an expert technical assessor for SkillPulse AI. 
Generate exactly ${count} multiple-choice questions to evaluate an employee's proficiency in the skill "${skillTitle}" (Domain/Category: "${category}", Difficulty Level: "${difficulty}").

Return ONLY a raw JSON array of objects. Do not include markdown code block formatting like \`\`\`json.
Each object must have this exact structure:
[
  {
    "id": 1,
    "question": "Clear, practical technical question string",
    "options": [
      "Option A text",
      "Option B text",
      "Option C text",
      "Option D text"
    ],
    "correct": 0
  }
]
Where "correct" is an integer index (0, 1, 2, or 3) indicating the zero-based index of the correct answer in the "options" array.`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    const data = await response.json();

    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      let rawText = data.candidates[0].content.parts[0].text;
      // Clean markdown fenced blocks if present
      rawText = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();

      const questions = JSON.parse(rawText);
      if (Array.isArray(questions) && questions.length > 0) {
        console.log(`✅ Live Gemini AI generated ${questions.length} questions for skill: ${skillTitle}`);
        return questions;
      }
    }
  } catch (err) {
    console.error('Gemini API Question Generation error:', err);
  }

  return null;
};
