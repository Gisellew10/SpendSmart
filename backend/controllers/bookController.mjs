import Book from "../models/Book.mjs";
import Transaction from "../models/Transaction.mjs";
import Budgeting from "../models/Budgeting.mjs";
import mongoose from "mongoose";

export const getBooks = async (req, res) => {
  try {
    const userId = req.session.passport.user;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User ID not found." });
    }

    let books = await Book.find({ ownerId: userId });

    if (books.length === 0) {
      const dailyExpensesBook = new Book({
        bookName: "Daily Expenses",
        ownerId: userId,
      });

      await dailyExpensesBook.save();
      books.push(dailyExpensesBook);
    }

    res.status(200).json({ books });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch books." });
  }
};

export const createBook = async (req, res) => {
  try {
    const { bookName } = req.body;
    if (!bookName) {
      return res.status(400).json({ message: "Book name is required." });
    }

    const userId = req.session.passport.user;
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User ID not found." });
    }

    const existingBook = await Book.findOne({ bookName, ownerId: userId });
    if (existingBook) {
      return res.status(409).json({ message: "Book name already exists." });
    }

    const newBook = new Book({
      bookName,
      ownerId: userId,
    });

    await newBook.save();
    res
      .status(201)
      .json({ message: "Book created successfully.", book: newBook });
  } catch (error) {
    res.status(500).json({ message: "Failed to create book." });
  }
};

export const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { bookName } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid book ID." });
    }

    const userId = req.session.passport.user;
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User ID not found." });
    }

    const book = await Book.findOneAndUpdate(
      { _id: id, ownerId: userId },
      { bookName },
      { new: true },
    );

    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }

    res.status(200).json({ message: "Book updated successfully.", book });
  } catch (error) {
    res.status(500).json({ message: "Failed to update book." });
  }
};

export const deleteBook = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Invalid book ID." });
    }

    const userId = req.session.passport.user;
    if (!userId) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(401)
        .json({ message: "Unauthorized: User ID not found." });
    }

    const bookToDelete = await Book.findOne({
      _id: id,
      ownerId: userId,
    }).session(session);
    if (!bookToDelete) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Book not found." });
    }

    if (bookToDelete.bookName === "Daily Expenses") {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ message: 'Cannot delete the default book "Daily Expenses".' });
    }

    const deleteTransactionsResult = await Transaction.deleteMany({
      relatedBookId: id,
      ownerId: userId,
    }).session(session);
    console.log(
      `Deleted ${deleteTransactionsResult.deletedCount} transactions.`,
    );

    const deleteBudgetingsResult = await Budgeting.deleteMany({
      relatedBookId: id,
    }).session(session);
    console.log(`Deleted ${deleteBudgetingsResult.deletedCount} budgetings.`);

    const deleteBookResult = await Book.deleteOne({
      _id: id,
      ownerId: userId,
    }).session(session);
    console.log(
      `Deleted book: ${deleteBookResult.deletedCount === 1 ? "Success" : "Failure"}`,
    );

    await session.commitTransaction();
    session.endSession();

    res
      .status(200)
      .json({
        message: "Book, its transactions, and budgetings deleted successfully.",
      });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: "Failed to delete book." });
  }
};
