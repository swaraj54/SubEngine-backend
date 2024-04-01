import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import websiteSchema from "./model/website.schema.js";
import cors from "cors";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "sk-AEnpn2Nh5EnVBz381TesT3BlbkFJ14vuU4vt2VOc3lTIk8Nz",
});

const app = express();

app.use(express.json());
dotenv.config();
app.use(cors());

app.get("/", (req, res) => {
  try {
    return res.status(200).json({ success: true, message: "Welcome!" });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
});
app.post("/record-feedback", async (req, res) => {
  try {
    const { url, feedback } = req.body;
    if (!url || !feedback)
      return res
        .status(403)
        .json({ success: false, message: "All data required." });
    if (feedback === "Potential Resource") {
      await websiteSchema.findOneAndUpdate(
        { url },
        { $inc: { userReviewPotentialSource: 1 } }
      );
    } else if (feedback === "Review Needed") {
      await websiteSchema.findOneAndUpdate(
        { url },
        { $inc: { userReviewReviewNeeded: 1 } }
      );
    }

    const doc = await websiteSchema.findOne({ url });
    if (doc.userReviewPotentialSource > 1) {
      await websiteSchema.findOneAndUpdate(
        { url },
        { $set: { source: "Potential Source" } }
      );
    } else if (doc.userReviewReviewNeeded > 1) {
      await websiteSchema.findOneAndUpdate(
        { url },
        { $set: { source: "Review Needed" } }
      );
    }
    return res
      .status(200)
      .json({ success: true, message: "Feedback recorded successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
});

async function analyzeTrustworthiness(url) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Given the URL of a website (${url}), please analyze its content and provide an assessment of its trustworthiness. Specifically, determine if the website is a potential reliable resource based on factors such as the presence of authoritative sources, accurate information, and user engagement. If the content lacks clear trust indicators or presents potential red flags, classify it as 'Review Needed' or 'Potential Source'. Just responed with 'Review Needed' or 'Potential Source', i dont want any other explanation.`,
        },
      ],
      model: "gpt-3.5-turbo-0125",
    });
    console.log(completion?.choices[0]?.message?.content);
    return completion?.choices[0]?.message?.content.trim();
  } catch (error) {
    console.error("Error analyzing trustworthiness:", error.response.data);
    return null;
  }
}

app.post("/analyze-urls", async (req, res) => {
  try {
    const { urls } = req.body;
    if (urls?.length <= 0)
      return res
        .status(403)
        .json({ success: false, message: "Urls not found." });
    const uniqueUrls = new Set(urls);
    const uniqueUrlsArray = Array.from(uniqueUrls);

    const results = [];
    for (const url of uniqueUrlsArray) {
      const existingWebsite = await websiteSchema.findOne({ url });
      if (existingWebsite) {
        results.push({ url, source: existingWebsite.source });
      } else {
        const analysis = await analyzeTrustworthiness(url);
        console.log(analysis, "analysis");
        const newWebsite = new websiteSchema({
          url,
          source: analysis,
          aiAnalysis: analysis,
        });
        await newWebsite.save();
        results.push({ url, source: analysis });
      }
    }
    return res.status(200).json({ success: true, results });
  } catch (error) {
    console.log(error, "error");
    return res.status(500).json({ success: false, error });
  }
});

mongoose.connect(process.env.DATABASE_URL).then(() => {
  console.log("Database connected.");
});

app.listen(3001, () => {
  console.log("Server listening on port 3001.");
});
