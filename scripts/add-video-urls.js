// Script to add YouTube video URLs to lessons
// Usage: node scripts/add-video-urls.js

const mongoose = require("mongoose");
require("dotenv").config();

const lessonSchema = new mongoose.Schema(
    {
        title: String,
        videoUrl: String,
        course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        order: Number,
    },
    { timestamps: true }
);

const Lesson = mongoose.model("Lesson", lessonSchema);

// 🎯 ADD YOUR VIDEO URLs HERE
const videoUpdates = [
    {
        // Match by lesson title or order
        courseId: "68eefcc3ae53681d1b6fd417", // Replace with your course ID
        lessonOrder: 1,
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace with actual video URL
    },
    // Add more lessons here
    // {
    //     courseId: "YOUR_COURSE_ID",
    //     lessonOrder: 2,
    //     videoUrl: "https://youtu.be/VIDEO_ID",
    // },
];

async function addVideoUrls() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.DB_URL || "mongodb://localhost:27017/skills-swap");
        console.log("✅ Connected to MongoDB");

        let updatedCount = 0;
        let notFoundCount = 0;

        for (const update of videoUpdates) {
            const lesson = await Lesson.findOne({
                course: update.courseId,
                order: update.lessonOrder,
            });

            if (lesson) {
                lesson.videoUrl = update.videoUrl;
                await lesson.save();
                console.log(
                    `✅ Updated: "${lesson.title}" (Order ${lesson.order}) - ${update.videoUrl}`
                );
                updatedCount++;
            } else {
                console.log(
                    `❌ Not Found: Course ${update.courseId}, Order ${update.lessonOrder}`
                );
                notFoundCount++;
            }
        }

        console.log("\n📊 Summary:");
        console.log(`✅ Updated: ${updatedCount} lessons`);
        console.log(`❌ Not Found: ${notFoundCount} lessons`);
    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await mongoose.disconnect();
        console.log("\n✅ Disconnected from MongoDB");
    }
}

// Run the script
addVideoUrls();
