import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function suggestCategory(promptText: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest the best category for this AI image prompt: "${promptText}". Categories are: Trending, Fantasy, Cyberpunk, Nature, Anime, Realistic, Abstract. Return ONLY the category name.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { 
              type: Type.STRING,
              enum: ["Trending", "Fantasy", "Cyberpunk", "Nature", "Anime", "Realistic", "Abstract"]
            }
          },
          required: ["category"]
        }
      }
    });

    const data = JSON.parse(response.text);
    return data.category;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Fantasy"; // Fallback
  }
}
