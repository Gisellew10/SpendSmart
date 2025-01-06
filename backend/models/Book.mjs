import mongoose from "../configs/db.mjs";

const bookSchema = new mongoose.Schema({
  bookName: { type: String },
  dateCreated: { type: Date, default: Date.now },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sharedId: { type: String },
  bookId: {
    type: String,
    unique: true,
    required: true,
    default: () => new mongoose.Types.ObjectId().toString(),
  },
});

const Book = mongoose.model("Book", bookSchema);

export default Book;
