import mongoose from "../configs/db.mjs";

const transactionSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  relatedBookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  category: { type: String, required: true },
  tags: { type: [String], default: ["none"] },
  vendor: { type: String },
  amount: { type: Number, required: true },
  transactionId: {
    type: String,
    unique: true,
    required: true,
    default: () => new mongoose.Types.ObjectId().toString(),
  },
  dateOfTransaction: { type: Date, required: true },
  dateAdded: { type: Date, default: Date.now },
});

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
