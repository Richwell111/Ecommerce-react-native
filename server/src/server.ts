import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from '@clerk/express'
import connectDB from "./config/db.js";
import { clerkWebhook } from "./controllers/webhooks.js";
import makeAdmin from "./scripts/makeAdmin.js";
import { seedProducts } from "./scripts/seedProducts.js";
import ProductRouter from "./routes/productsRoutes.js";
import CartRouter from "./routes/cartRoutes.js";
import OrderRouter from "./routes/ordersRoutes.js";
import AddressRouter from "./routes/addressRoutes.js";
import WishlistRouter from "./routes/wishlistRoutes.js";
import AdminRouter from "./routes/adminRoutes.js";
import { handleStripeWebhook } from "./controllers/paymentController.js";
import paymentRouter from "./routes/paymentRoute.js";

dotenv.config({quiet:true});
const PORT = process.env.PORT || 3000;
const app = express();

// Connect to MongoDB
await connectDB();
// Stripe Webhook
process.env.STRIPE_SECRET_KEY && app.post("/api/stripe", express.raw({ type: "application/json" }), handleStripeWebhook);

// Clerk webhook endpoint (must come before clerkMiddleware)
app.post("/api/clerk", express.raw({ type: "application/json" }), clerkWebhook);

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware())

app.get("/", (req, res) => {
    res.send("Server is running...");
});
app.use("/api/products", ProductRouter);
app.use("/api/cart", CartRouter);
app.use("/api/orders", OrderRouter);
app.use("/api/addresses", AddressRouter);
app.use("/api/wishlist", WishlistRouter);
app.use("/api/admin", AdminRouter);
process.env.STRIPE_SECRET_KEY && app.use("/api/payments", paymentRouter);
// Initialization logic (Seeding and Admin setup)
const init = async () => {
    try {
        await makeAdmin();
        const mongoUri = process.env.MONGODB_URI;
        if (mongoUri) {
            await seedProducts(mongoUri);
        }
    } catch (error) {
        console.error("Initialization Error:", error);
    }
};

init();

if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

export default app;
