import Tesseract from "tesseract.js";
import fs from "fs";
import processOcrDataWithGemini from "../utils/geminiHelper.js";
import Transaction from "../models/Transaction.mjs";

export const uploadAndExtract = async (req, res) => {
  try {
    const ownerId = req.session.passport.user;

    if (!ownerId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User ID not found." });
    }

    const file = req.file;
    if (!file) {
      console.error("No file uploaded");
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log("Starting OCR on file:", file.path);
    const extractedText = await Tesseract.recognize(file.path, "eng", {
      logger: (m) => console.log("Tesseract log:", m),
    });

    console.log("OCR extraction completed.");

    const prompt = `Given the following OCR results of bank statements, extract each transaction and provide the corresponding vendor, date, and amount.
      - If the text is not from a bank statement, ignore the text/entry.
      - If the text is not from a transaction, ignore the entry.
      - If all text is not from a bank statement, return an empty array.
      - Exclude any pending amounts and provide only numerical values and take their absolute value only (not showing negative values).
      - Check if the date for each transaction exists. If the date is missing, set it to "2024/01/01" by default.
      - If the year is missing from the date, use "2024" as the default year.
      - If the month is missing, use "01" as the default month.
      - If the day is missing, use "01" as the default day.
      - If there are multiple dates, only keep the first one.
      
      **Important**: Provide the results in **valid JSON format** as an array of objects with keys **"vendor"**, **"amount"**, and **"date"**. Do not include any additional text or explanations other than the JSON. Ensure the JSON is properly formatted and parsable.
      `;

    const formattedData = await processOcrDataWithGemini({
      text: extractedText.data.text,
      prompt: prompt,
    });

    if (
      !formattedData ||
      !Array.isArray(formattedData) ||
      formattedData.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Uploaded image is not a bank statement" });
    }

    res.status(200).json({ finalData: formattedData });
  } catch (error) {
    console.error("Error in OCR processing:", error);
    res
      .status(500)
      .json({ message: "Failed to process OCR", error: error.message });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log("Temporary file deleted.");
    }
  }
};

export const saveTransactions = async (req, res) => {
  try {
    const ownerId = req.session.passport.user;

    if (!ownerId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User ID not found." });
    }

    const { transactions } = req.body;
    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({ message: "Invalid transactions data" });
    }

    const savedTransactions = await Transaction.insertMany(transactions);
    res
      .status(201)
      .json({ message: "Transactions saved successfully", savedTransactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
