import mongoose from "../configs/db.mjs";

const budgetingSchema = new mongoose.Schema({
  budgetingType: { type: String, enum: ["Budget", "Goal"], required: true },
  savingGoal: { type: String },
  goalAmount: { type: Number },
  currentAmount: { type: Number, default: 0 },
  overSpent: { type: Number, default: 0 },
  refreshTime: {
    type: String,
    enum: ["Never", "Monthly", "Yearly"],
    default: "Never",
  },
  relatedBookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  budgetId: {
    type: String,
    unique: true,
    required: true,
    default: () => new mongoose.Types.ObjectId().toString(),
  },
  dateCreated: { type: Date, default: Date.now },
});

const Budgeting = mongoose.model("Budgeting", budgetingSchema);

export default Budgeting;
