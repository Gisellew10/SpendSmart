import mongoose from "../configs/db.mjs";

import User from "../models/User.mjs";
import Transaction from "../models/Transaction.mjs";
import Book from "../models/Book.mjs";
import Budgeting from "../models/Budgeting.mjs";
import Report from "../models/Report.mjs";
import CustomLabel from "../models/CustomLabel.mjs";

await User.deleteMany({});
await Book.deleteMany({});
await Budgeting.deleteMany({});
await Report.deleteMany({});
await Transaction.deleteMany({});
await CustomLabel.deleteMany({});
await mongoose.connection.close();
console.log("MongoDB connection closed");
