import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from '@clerk/express'
import connectDB from "./config/db.js";
import { clerkWebhook } from "./controllers/webhooks.js";
import makeAdmin from "./scripts/makeAdmin.js";
import { seedProducts } from "./scripts/seedProducts.js";

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

makeAdmin();
// Seed products if no products are present
await seedProducts (process.env.MONGODB_URI as string);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});