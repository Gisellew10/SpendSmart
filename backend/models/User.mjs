import mongoose from "../configs/db.mjs";

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  password: { type: String },
  type: { type: String, enum: ["Native", "Google"], required: true },
  age: { type: Number },
  dateCreated: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

export default User;
