import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from '@clerk/express'
import connectDB from "./config/db.js";
import { clerkWebhook } from "./controllers/webhooks.js";

dotenv.config({quiet:true});
const PORT = process.env.PORT || 3000;
const app = express();

// Connect to MongoDB
connectDB();

// Clerk webhook endpoint (must come before clerkMiddleware)
app.post("/api/clerk", express.raw({ type: "application/json" }), clerkWebhook);

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware())

app.get("/", (req, res) => {
    res.send("Server is running...");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});