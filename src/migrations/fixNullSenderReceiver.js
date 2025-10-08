const mongoose = require("mongoose");
const Message = require("../dbSchemas/messageSchema");

/**
 * Migration script to clean up messages with null sender/receiver
 * Run this script to fix existing data issues
 */

async function fixNullSenderReceiver() {
    try {
        // Find all messages with null sender or receiver
        const messagesWithNullUsers = await Message.find({
            $or: [{ sender: null }, { receiver: null }],
        });

        console.log(
            `Found ${messagesWithNullUsers.length} messages with null sender/receiver`
        );

        if (messagesWithNullUsers.length > 0) {
            console.log("\nOptions to fix:");
            console.log(
                "1. Delete these messages (recommended if they're orphaned)"
            );
            console.log("2. Mark as deleted (soft delete)");
            console.log("3. Leave them and just log the issue");

            // For now, let's mark them as deleted
            const result = await Message.updateMany(
                {
                    $or: [{ sender: null }, { receiver: null }],
                },
                {
                    $set: { isDeleted: true },
                }
            );

            console.log(`\nMarked ${result.modifiedCount} messages as deleted`);
        }

        // Check for messages with invalid ObjectIds
        const allMessages = await Message.find({ isDeleted: false });
        let invalidCount = 0;

        for (const message of allMessages) {
            if (!mongoose.Types.ObjectId.isValid(message.sender)) {
                console.log(`Invalid sender ID in message: ${message._id}`);
                invalidCount++;
            }
            if (!mongoose.Types.ObjectId.isValid(message.receiver)) {
                console.log(`Invalid receiver ID in message: ${message._id}`);
                invalidCount++;
            }
        }

        console.log(`\nFound ${invalidCount} messages with invalid ObjectIds`);

        console.log("\n✅ Migration completed");
    } catch (error) {
        console.error("Error during migration:", error);
    }
}

// Run if called directly
if (require.main === module) {
    const dbUrl =
        process.env.MONGODB_URI || "mongodb://localhost:27017/skills-swap";

    mongoose
        .connect(dbUrl)
        .then(() => {
            console.log("Connected to MongoDB");
            return fixNullSenderReceiver();
        })
        .then(() => {
            console.log("Disconnecting...");
            return mongoose.disconnect();
        })
        .then(() => {
            console.log("Done!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("Migration failed:", error);
            process.exit(1);
        });
}

module.exports = fixNullSenderReceiver;
