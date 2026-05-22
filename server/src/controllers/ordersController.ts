import mongoose from "mongoose";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import type { Request, Response } from "express";
import type { IOrderItem } from "../types/index.js";

// Get user orders
// GET /api/orders
export const getOrders = async (req: Request, res: Response) => {
    try {
        const query = { user: req.user._id };

        const orders = await Order.find(query).populate("items.product", "name images").sort("-createdAt");

        res.json({
            success: true,
            data: orders,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single order
// GET /api/orders/:id
export const getOrder = async (req: Request, res: Response) => {
    try {
        const order = await Order.findById(req.params.id).populate("items.product", "name images");

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        res.json({ success: true, data: order });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create order from cart
// POST /api/orders
export const createOrder = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { shippingAddress, notes, paymentMethod, paymentIntentId } = req.body;

        // 1. Basic Validation
        if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: "Please provide a complete shipping address" });
        }

        // 2. Fetch Cart (no populate needed as we fetch product atomically)
        const cart = await Cart.findOne({ user: req.user._id }).session(session);

        if (!cart || cart.items.length === 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: "Your cart is empty" });
        }

        const orderItems: IOrderItem[] = [];
        let subtotal = 0;

        // 3. Verify stock and prepare order items ATOMICALLY
        for (const item of cart.items) {
            // Atomic update: only decrement if stock >= quantity
            // This prevents race conditions (two users buying the same item simultaneously)
            const product = await Product.findOneAndUpdate(
                { 
                    _id: item.product, 
                    stock: { $gte: item.quantity },
                    isActive: true // Ensure product hasn't been deactivated
                },
                { $inc: { stock: -item.quantity } },
                { new: true, session }
            );

            if (!product) {
                await session.abortTransaction();
                session.endSession();
                
                // Fetch product to see why it failed (out of stock vs not found)
                const checkProduct = await Product.findById(item.product);
                const productName = checkProduct ? checkProduct.name : "One of your items";
                
                return res.status(409).json({
                    success: false,
                    message: `Insufficient stock for ${productName}. Please check availability.`,
                });
            }

            // Price Locking: Use the current real-time price from the product model
            const currentPrice = product.price;
            subtotal += currentPrice * item.quantity;

            orderItems.push({
                product: product._id,
                name: product.name,
                quantity: item.quantity,
                price: currentPrice,
                ...(item.size ? { size: item.size } : {}),
            });
        }

        // 4. Calculate final totals
        const shippingCost = 2; // Fixed shipping cost
        const tax = 0;
        const totalAmount = subtotal + shippingCost + tax;

        // 5. Create the Order
        // Note: .create() with session requires an array
        const [order] = await Order.create([{
            user: req.user._id,
            orderNumber: "ORD-" + Math.floor(100000 + Math.random() * 900000) + "-" + Date.now().toString().slice(-4),
            items: orderItems,
            shippingAddress,
            paymentMethod: paymentMethod || "cash",
            paymentStatus: "pending",
            subtotal,
            shippingCost,
            tax,
            totalAmount,
            notes,
            paymentIntentId,
        }], { session });

        // 6. Clear Cart (immediately for non-webhook payment methods)
        if (paymentMethod !== "stripe") {
            cart.items = [];
            cart.totalAmount = 0;
            await cart.save({ session });
        }

        // Commit all changes
        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ success: true, data: order });

    } catch (error: any) {
        // Rollback all database changes if any error occurs
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();
        
        console.error("CRITICAL ORDER ERROR:", error);
        res.status(500).json({ 
            success: false, 
            message: "An internal error occurred while processing your order",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
};

// Update order status
// PUT /api/orders/:id/status
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { orderStatus, paymentStatus } = req.body;

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (orderStatus) order.orderStatus = orderStatus;
        if (paymentStatus) order.paymentStatus = paymentStatus;
        if (orderStatus === "delivered") order.deliveredAt = new Date();

        await order.save();

        res.json({ success: true, data: order });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all orders
// GET /api/orders/admin/all
export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const query: any = {};

        if (status) query.orderStatus = status;

        const total = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate("user", "name email")
            .populate("items.product", "name")
            .sort("-createdAt")
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        res.json({
            success: true,
            data: orders,
            pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
