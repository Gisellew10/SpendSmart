import Budgeting from "../models/Budgeting.mjs";
import Book from "../models/Book.mjs";
import User from "../models/User.mjs";

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "spendsmart090@gmail.com",
    pass: "xeou lnoa dijy ubpl",
  },
});

export const createBudgeting = async (req, res) => {
  try {
    if (!("budgetingType" in req.body))
      return res.status(400).end("budgeting type is missing");
    if (!("goalAmount" in req.body))
      return res.status(400).end("limit of budget / target of goal is missing");
    if (!("refreshTime" in req.body))
      return res.status(400).end("type for refresh time is missing");
    let budgetingType = req.body.budgetingType;
    let goalAmount = req.body.goalAmount;
    let refreshTime = req.body.refreshTime;

    if (!("relatedBookId" in req.body))
      return res.status(400).end("relatedBookId is missing");

    const relatedBookId = req.body.relatedBookId;
    const userId = req.session.passport.user;
    const book = await Book.findById(relatedBookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (book.ownerId != userId) {
      return res.status(403).end("forbidden");
    }

    const deletedBudgeting = await Budgeting.findOneAndDelete({
      budgetingType: budgetingType,
      relatedBookId: relatedBookId,
    });

    const date = new Date();
    const BudgetingDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0),
    );

    const newBudgeting = new Budgeting({
      budgetingType: budgetingType,
      goalAmount: goalAmount,
      refreshTime: refreshTime,
      relatedBookId: relatedBookId,
      dateCreated: BudgetingDate,
    });
    await newBudgeting.save();
    res.status(201).json({ newBudgeting });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBudget = async (req, res) => {
  try {
    const relatedBookId = req.params.relatedBookId;
    const book = await Book.findById(relatedBookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found", budget: null });
    }

    const userId = req.session.passport.user;
    if (book.ownerId != userId) {
      return res
        .status(403)
        .json({ message: "Book does not belong to user", budget: null });
    }

    const budget = await Budgeting.findOne({
      relatedBookId: relatedBookId,
      budgetingType: "Budget",
    }).sort({ dateCreated: -1 });
    res.status(201).json({ budget });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getGoal = async (req, res) => {
  try {
    const relatedBookId = req.params.relatedBookId;
    const book = await Book.findById(relatedBookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found", goal: null });
    }

    const userId = req.session.passport.user;
    if (book.ownerId != userId) {
      return res
        .status(403)
        .json({ message: "Book does not belong to user", goal: null });
    }

    const goal = await Budgeting.findOne({
      relatedBookId: relatedBookId,
      budgetingType: "Goal",
    }).sort({ dateCreated: -1 });
    res.status(201).json({ goal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendHalfBudget = async (user, budget) => {
  const mailOptions = {
    from: "spendsmart090@gmail.com",
    to: user.email,
    subject: `Half Way Notification for Budget: ${budget._id}`,
    text: `Dear ${user.name},\n\nPlease beware that half or more of the budget has been used.\n\nDetails of the Budget\nCurrent Amount: ${budget.currentAmount}\nBudget Target: ${budget.goalAmount}\n\nFor any further support please contact spendsmart090@gmail.com`,
  };
  transporter.sendMail(mailOptions, function (error) {
    if (error) {
      console.error(error);
    }
  });
};

const sendAlmostOverBudget = async (user, budget) => {
  const mailOptions = {
    from: "spendsmart090@gmail.com",
    to: user.email,
    subject: `Overspend Warning Notification for Budget: ${budget._id}`,
    text: `Dear ${user.name},\n\nPlease beware that the budget is about to reach its limit!\n\nDetails of the Budget\nCurrent Amount: ${budget.currentAmount}\nBudget Target: ${budget.goalAmount}\n\nFor any further support please contact spendsmart090@gmail.com`,
  };
  transporter.sendMail(mailOptions, function (error) {
    if (error) {
      console.error(error);
    }
  });
};

export const updateBudgetingsAmount = async ({
  changeAmount,
  relatedBookId,
  userId,
  dateOfTransaction,
  updateType,
}) => {
  try {
    if (
      changeAmount === undefined ||
      !relatedBookId ||
      !userId ||
      !dateOfTransaction ||
      !updateType
    ) {
      throw new Error("Missing required parameters");
    }

    const book = await Book.findById(relatedBookId);
    if (!book) {
      throw new Error("Book not found");
    }
    if (book.ownerId.toString() !== userId) {
      throw new Error("Forbidden");
    }

    const txnDate = new Date(dateOfTransaction);

    let budgetingType;
    if (updateType === "budget") {
      budgetingType = "Budget";
    } else if (updateType === "goal") {
      budgetingType = "Goal";
    } else {
      throw new Error("Invalid updateType. Must be 'budget' or 'goal'.");
    }

    let old_value = -1;

    const budgeting = await Budgeting.findOne({
      relatedBookId: relatedBookId,
      budgetingType: budgetingType,
      dateCreated: { $lte: txnDate },
    }).sort({ dateCreated: -1 });

    if (!budgeting) {
      return;
    }

    old_value = budgeting.currentAmount;

    budgeting.currentAmount += changeAmount;
    await budgeting.save();

    if (updateType === "budget") {
      const old_percent = (old_value / budgeting.goalAmount) * 100;
      const new_percent =
        (budgeting.currentAmount / budgeting.goalAmount) * 100;

      if (new_percent >= 50 && new_percent < 90 && old_percent < 50) {
        const user = await User.findById(userId);
        await sendHalfBudget(user, budgeting);
      } else if (new_percent >= 90 && new_percent < 100 && old_percent < 90) {
        const user = await User.findById(userId);
        await sendAlmostOverBudget(user, budgeting);
      }
    }

    return { message: "Update Completed" };
  } catch (error) {
    console.error("Error in updateBudgetingsAmount:", error.message);
    throw error;
  }
};

export const deleteBudgeting = async (req, res) => {
  try {
    if (!("relatedBookId" in req.body))
      return res.status(400).end("relatedBookId is missing");

    const relatedBookId = req.body.relatedBookId;
    const userId = req.session.passport.user;
    const book = await Book.findById(relatedBookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (book.ownerId != userId) {
      return res.status(403).end("forbidden");
    }

    const budgetingId = req.params.budgetingId;
    const budgeting = await Budgeting.findByIdAndDelete(budgetingId);
    if (!budgeting) {
      return res.status(405).json({ message: "Budgeting not found" });
    }
    res.status(200).json({ message: "Budgeting deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
