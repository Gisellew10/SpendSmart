import mongoose from "../configs/db.mjs";

const formattedDataSchema = new mongoose.Schema({
  income: {
    labels: { type: [String], default: [] },
    values: { type: [Number], default: [] },
  },
  expenses: {
    labels: { type: [String], default: [] },
    values: { type: [Number], default: [] },
  },
});

const reportSchema = new mongoose.Schema({
  reportType: { type: String, enum: ["Weekly", "Monthly"], required: true },
  username: { type: String },
  bookName: { type: String },
  totalIncome: { type: Number, default: 0 },
  totalExpense: { type: Number, default: 0 },
  totalBalance: { type: Number, default: 0 },
  formattedData: { type: formattedDataSchema, default: () => ({}) },
  numberOfSucceededBudgets: { type: Number, default: 0 },
  numberOfSucceededGoals: { type: Number, default: 0 },
  numberOfFailedBudgets: { type: Number, default: 0 },
  numberOfFailedGoals: { type: Number, default: 0 },
  completedBudgetings: { type: Array, default: [] },
  failedBudgetings: { type: Array, default: [] },
  relatedBookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  reportId: {
    type: String,
    unique: true,
    required: true,
    default: () => new mongoose.Types.ObjectId().toString(),
  },
  reportYear: { type: Number, required: true },
  reportMonth: { type: Number, required: true },
  reportMonthName: { type: String, required: true },
  reportDay: { type: Number, required: true },
  dateCreated: { type: Date, default: Date.now },
});

const Report = mongoose.model("Report", reportSchema);

export default Report;
