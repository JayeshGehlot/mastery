import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion } from "../types";

// Initialize the client with the provided API Key
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAdaptiveQuiz = async (topic: string, difficulty: number): Promise<QuizQuestion[]> => {
  try {
    // Switching to gemini-2.0-flash-exp for better stability in this environment
    const model = "gemini-2.0-flash-exp"; 
    
    const prompt = `Generate a 5-question multiple-choice quiz about "${topic}". 
    The difficulty level is ${difficulty} out of 100. 
    100 is expert/university level, 0 is beginner/elementary level.
    Adjust the complexity of the questions strictly according to this difficulty.
    Provide 4 options for each question.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswerIndex: { 
                type: Type.INTEGER,
                description: "The index (0-3) of the correct option." 
              }
            },
            required: ["question", "options", "correctAnswerIndex"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as QuizQuestion[];
    }
    
    throw new Error("No text returned from AI");

  } catch (error) {
    console.error("AI Generation Error:", error);
    // Fallback static quiz if AI fails (for stability)
    return [
      {
        question: `(Fallback) What is a key concept in ${topic}?`,
        options: ["Concept A", "Concept B", "Concept C", "Concept D"],
        correctAnswerIndex: 0
      }
    ];
  }
};