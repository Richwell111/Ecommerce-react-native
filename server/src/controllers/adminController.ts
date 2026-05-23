import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import type { Request, Response } from "express";

// Get dashboard stats
// GET /api/admin/stats
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        // 1. Concurrent counts for speed
        const [totalUsers, totalProducts, totalOrders] = await Promise.all([
            User.countDocuments(),
            Product.countDocuments(),
            Order.countDocuments(),
        ]);

        // 2. High-Performance Aggregation for Revenue
        // MUCH faster than fetching all records and reducing in JS
        const revenueStats = await Order.aggregate([
            { $match: { orderStatus: { $ne: "cancelled" } } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmount" },
                },
            },
        ]);

        const totalRevenue = revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;

        // 3. Grouping: Orders by Status
        // Useful for dashboard charts
        const ordersByStatus = await Order.aggregate([
            {
                $group: {
                    _id: "$orderStatus",
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
        ]);

        // 4. Performance Optimization: .lean() and projection for list data
        const recentOrders = await Order.find()
            .sort("-createdAt")
            .limit(5)
            .populate("user", "name email")
            .select("orderNumber totalAmount orderStatus createdAt user")
            .lean();

        res.json({
            success: true,
            data: {
                totalUsers,
                totalProducts,
                totalOrders,
                totalRevenue,
                ordersByStatus,
                recentOrders,
            },
        });
    } catch (error: any) {
        console.error("Admin Stats Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
