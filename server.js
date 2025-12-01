// server.js
import 'dotenv/config';
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ⚠️ Set OPENAI_API_KEY in your environment (never hardcode it)
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/rewrite-html", async (req, res) => {
    const { html, instruction } = req.body || {};

    if (!html || typeof html !== "string") {
        return res.status(400).json({ error: "Missing 'html' string in body" });
    }

    const userInstruction =
        typeof instruction === "string" && instruction.trim().length > 0
            ? instruction.trim()
            : "Improve the clarity and structure of the HTML content.";

    try {
        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "You rewrite HTML content. Preserve valid HTML tags and structure, but adjust the text according to the instruction. Return only HTML, no explanations.",
                },
                {
                    role: "user",
                    content: `Instruction: ${userInstruction}\n\nOriginal HTML:\n${html}`,
                },
            ],
        });

        const modifiedHtml = completion.choices[0]?.message?.content?.trim() ?? html;
        res.json({ modifiedHtml });
    } catch (err) {
        console.error("OpenAI API error:", err);
        res
            .status(500)
            .json({ error: "Failed to call OpenAI API. Check server logs." });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`API server listening on http://localhost:${PORT}`);
});