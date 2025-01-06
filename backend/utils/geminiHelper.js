import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
const MODEL_ID = process.env.MODEL_ID || "gemini-1.5-flash";

const genAI = new GoogleGenerativeAI(API_KEY);

const parseDate = (dateString) => {
  if (!dateString) {
    return "2024-01-01";
  }

  const hasYear = /\b(19|20)\d{2}\b/.test(dateString);

  let date;
  if (hasYear) {
    date = new Date(dateString);
  } else {
    date = new Date(`${dateString} 2024`);
  }

  if (!isNaN(date.getTime())) {
    let [year, month, day] = [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
    ];
    month = month < 10 ? `0${month}` : month;
    day = day < 10 ? `0${day}` : day;
    return `${year}-${month}-${day}`;
  } else {
    return "2024-01-01";
  }
};

const parseRecommendations = (input) => {
  // Match and capture insight-recommendation pairs using regex
  const regex =
    /insight:\s*{?(.*?)}?\n*\s*recommendation:\s*{?(.*?)}?(?=insight:|$)/gs;
  const matches = [...input.matchAll(regex)];

  // Parse the matches into an array of objects
  const results = matches.map((match) => ({
    insight: match[1].trim(),
    recommendation: match[2].trim(),
  }));

  return results;
};

const processOcrDataWithGemini = async ({ text, prompt }) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_ID });
    const fullPrompt = `${prompt}\n\n${text}`;
    const result = await model.generateContent(fullPrompt);

    let generatedText = await result.response.text();
    console.log("Raw generated text from AI:", generatedText);

    generatedText = generatedText.replace(/```json|```/g, "").trim();

    let parsedData;
    try {
      parsedData = JSON.parse(generatedText);
    } catch (error) {
      console.error("Error parsing generated text as JSON:", error);
      throw new Error("Failed to parse AI response as JSON");
    }

    parsedData = parsedData.map((transaction) => {
      transaction.date = parseDate(transaction.date);
      return transaction;
    });

    return parsedData;
  } catch (error) {
    console.error("Error in processOcrDataWithGemini:", error.message);
    throw new Error("Failed to process data with Gemini AI");
  }
};

export const recommendationsWithGemini = async (text, prompt) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_ID });
    const fullPrompt = `${prompt}\n\n${text}`;
    const result = await model.generateContent(fullPrompt);

    const generatedText = await result.response.text();
    const recommendations = parseRecommendations(generatedText);

    return recommendations;
  } catch (error) {
    console.error("Error in recommendationsWithGemini:", error.message);
    throw new Error("Failed to process data with Gemini AI");
  }
};

export default processOcrDataWithGemini;
