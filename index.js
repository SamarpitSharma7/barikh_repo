//added comment for checking
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User, Exercise, Storeids } = require("./db");
const axios = require("axios");

const mongoose = require("mongoose");
const app = express();
app.use(express.json());

app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ email: user.email, id: user._id }, SECRET_KEY);
    res.status(201).json({ user, token });
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).send({ error: "An error occurred while inserting data" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(404).send({ error: "User not found" });
    }

    const matchPassword = await bcrypt.compare(password, existingUser.password);
    if (!matchPassword) {
      return res.status(400).send({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      SECRET_KEY
    );
    res.status(200).json({ user: existingUser, token });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).send({ error: "An error occurred while logging in" });
  }
});

app.put("/update-fitness/id", async (req, res) => {
  const { id } = req.params;
  const { weight, age, height } = req.body;

  // Check if the id is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({ error: "Invalid user ID" });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          "fitness.weight": weight,
          "fitness.age": age,
          "fitness.height": height,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send({ error: "User not found" });
    }

    res.status(200).json({
      message: "Fitness information updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating ", error);
    res
      .status(500)
      .send({ error: "An error occurred while updating fitness information" });
  }
});

app.post("/add-exercise", async (req, res) => {
  const { userId, exerciseName, duration } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).send({ error: "Invalid user ID" });
  }

  try {
    const exercise = new Exercise({
      userId,
      exerciseName,
      duration,
    });
    await exercise.save();

    res.status(201).json({ message: "Exercise added successfully", exercise });
  } catch (error) {
    console.error("Error adding exercise:", error);
    res.status(500).send({ error: "An error occurred while adding exercise" });
  }
});

app.get("/get-exercises/userId", async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).send({ error: "Invalid user ID" });
  }

  try {
    const exercises = await Exercise.find({ userId });
    res.status(200).json(exercises);
  } catch (error) {
    console.error("Error retrieving exercises:", error);
    res
      .status(500)
      .send({ error: "An error occurred while retrieving exercises" });
  }
});

app.post("/store_id", async (req, res) => {
  //const { usid, exid } = req.body;  // exerciseId should be the ID from the Rapid API
  console.log(req.body);

  if (!mongoose.Types.ObjectId.isValid(req.body.user_id)) {
    console.error("Invalid user ID format:", req.body.user_id);
    return res.status(400).send({ error: "Invalid user ID format" });
  }

  try {
    const existingRecord = await Storeids.findOne({
      user_id: req.body.user_id,
      ex_id: req.body.ex_id,
    });

    if (existingRecord) {
      return res
        .status(400)
        .send({ error: "This exercise has already been added for this user" });
    }

    const storeid = new Storeids({
      user_id: req.body.user_id,
      ex_id: req.body.ex_id, // Saving the exercise ID directly
    });
    await storeid.save();

    res
      .status(201)
      .json({ message: "Selected exercise ID saved successfully", storeid });
  } catch (error) {
    console.error("Error saving selected exercise ID:", error);
    res
      .status(500)
      .send({ error: "An error occurred while saving selected exercise ID" });
  }
});

app.get("/store_exercise/userId", async (req, res) => {
  // const { userId } = req.params;
  console.log(req.body.user_id);
  console.log("Fetching exercises for userId dfgjhjh   :", req.body.user_id);

  if (!mongoose.Types.ObjectId.isValid(req.body.user_id)) {
    console.error("Invalid user ID format:", req.body.user_id);
    return res.status(400).send({ error: "Invalid user ID format" });
  }

  try {
    const exerciseIds = await Storeids.find({ user_id: req.body.user_id });

    if (!exerciseIds.length) {
      return res
        .status(404)
        .send({ error: "No exercises found for this user" });
    }

    const exerciseDetailsPromises = exerciseIds.map(async (storeid) => {
      try {
        const response = await axios.get(
          `
            https://exercisedb.p.rapidapi.com/exercises/exercise/${storeid.ex_id}`,
          {
            headers: {
              "x-rapidapi-key": x - rapidapi - key,
              "x-rapidapi-host": x - rapidapi - host,
            },
          }
        );
        return response.data;
      } catch (error) {
        console.error(
          `Error fetching details for exercise ID ${storeid.ex_id}:`,
          error
        );
        return null;
      }
    });

    const exerciseDetails = await Promise.all(exerciseDetailsPromises);

    res.status(200).json(exerciseDetails.filter((detail) => detail !== null));
  } catch (error) {
    console.error("Error retrieving exercises:", error);
    res
      .status(500)
      .send({ error: "An error occurred while retrieving exercises" });
  }
});

// app.get('/store_exercise/userId', async (req, res) => {
//     // const { userId } = req.body;
// console.log(req.body)
//     console.log('Fetching exercises for userId:', req.body.user_id);

//     if (!mongoose.Types.ObjectId.isValid(req.body.user_id)) {
//         console.error("Invalid user ID format:", req.body.user_id);
//         return res.status(400).send({ error: "Invalid user ID format" });
//     }

//     try {
//         const exercises = await Storeids.find({ user_id: req.body.user_id});

//         if (!exercises.length) {
//             return res.status(404).send({ error: "No exercises found for this user" });
//         }

//         res.status(200).json(exercises);
//     } catch (error) {
//         console.error("Error retrieving exercises:", error);
//         res.status(500).send({ error: "An error occurred while retrieving exercises" });
//     }
// });

app.listen(7000, () => {
  console.log("Server is running on port 7000");
});
