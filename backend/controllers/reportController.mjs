import Report from "../models/Report.mjs";
import Book from "../models/Book.mjs";
import Budgeting from "../models/Budgeting.mjs";
import Transaction from "../models/Transaction.mjs";
import User from "../models/User.mjs";

export const createReport = async (req, res) => {
  try {
    if (!("relatedBookId" in req.body))
      return res.status(400).end("relatedBookId is missing");
    if (!("reportType" in req.body))
      return res.status(400).end("reportType is missing");
    const relatedBookId = req.body.relatedBookId;
    const userId = req.session.passport.user;
    const reportType = req.body.reportType;

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const monthName = monthNames[today.getMonth()];
    const day = today.getDate();

    const book = await Book.findById(relatedBookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (book.ownerId != userId) {
      return res.status(403).end("forbidden");
    }

    const user = await User.findOne({
      _id: book.ownerId,
    });
    let username = user.name;
    let bookName = book.bookName;

    const newReport = new Report({
      reportType: reportType,
      username: username,
      bookName: bookName,
      relatedBookId: relatedBookId,
      reportYear: year,
      reportMonth: month,
      reportMonthName: monthName,
      reportDay: day,
    });
    await newReport.save();
    res.status(201).json({ newReport });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateWeeklyReports = async (req, res) => {
  try {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const monthName = monthNames[today.getMonth()];
    const day = today.getDate();
    const date_7_days_ago_T05 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const date_7_days_ago = new Date(
      Date.UTC(
        date_7_days_ago_T05.getFullYear(),
        date_7_days_ago_T05.getMonth(),
        date_7_days_ago_T05.getDate(),
        0,
        0,
        0,
        0,
      ),
    );

    const books = await Book.find({});
    let username;
    let bookName;
    let relatedBookId;
    let totalIncome = 0;
    let totalExpense = 0;
    let totalBalance = 0;
    let transactions;
    let numberOfFailedBudgets = 0;
    let failedBudgetings;

    for (const book of books) {
      const user = await User.findOne({
        _id: book.ownerId,
      });
      username = user.name;
      bookName = book.bookName;
      relatedBookId = book._id;

      totalIncome = 0;
      totalExpense = 0;
      transactions = await Transaction.find({
        relatedBookId: relatedBookId,
        dateOfTransaction: { $gte: date_7_days_ago },
      });

      const data = {
        income: { labels: [], values: [] },
        expenses: { labels: [], values: [] },
      };

      for (const transaction of transactions) {
        const category = transaction.amount >= 0 ? "income" : "expenses";

        if (transaction.amount > 0)
          totalIncome = totalIncome + transaction.amount;
        else totalExpense = totalExpense - transaction.amount;

        // Update labels and values for income or expenses category
        const categoryIndex = data[category].labels.indexOf(
          transaction.category,
        );
        if (categoryIndex === -1) {
          data[category].labels.push(transaction.category);
          data[category].values.push(transaction.amount);
        } else {
          data[category].values[categoryIndex] += transaction.amount;
        }
      }

      totalBalance = totalIncome - totalExpense;

      // Prepare the formatted data for the frontend
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

      numberOfFailedBudgets = 0;
      failedBudgetings = [];

      const budgets = await Budgeting.find({
        relatedBookId: relatedBookId,
        budgetingType: "Budget",
        overSpent: 0,
      }).sort({ dateCreated: -1 });
      for (const budget of budgets) {
        if (budget.currentAmount > budget.goalAmount) {
          numberOfFailedBudgets = numberOfFailedBudgets + 1;
          failedBudgetings.push(budget.toObject());
          budget.overSpent = 1;
          await budget.save();
        }
      }

      const newReport = new Report({
        reportType: "Weekly",
        relatedBookId: relatedBookId,
        username: username,
        bookName: bookName,
        totalIncome: totalIncome,
        totalExpense: totalExpense,
        totalBalance: totalBalance,
        formattedData: formattedData,
        numberOfFailedBudgets: numberOfFailedBudgets,
        failedBudgetings: failedBudgetings,
        reportYear: year,
        reportMonth: month,
        reportMonthName: monthName,
        reportDay: day,
      });
      await newReport.save();
    }
    res.status(202).json({ message: "Generated weekly reports successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateMonthlyReports = async (req, res) => {
  try {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const monthName = monthNames[today.getMonth()];
    const day = today.getDate();
    let date_1_month_ago;
    if (month == 1) {
      date_1_month_ago = new Date(Date.UTC(year - 1, 11, 1, 0, 0, 0, 0));
    } else {
      date_1_month_ago = new Date(Date.UTC(year, month - 2, 1, 0, 0, 0, 0));
    }

    const books = await Book.find({});
    let username;
    let bookName;
    let relatedBookId;
    let totalIncome = 0;
    let totalExpense = 0;
    let totalBalance = 0;
    let transactions;
    let numberOfSucceededBudgets = 0;
    let numberOfSucceededGoals = 0;
    let numberOfFailedBudgets = 0;
    let numberOfFailedGoals = 0;
    let completedBudgetings;
    let failedBudgetings;

    for (const book of books) {
      const user = await User.findOne({
        _id: book.ownerId,
      });
      username = user.name;
      bookName = book.bookName;
      relatedBookId = book._id;

      totalIncome = 0;
      totalExpense = 0;
      transactions = await Transaction.find({
        relatedBookId: relatedBookId,
        dateOfTransaction: { $gte: date_1_month_ago },
      });

      const data = {
        income: { labels: [], values: [] },
        expenses: { labels: [], values: [] },
      };

      for (const transaction of transactions) {
        const category = transaction.amount >= 0 ? "income" : "expenses";

        if (transaction.amount > 0)
          totalIncome = totalIncome + transaction.amount;
        else totalExpense = totalExpense - transaction.amount;

        // Update labels and values for income or expenses category
        const categoryIndex = data[category].labels.indexOf(
          transaction.category,
        );
        if (categoryIndex === -1) {
          data[category].labels.push(transaction.category);
          data[category].values.push(transaction.amount);
        } else {
          data[category].values[categoryIndex] += transaction.amount;
        }
      }

      totalBalance = totalIncome - totalExpense;

      // Prepare the formatted data for the frontend
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

      numberOfSucceededBudgets = 0;
      numberOfSucceededGoals = 0;
      numberOfFailedBudgets = 0;
      numberOfFailedGoals = 0;
      completedBudgetings = [];
      failedBudgetings = [];

      const budgetings = await Budgeting.find({
        relatedBookId: relatedBookId,
      }).sort({ dateCreated: -1 });
      for (const budgeting of budgetings) {
        if (
          budgeting.budgetingType == "Budget" &&
          budgeting.currentAmount > budgeting.goalAmount
        ) {
          numberOfFailedBudgets = numberOfFailedBudgets + 1;
          failedBudgetings.push(budgeting.toObject());
          budgeting.currentAmount = 0;
          await budgeting.save();
        } else {
          if (
            (budgeting.refreshTime == "Yearly" && month == 1) ||
            budgeting.refreshTime == "Monthly"
          ) {
            if (budgeting.budgetingType == "Budget") {
              if (budgeting.currentAmount <= budgeting.goalAmount) {
                numberOfSucceededBudgets = numberOfSucceededBudgets + 1;
                completedBudgetings.push(budgeting.toObject());
                budgeting.currentAmount = 0;
                await budgeting.save();
              }
            } else {
              if (budgeting.currentAmount >= budgeting.goalAmount) {
                numberOfSucceededGoals = numberOfSucceededGoals + 1;
                completedBudgetings.push(budgeting.toObject());
                budgeting.currentAmount = 0;
                await budgeting.save();
              } else {
                numberOfFailedGoals = numberOfFailedGoals + 1;
                failedBudgetings.push(budgeting.toObject());
                budgeting.currentAmount = 0;
                await budgeting.save();
              }
            }
          }
        }
      }

      const newReport = new Report({
        reportType: "Monthly",
        relatedBookId: relatedBookId,
        username: username,
        bookName: bookName,
        totalIncome: totalIncome,
        totalExpense: totalExpense,
        totalBalance: totalBalance,
        formattedData: formattedData,
        numberOfSucceededBudgets: numberOfSucceededBudgets,
        numberOfSucceededGoals: numberOfSucceededGoals,
        numberOfFailedBudgets: numberOfFailedBudgets,
        numberOfFailedGoals: numberOfFailedGoals,
        completedBudgetings: completedBudgetings,
        failedBudgetings: failedBudgetings,
        reportYear: year,
        reportMonth: month,
        reportMonthName: monthName,
        reportDay: day,
      });
      await newReport.save();
    }
    res.status(202).json({ message: "Generated monthly reports successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWeeklyReports = async (req, res) => {
  try {
    const userId = req.session.passport.user;
    const relatedBookId = req.params.relatedBookId;
    const book = await Book.findById(relatedBookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found", reports: [] });
    }
    if (book.ownerId != userId) {
      return res
        .status(403)
        .json({ message: "User is not owner of book", reports: [] });
    }

    const reports = await Report.find({
      reportType: "Weekly",
      relatedBookId: relatedBookId,
    }).sort({ dateCreated: -1 });
    res.status(206).json({ reports });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMonthlyReports = async (req, res) => {
  try {
    const userId = req.session.passport.user;
    const relatedBookId = req.params.relatedBookId;
    const book = await Book.findById(relatedBookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found", reports: [] });
    }
    if (book.ownerId != userId) {
      return res.status(403).end("forbidden");
    }

    const reports = await Report.find({
      reportType: "Monthly",
      relatedBookId: relatedBookId,
    }).sort({ dateCreated: -1 });
    res.status(207).json({ reports });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteReport = async (req, res) => {
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

    const reportId = req.params.reportId;
    const report = await Report.findByIdAndDelete(reportId);
    if (!report) {
      return res.status(405).json({ message: "Report not found" });
    }
    res.status(200).json({ message: "Report deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
