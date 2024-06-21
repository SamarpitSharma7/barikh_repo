const mongoose = require("mongoose");

const url = "mongodb://localhost:27017/faltu";
mongoose.connect(url);

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fitness: {
    weight: { type: Number, default: 0 },
    age: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
  },
});

const exerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  exerciseName: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

const storeidschema = new mongoose.Schema({
  user_id: { type: String, required: true, ref: "storeid" },
  ex_id: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);
const Storeids = mongoose.model("storeids", storeidschema);

module.exports = { User, Exercise, Storeids };
