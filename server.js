
import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

app.use(cors());
app.use(express.json());

const key = process.env.OPENAI_API_KEY?.trim();

console.log("KEY LOADED:", !!key);
console.log("KEY LENGTH:", key?.length ?? 0);

if (!key) {
    console.error("OPENAI_API_KEY is missing");
    process.exit(1);
}

const client = new OpenAI({
    apiKey: key
});


// Home
app.get("/", (req, res) => {
    res.send("AI Video Backend is running!");
});


// Test OpenAI
app.get("/api/test-openai", async (req, res) => {
    try {

        const models = await client.models.list();

        res.json({
            success: true,
            message: "OpenAI API connected successfully",
            modelCount: models.data?.length || 0
        });

    } catch (error) {

        console.error("OPENAI TEST ERROR:", error);

        res.status(error.status || 500).json({
            success: false,
            status: error.status || 500,
            error: error.message
        });
    }
});


// Generate Video
app.post("/api/generate", async (req, res) => {

    try {

        const { prompt, ratio, duration } = req.body;

        if (!prompt || !prompt.trim()) {

            return res.status(400).json({
                success: false,
                error: "Prompt is required"
            });

        }

        let size = "720x1280";

        if (ratio === "16:9") {
            size = "1280x720";
        }

        if (ratio === "1:1") {
            size = "720x720";
        }

        const allowedDurations = ["4", "8", "12"];

        const seconds = allowedDurations.includes(String(duration))
            ? String(duration)
            : "4";


        console.log("Generating video...");
        console.log("Prompt:", prompt);
        console.log("Ratio:", ratio);
        console.log("Duration:", seconds);
        console.log("Size:", size);


        const video = await client.videos.create({
            model: "sora-2",
            prompt: prompt.trim(),
            seconds: seconds,
            size: size
        });


        console.log("VIDEO CREATED:", video.id);


        res.json({
            success: true,
            videoId: video.id,
            status: video.status
        });


    } catch (error) {

        console.error("VIDEO ERROR:", error);

        res.status(error.status || 500).json({
            success: false,
            status: error.status || 500,
            error: error.message
        });

    }

});


// Video Status
app.get("/api/status/:id", async (req, res) => {

    try {

        const video = await client.videos.retrieve(req.params.id);

        res.json(video);

    } catch (error) {

        console.error("STATUS ERROR:", error);

        res.status(error.status || 500).json({
            success: false,
            status: error.status || 500,
            error: error.message
        });

    }

});


// Render PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`AI Video Server running on port ${PORT}`);

});

