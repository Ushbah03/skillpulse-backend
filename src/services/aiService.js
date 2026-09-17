import Groq from 'groq-sdk';

let groqClient = null;

const getGroqClient = () => {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey && apiKey.startsWith('gsk_')) {
      groqClient = new Groq({ apiKey });
    }
  }
  return groqClient;
};

/**
 * Core Multi-Provider AI Generation Service
 * Supports: Groq LPU Engine, OpenAI (GPT-4o), Anthropic (Claude 3.5), Google Gemini
 */
export const generateAiCompletion = async ({
  prompt,
  systemPrompt = 'You are SkillPulse AI, an objective talent assessment engine.',
  model = process.env.GROQ_MODEL || 'groq/compound',
  temperature = 0.2,
  maxTokens = 2048,
  provider = 'Groq'
}) => {
  try {
    const isGroq = provider.toLowerCase().includes('groq') || model.startsWith('groq/') || model.startsWith('llama-');
    const isOpenAI = provider.toLowerCase().includes('openai') || model.startsWith('gpt-');
    const isClaude = provider.toLowerCase().includes('anthropic') || provider.toLowerCase().includes('claude') || model.startsWith('claude-');
    const isGemini = provider.toLowerCase().includes('gemini') || model.startsWith('gemini-');
    const isOpenRouter = provider.toLowerCase().includes('openrouter') || model.includes(':free') || model.startsWith('openrouter/') || model.startsWith('meta-llama/') || model.startsWith('deepseek/');

    // 1. Groq LPU Engine (Default 100% Free)
    if (isGroq && !isOpenRouter) {
      const client = getGroqClient();
      if (!client) {
        throw new Error('Groq API Key (GROQ_API_KEY) is missing in backend .env');
      }

      const chatCompletion = await client.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: model || 'groq/compound',
        temperature,
        max_tokens: maxTokens
      });

      const textResponse = chatCompletion.choices[0]?.message?.content || '';
      return {
        success: true,
        model,
        provider: 'Groq LPU Engine',
        content: textResponse,
        usage: chatCompletion.usage
      };
    }

    // 2. OpenAI Provider (GPT-4o)
    if (isOpenAI) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey || apiKey.includes('mock')) {
        throw new Error('OpenAI API Key (OPENAI_API_KEY) is missing or unconfigured.');
      }
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature,
          max_tokens: maxTokens
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'OpenAI API request failed');

      return {
        success: true,
        model: model || 'gpt-4o',
        provider: 'OpenAI API',
        content: data.choices[0]?.message?.content || '',
        usage: data.usage
      };
    }

    // 3. Anthropic Claude Provider
    if (isClaude) {
      const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
      if (!apiKey) {
        throw new Error('Anthropic Claude API Key (ANTHROPIC_API_KEY) is missing or unconfigured.');
      }
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model || 'claude-3-5-sonnet-20240620',
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Anthropic API request failed');

      return {
        success: true,
        model: model || 'claude-3-5-sonnet',
        provider: 'Anthropic Claude',
        content: data.content[0]?.text || '',
        usage: data.usage
      };
    }

    // 4. Google Gemini Provider
    if (isGemini) {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;
      if (!apiKey) {
        throw new Error('Google Gemini API Key (GEMINI_API_KEY) is missing or unconfigured.');
      }
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-1.5-pro'}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }],
          generationConfig: { temperature, maxOutputTokens: maxTokens }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Google Gemini API request failed');

      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return {
        success: true,
        model: model || 'gemini-1.5-pro',
        provider: 'Google Gemini',
        content: textResponse
      };
    }

    // 5. OpenRouter Gateway Provider (Free Models & Open-Source)
    if (isOpenRouter) {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey || !apiKey.startsWith('sk-or-v1-')) {
        throw new Error('OpenRouter API Key (OPENROUTER_API_KEY) is missing or invalid.');
      }
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'SkillPulse AI'
        },
        body: JSON.stringify({
          model: model || 'meta-llama/llama-3.3-70b-instruct:free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature,
          max_tokens: maxTokens
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'OpenRouter API request failed');

      return {
        success: true,
        model: model || 'meta-llama/llama-3.3-70b-instruct:free',
        provider: 'OpenRouter Gateway',
        content: data.choices[0]?.message?.content || '',
        usage: data.usage
      };
    }

    throw new Error(`Unsupported AI Provider or Model: ${provider} / ${model}`);
  } catch (error) {
    console.error('Multi-Provider AI Service Error:', error.message);
    return {
      success: false,
      error: error.message,
      content: null
    };
  }
};

/**
 * AI Skill Gap Analysis
 */
export const analyzeSkillGapAi = async (currentSkills = [], requiredSkills = []) => {
  const prompt = "Analyze skill gaps between employee current skills: " + JSON.stringify(currentSkills) + " and required target role skills: " + JSON.stringify(requiredSkills) + ". Return a JSON object with matchScore, criticalGaps, and recommendations.";

  const response = await generateAiCompletion({
    prompt,
    systemPrompt: 'You are an HR Talent AI Analyst. Return valid JSON only.'
  });

  if (response.success && response.content) {
    try {
      return { success: true, data: JSON.parse(response.content) };
    } catch {
      return { success: true, data: response.content };
    }
  }
  return response;
};

export default {
  generateAiCompletion,
  analyzeSkillGapAi
};
