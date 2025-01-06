import Transaction from "../models/Transaction.mjs";
import Book from "../models/Book.mjs";
import { updateBudgetingsAmount } from "./budgetingController.mjs";
import { recommendationsWithGemini } from "../utils/geminiHelper.js";
import mongoose from "mongoose";

export const createTransaction = async (req, res) => {
  try {
    const userId = req.session.passport.user;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User ID not found." });
    }

    const {
      relatedBookId,
      category,
      customLabels,
      vendor,
      amount,
      dateOfTransaction,
    } = req.body;

    if (
      !relatedBookId ||
      !category ||
      amount === undefined ||
      !dateOfTransaction
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be filled." });
    }

    const [year, month, day] = dateOfTransaction.split("-").map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, 12));

    const book = await Book.findOne({ _id: relatedBookId });

    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }

    if (book.ownerId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden: You do not own this book." });
    }

    const transaction = new Transaction({
      ownerId: userId,
      relatedBookId,
      category,
      tags: customLabels && customLabels.length > 0 ? customLabels : ["none"],
      vendor,
      amount,
      dateOfTransaction: utcDate,
    });
    await transaction.save();

    try {
      if (amount < 0) {
        const budgetUpdate = await updateBudgetingsAmount({
          changeAmount: Math.abs(amount),
          relatedBookId,
          userId,
          dateOfTransaction,
          updateType: "budget",
        });

        const goalUpdate = await updateBudgetingsAmount({
          changeAmount: amount,
          relatedBookId,
          userId,
          dateOfTransaction,
          updateType: "goal",
        });
      } else if (amount > 0) {
        const goalUpdate = await updateBudgetingsAmount({
          changeAmount: amount,
          relatedBookId,
          userId,
          dateOfTransaction,
          updateType: "goal",
        });
      }
    } catch (error) {
      console.error("Error updating budgetings:", error.message);
    }

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTransactionsBulk = async (req, res) => {
  try {
    const userId = req.session.passport.user;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User ID not found." });
    }

    const transactionsData = req.body.transactions;

    if (
      !transactionsData ||
      !Array.isArray(transactionsData) ||
      transactionsData.length === 0
    ) {
      return res.status(400).json({ message: "No transactions provided." });
    }

    const relatedBookIds = [
      ...new Set(transactionsData.map((data) => data.relatedBookId)),
    ];

    const books = await Book.find({
      _id: { $in: relatedBookIds },
      ownerId: userId,
    });

    if (books.length !== relatedBookIds.length) {
      return res.status(403).json({
        message:
          "Forbidden: One or more books are not owned by the user or do not exist.",
      });
    }

    const transactions = transactionsData.map((data, index) => {
      const {
        relatedBookId,
        category,
        tags,
        vendor,
        amount,
        dateOfTransaction,
      } = data;

      if (
        !relatedBookId ||
        !category ||
        amount === undefined ||
        !dateOfTransaction
      ) {
        throw new Error(
          `All required fields must be filled for each transaction. Error at index ${index}.`,
        );
      }

      const [year, month, day] = dateOfTransaction.split("-").map(Number);
      const utcDate = new Date(Date.UTC(year, month - 1, day, 12));
      if (
        isNaN(year) ||
        isNaN(month) ||
        isNaN(day) ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
      ) {
        throw new Error(
          `Invalid date format for transaction at index ${index}. Expected YYYY-MM-DD.`,
        );
      }

      // Prepare the transaction object
      return {
        ownerId: userId,
        relatedBookId,
        category,
        tags: tags && Array.isArray(tags) && tags.length > 0 ? tags : ["none"],
        vendor,
        amount,
        dateOfTransaction: utcDate,
      };
    });

    const createdTransactions = await Transaction.insertMany(transactions);

    const transactionsByBookAndType = {};

    transactions.forEach((transaction) => {
      const { relatedBookId, amount, dateOfTransaction } = transaction;

      if (amount === 0) return;

      if (!transactionsByBookAndType[relatedBookId]) {
        transactionsByBookAndType[relatedBookId] = {};
      }

      if (amount < 0) {
        if (!transactionsByBookAndType[relatedBookId].budget) {
          transactionsByBookAndType[relatedBookId].budget = {
            totalChangeAmount: 0,
            latestDate: new Date(0),
          };
        }
        if (!transactionsByBookAndType[relatedBookId].goal) {
          transactionsByBookAndType[relatedBookId].goal = {
            totalChangeAmount: 0,
            latestDate: new Date(0),
          };
        }

        transactionsByBookAndType[relatedBookId].budget.totalChangeAmount +=
          Math.abs(amount);
        transactionsByBookAndType[relatedBookId].goal.totalChangeAmount +=
          amount;

        if (
          dateOfTransaction >
          transactionsByBookAndType[relatedBookId].budget.latestDate
        ) {
          transactionsByBookAndType[relatedBookId].budget.latestDate =
            dateOfTransaction;
        }
        if (
          dateOfTransaction >
          transactionsByBookAndType[relatedBookId].goal.latestDate
        ) {
          transactionsByBookAndType[relatedBookId].goal.latestDate =
            dateOfTransaction;
        }
      } else if (amount > 0) {
        if (!transactionsByBookAndType[relatedBookId].goal) {
          transactionsByBookAndType[relatedBookId].goal = {
            totalChangeAmount: 0,
            latestDate: new Date(0),
          };
        }

        transactionsByBookAndType[relatedBookId].goal.totalChangeAmount +=
          amount;

        if (
          dateOfTransaction >
          transactionsByBookAndType[relatedBookId].goal.latestDate
        ) {
          transactionsByBookAndType[relatedBookId].goal.latestDate =
            dateOfTransaction;
        }
      }
    });

    for (const [relatedBookId, types] of Object.entries(
      transactionsByBookAndType,
    )) {
      for (const [type, data] of Object.entries(types)) {
        const { totalChangeAmount, latestDate } = data;

        if (totalChangeAmount === 0) continue;

        try {
          await updateBudgetingsAmount({
            changeAmount: totalChangeAmount,
            relatedBookId,
            userId,
            dateOfTransaction: latestDate,
            updateType: type,
          });
        } catch (error) {
          console.error(
            `Error updating ${type} for book ${relatedBookId}:`,
            error.message,
          );
        }
      }
    }

    res.status(201).json(createdTransactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const userId = req.session.passport.user;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User ID not found." });
    }

    const transactions = await Transaction.find({ ownerId: userId }).populate(
      "relatedBookId",
    );
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const userId = req.session.passport.user;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User ID not found." });
    }

    const { transactionId } = req.params;

    const transaction = await Transaction.findOne({
      _id: transactionId,
      ownerId: userId,
    });

    if (!transaction) {
      return res
        .status(404)
        .json({ message: "Transaction not found or not owned by user" });
    }

    const isExpense = transaction.amount < 0;
    const isIncome = transaction.amount > 0;

    let budgetChangeAmount = 0;
    let goalChangeAmount = 0;

    if (isExpense) {
      budgetChangeAmount = -Math.abs(transaction.amount);
      goalChangeAmount = -transaction.amount;
    } else if (isIncome) {
      goalChangeAmount = -transaction.amount;
    }

    await Transaction.findOneAndDelete({
      _id: transactionId,
      ownerId: userId,
    });

    if (budgetChangeAmount !== 0) {
      try {
        await updateBudgetingsAmount({
          changeAmount: budgetChangeAmount,
          relatedBookId: transaction.relatedBookId,
          userId,
          dateOfTransaction: transaction.dateOfTransaction,
          updateType: "budget",
        });
      } catch (error) {
        console.error("Error updating budget after deletion:", error.message);
      }
    }

    if (goalChangeAmount !== 0) {
      try {
        await updateBudgetingsAmount({
          changeAmount: goalChangeAmount,
          relatedBookId: transaction.relatedBookId,
          userId,
          dateOfTransaction: transaction.dateOfTransaction,
          updateType: "goal",
        });
      } catch (error) {
        console.error("Error updating goal after deletion:", error.message);
      }
    }

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    const { range } = req.query || "30";

    if (range !== "30" && range !== "7") {
      return res.status(400).json({ message: "Invalid range." });
    }

    const userId = req.session.passport.user;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User ID not found." });
    }

    const targetBook = await Book.findOne({ _id: id, ownerId: userId });
    if (!targetBook) {
      return res.status(404).json({ message: "Book not found." });
    }

    const date_previous = new Date(
      Date.now() - parseInt(range) * 24 * 60 * 60 * 1000,
    );
    const transactions = await Transaction.find({
      ownerId: userId,
      relatedBookId: id,
      dateOfTransaction: { $gte: date_previous },
    });

    const data = {
      income: { labels: [], values: [] },
      expenses: { labels: [], values: [] },
    };

    transactions.forEach((transaction) => {
      const category = transaction.amount >= 0 ? "income" : "expenses";
      const categoryIndex = data[category].labels.indexOf(transaction.category);
      if (categoryIndex === -1) {
        data[category].labels.push(transaction.category);
        data[category].values.push(transaction.amount);
      } else {
        data[category].values[categoryIndex] += transaction.amount;
      }
    });

    const formattedData = {
      income: {
        labels: data.income.labels,
        values: data.income.values,
      },
      expenses: {
        labels: data.expenses.labels,
        values: data.expenses.values,
      },
    };

    res.json({ formattedData });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard data." });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    const range = 30;

    const userId = req.session.passport.user;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User ID not found." });
    }

    const targetBook = await Book.findOne({ _id: id, ownerId: userId });
    if (!targetBook) {
      return res.status(404).json({ message: "Book not found." });
    }

    const date_previous = new Date(Date.now() - range * 24 * 60 * 60 * 1000);
    const transactions = await Transaction.find(
      {
        ownerId: userId,
        relatedBookId: id,
        dateOfTransaction: { $gte: date_previous },
      },
      {
        category: 1,
        vendor: 1,
        amount: 1,
        dateOfTransaction: 1,
        _id: 0,
      },
    );

    let count = 0;

    let text = transactions
      .map((transaction) => {
        count++;
        return `${transaction.dateOfTransaction} - ${transaction.vendor} - ${transaction.category} - ${transaction.amount}`;
      })
      .join("\n");

    if (count < 5) {
      return res
        .status(400)
        .json({
          message:
            "Not enough transactions in the past 30 days for recommendations.",
        });
    }

    const prompt =
      "Given the following transaction details, give some insight regarding the spending patterns, and some advice in improving it, much like a spendings report. For each of your insights, provide some advice on it. Do not give an overall recommendation. This is meant to be used for a budgeting application to tell the users about their spendings. Format your responses STRICTLY to: insight: {insight}, recommendation: {recommendation}, [more insights and recommendations] . Give me the 3 most significant insights only, with their associated recommendations. For recommendations, do not talk about any tracking, as the users are using some tracking application already. Here are the transactions:";

    const formattedRecommendations = await recommendationsWithGemini(
      text,
      prompt,
    );

    res.status(200).json({ message: formattedRecommendations });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch recommendation data." });
  }
};

