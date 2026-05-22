import User from "../models/User.js";
import { clerkClient } from "@clerk/express";

const makeAdmin = async () => {
    try {
        const email = process.env.ADMIN_EMAIL;
        if (!email) {
            console.error("ADMIN_EMAIL is not set in environment variables");
            return;
        }

        const user = await User.findOneAndUpdate({ email }, { role: "admin" });
        if (user) {
            await clerkClient.users.updateUserMetadata(user.clerkId as string, {
                publicMetadata: {
                    role: "admin",
                },
            });
            console.log(`User ${email} promoted to admin.`);
        } else {
            console.log(`User with email ${email} not found.`);
        }
    } catch (err: any) {
        console.error("Admin promotion failed:", err.message);
    }
};

export default makeAdmin;
