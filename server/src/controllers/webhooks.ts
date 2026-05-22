import type { Request, Response } from "express";
import { verifyWebhook } from "@clerk/express/webhooks";
import User from "../models/User.js";

/**
 * Controller to handle Clerk webhooks and sync user data with MongoDB
 */
export const clerkWebhook = async (req: Request, res: Response) => {
    try {
        // Verify the webhook signature from Clerk using CLERK_WEBHOOK_SECRET
        const evt: any = await verifyWebhook(req);

        // Handle user creation and update events to keep our database in sync
        if (evt.type === "user.created" || evt.type === "user.updated") {
            const user = await User.findOne({ clerkId: evt.data.id });

            const userData = {
                clerkId: evt.data.id,
                email: evt.data?.email_addresses[0]?.email_address,
                name: evt.data?.first_name + " " + evt.data?.last_name,
                image: evt.data?.image_url,
            };

            // Update existing user or create a new one based on the Clerk ID
            if (user) {
                await User.findOneAndUpdate({ clerkId: evt.data.id }, userData);
            } else {
                await User.create(userData);
            }
        }

        return res.json({ success: true, message: "Webhook received" });
    } catch (err) {
        console.error("Error verifying webhook:", err);
        return res.status(400).json({ success: false, message: "Error verifying webhook" });
    }
};
