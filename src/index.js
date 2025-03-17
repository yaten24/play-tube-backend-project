import connectDB from "./db/index.db.js";
import { app } from "./app.js";
import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed !!");
  });

// import mongoose from 'mongoose';
// import express from 'express';
// import { DB_NAME } from 'constants.js';
// const app = express();
// ( async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//         app.on("ERROR: " , (error) => {
//             console.error("Error" , error)
//             throw error
//         })
//         app.listen(process.env.PORT , () => {
//             console.log(`Server is listning at port ${process.env.PORT}`)
//         })
//     } catch (error) {
//         console.error("Error: " , error);
//         throw error;
//     }
// })()