export const getTransactionsByBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { page = 1, limit = 8 } = req.query;

    const userId = req.session.passport.user;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User ID not found." });
    }

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid bookId format." });
    }

    const targetBook = await Book.findOne({
      _id: new mongoose.Types.ObjectId(bookId),
      ownerId: new mongoose.Types.ObjectId(userId),
    });
    if (!targetBook) {
      return res.status(404).json({ message: "Book not found." });
    }

    const filter = {
      ownerId: new mongoose.Types.ObjectId(userId),
      relatedBookId: new mongoose.Types.ObjectId(bookId),
    };

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (isNaN(pageNumber) || pageNumber < 1) {
      return res.status(400).json({ message: "Invalid page number." });
    }

    if (isNaN(limitNumber) || limitNumber < 1) {
      return res.status(400).json({ message: "Invalid limit number." });
    }

    const totalTransactions = await Transaction.countDocuments(filter);
    const totalPages = Math.ceil(totalTransactions / limitNumber) || 1;
    const currentPage = Math.min(pageNumber, totalPages);

    const skipAmount = (currentPage - 1) * limitNumber;

    const sortOptions = {
      dateOfTransaction: 1,
      _id: 1,
    };

    const paginatedTransactions = await Transaction.find(filter)
      .populate("relatedBookId")
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(limitNumber)
      .lean();

    let startingBalance = 0;
    if (currentPage > 1) {
      const startingBalanceResult = await Transaction.aggregate([
        { $match: filter },
        { $sort: sortOptions },
        { $limit: skipAmount },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
      ]);

      startingBalance =
        startingBalanceResult.length > 0
          ? startingBalanceResult[0].totalAmount
          : 0;
    }

    let cumulativeBalance = startingBalance;

    const transactionList = paginatedTransactions.map((transaction) => {
      cumulativeBalance += transaction.amount;
      return {
        ...transaction,
        balance: cumulativeBalance,
      };
    });

    res.json({
      transactions: transactionList,
      totalPages,
      currentPage,
      totalTransactions,
      lastTransactionBalance: cumulativeBalance,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error." });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const userId = req.session.passport.user;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User ID not found." });
    }

    const { transactionId } = req.params;
    const { amount, vendor, customLabel, dateOfTransaction } = req.body;

    if (amount === undefined || !dateOfTransaction) {
      return res
        .status(400)
        .json({ message: "Amount and date of transaction are required." });
    }

    const transaction = await Transaction.findOne({
      _id: transactionId,
      ownerId: userId,
    });

    if (!transaction) {
      return res
        .status(404)
        .json({ message: "Transaction not found or not owned by user." });
    }

    const oldAmount = transaction.amount;
    const oldDate = transaction.dateOfTransaction;

    const [year, month, day] = dateOfTransaction.split("-").map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, 12)); // Set time to 12:00 PM UTC

    transaction.amount = amount;
    transaction.vendor = vendor;
    transaction.tags =
      customLabel && customLabel !== "none" ? [customLabel] : ["none"];
    transaction.dateOfTransaction = utcDate;

    await transaction.save();

    try {
      if (oldAmount < 0) {
        await updateBudgetingsAmount({
          changeAmount: Math.abs(oldAmount),
          relatedBookId: transaction.relatedBookId,
          userId,
          dateOfTransaction: oldDate,
          updateType: "budget",
        });

        await updateBudgetingsAmount({
          changeAmount: -oldAmount,
          relatedBookId: transaction.relatedBookId,
          userId,
          dateOfTransaction: oldDate,
          updateType: "goal",
        });
      } else if (oldAmount > 0) {
        await updateBudgetingsAmount({
          changeAmount: -oldAmount,
          relatedBookId: transaction.relatedBookId,
          userId,
          dateOfTransaction: oldDate,
          updateType: "goal",
        });
      }

      if (amount < 0) {
        await updateBudgetingsAmount({
          changeAmount: Math.abs(amount),
          relatedBookId: transaction.relatedBookId,
          userId,
          dateOfTransaction: utcDate,
          updateType: "budget",
        });

        await updateBudgetingsAmount({
          changeAmount: amount,
          relatedBookId: transaction.relatedBookId,
          userId,
          dateOfTransaction: utcDate,
          updateType: "goal",
        });
      } else if (amount > 0) {
        await updateBudgetingsAmount({
          changeAmount: amount,
          relatedBookId: transaction.relatedBookId,
          userId,
          dateOfTransaction: utcDate,
          updateType: "goal",
        });
      }
    } catch (error) {
      console.error("Error updating budgetings:", error.message);
    }

    res.status(200).json({ message: "Transaction updated successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
