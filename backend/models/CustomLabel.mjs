import mongoose from "../configs/db.mjs";

const customLabelSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  labelName: { type: String, required: true },
  type: { type: String, enum: ["Expense", "Income"], required: true },
});

const CustomLabel = mongoose.model("CustomLabel", customLabelSchema);

export default CustomLabel;
