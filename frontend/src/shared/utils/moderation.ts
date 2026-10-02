import leoProfanity from "leo-profanity";
import * as nsfwjs from "nsfwjs";

// Initialize profanity dictionaries (English + French)
leoProfanity.loadDictionary('en');
const enDict = leoProfanity.list();
leoProfanity.loadDictionary('fr');
leoProfanity.add(enDict);

// Add some custom words if needed
leoProfanity.add(['putain', 'merde', 'connard', 'salope', 'tg', 'ftg']);

/**
 * Checks if text contains profanity.
 * @returns {boolean} true if profanity is detected, false otherwise.
 */
export function containsProfanity(text: string): boolean {
  if (!text) return false;
  return leoProfanity.check(text);
}

/**
 * Cleans the text by masking profanity with asterisks.
 */
export function cleanProfanity(text: string): string {
  if (!text) return "";
  return leoProfanity.clean(text);
}

import axios from "axios";

/**
 * Analyzes an image file for NSFW content, Gore, Violence, and Offensive gestures.
 * Routes through our internal Next.js API to protect the Sightengine secrets.
 * @returns {Promise<boolean>} true if the image is considered inappropriate.
 */
export async function isImageNSFW(file: File): Promise<boolean> {
  // Only check actual images
  if (!file.type.startsWith("image/")) {
    return false;
  }

  try {
    const formData = new FormData();
    formData.append("media", file);

    const response = await axios.post("/api/moderate-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Our API returns { isBad: boolean, reason: string, raw: any }
    return response.data.isBad === true;
  } catch (error) {
    console.error("Image moderation API failed", error);
    // If the API fails (e.g. missing keys or network error), 
    // we default to allowing the image to not block the user.
    return false;
  }
}
