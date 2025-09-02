/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });


// --- Helper Functions ---

/**
 * Creates the prompt for the image generation model.
 * @param outfitDescription The user-provided description for the outfit.
 * @returns The final prompt string.
 */
function getGenerationPrompt(outfitDescription: string): string {
    // If the user doesn't provide a description, use a safe and relevant default.
    const safeOutfitDescription = outfitDescription.trim() === '' 
        ? 'a traditional Vietnamese Ao Dai in a vibrant red color, with a large, stylized golden star emblem prominently on the chest' 
        : outfitDescription;

    return `A photorealistic image. The person from the uploaded photo is the main subject. The absolute highest priority is to perfectly preserve the exact face and likeness of the person from the uploaded photo. Every detail of their facial features—eyes, nose, mouth, bone structure—as well as their skin tone, and hair color and style, must be an identical match to the original. The final image must be unmistakably the same person. Do not alter their face in any way. The person's body shape should also be preserved.

The person is wearing: "${safeOutfitDescription}".

The person's pose should be inspiring and patriotic, such as a formal flag salute, a hand placed solemnly over the heart, or another pose that expresses pride and happiness.

The scene celebrates the 80th anniversary of Vietnam's National Day. The background should be a beautiful and heroic scene featuring the Vietnamese flag. The atmosphere is joyful and proud. DO NOT generate any text, letters, or numbers in the image. Focus on pure visual symbolism. The final image should be a high-quality, vibrant, and lifelike photograph.`;
}


/**
 * Processes the Gemini API response, extracting the image or throwing an error if none is found.
 * @param response The response from the generateContent call.
 * @returns A data URL string for the generated image.
 */
function processGeminiResponse(response: GenerateContentResponse): string {
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        return `data:${mimeType};base64,${data}`;
    }

    const textResponse = response.text;
    console.error("API did not return an image. Response:", textResponse);
    throw new Error(`The AI model responded with text instead of an image: "${textResponse || 'No text response received.'}"`);
}

/**
 * A wrapper for the Gemini API call that includes a retry mechanism for internal server errors.
 * @param imagePart The image part of the request payload.
 * @param textPart The text part of the request payload.
 * @returns The GenerateContentResponse from the API.
 */
async function callGeminiWithRetry(imagePart: object, textPart: object): Promise<GenerateContentResponse> {
    const maxRetries = 3;
    const initialDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts: [imagePart, textPart] },
            });
        } catch (error) {
            console.error(`Error calling Gemini API (Attempt ${attempt}/${maxRetries}):`, error);
            const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
            
            const isInternalError = errorMessage.includes('"code":500') || errorMessage.includes('INTERNAL');
            const isRateLimitError = errorMessage.includes('"code":429') || errorMessage.includes('RESOURCE_EXHAUSTED');

            if ((isInternalError || isRateLimitError) && attempt < maxRetries) {
                const delay = initialDelay * Math.pow(2, attempt - 1);
                console.log(`Retriable error detected. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
    throw new Error("Gemini API call failed after all retries.");
}


/**
 * Generates a celebration-styled image from a source image and a user description.
 * @param imageDataUrl A data URL string of the source image (e.g., 'data:image/png;base64,...').
 * @param outfitDescription The user's description of the desired outfit.
 * @returns A promise that resolves to a base64-encoded image data URL of the generated image.
 */
export async function generateCelebrationImage(imageDataUrl: string, outfitDescription: string): Promise<string> {
  const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
  if (!match) {
    throw new Error("Invalid image data URL format. Expected 'data:image/...;base64,...'");
  }
  const [, mimeType, base64Data] = match;

    const imagePart = {
        inlineData: { mimeType, data: base64Data },
    };

    try {
        const prompt = getGenerationPrompt(outfitDescription);
        const textPart = { text: prompt };
        
        console.log("Attempting generation with user-provided description...");
        const response = await callGeminiWithRetry(imagePart, textPart);
        
        return processGeminiResponse(response);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        console.error("An unrecoverable error occurred during image generation.", error);
        throw new Error(`The AI model failed to generate an image. Details: ${errorMessage}`);
    }
}
