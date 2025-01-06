import CustomLabel from "../models/CustomLabel.mjs";
import mongoose from "mongoose";

export const getCustomLabels = async (req, res) => {
  try {
    const userId = req.session.passport.user;
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User ID not found." });
    }

    const { type } = req.query;

    if (!type || (type !== "Income" && type !== "Expense")) {
      return res
        .status(400)
        .json({ message: "Invalid or missing type parameter." });
    }

    const customLabels = await CustomLabel.find({ ownerId: userId, type });
    res.json({ customLabels });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addCustomLabel = async (req, res) => {
  try {
    const userId = req.session.passport.user;
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User ID not found." });
    }

    const { labelName, type } = req.body;
    if (!labelName || !type) {
      return res
        .status(400)
        .json({ message: "Label name and type are required." });
    }

    if (type !== "Income" && type !== "Expense") {
      return res
        .status(400)
        .json({ message: "Type must be either 'Income' or 'Expense'." });
    }

    const existingLabel = await CustomLabel.findOne({
      ownerId: userId,
      labelName,
      type,
    });
    if (existingLabel) {
      return res.status(400).json({ message: "Label already exists." });
    }

    const customLabel = new CustomLabel({
      ownerId: userId,
      labelName,
      type,
    });

    await customLabel.save();
    res.status(201).json({ customLabel });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCustomLabel = async (req, res) => {
  try {
    const userId = req.session.passport.user;
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User ID not found." });
    }

    const { labelName, type } = req.body;
    if (!labelName || !type) {
      return res
        .status(400)
        .json({ message: "Label name and type are required." });
    }

    const deletedLabel = await CustomLabel.findOneAndDelete({
      ownerId: userId,
      labelName,
      type,
    });
    if (!deletedLabel) {
      return res.status(404).json({ message: "Custom label not found." });
    }

    res.status(200).json({ message: "Custom label deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
