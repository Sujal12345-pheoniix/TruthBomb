import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SCRATCH_DIR = path.join(process.cwd(), "scratch");
const FEEDBACK_FILE = path.join(SCRATCH_DIR, "dap-feedback.json");

function ensureFileExists() {
  if (!fs.existsSync(SCRATCH_DIR)) {
    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
  }
  if (!fs.existsSync(FEEDBACK_FILE)) {
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify([]), "utf8");
  }
}

interface FeedbackItem {
  userId: string;
  feedback: string;
  timestamp: string;
}

function readFeedback(): FeedbackItem[] {
  try {
    ensureFileExists();
    const data = fs.readFileSync(FEEDBACK_FILE, "utf8");
    return JSON.parse(data) as FeedbackItem[];
  } catch (e) {
    console.error("Error reading feedback file:", e);
    return [];
  }
}

function writeFeedback(data: FeedbackItem[]) {
  try {
    ensureFileExists();
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing feedback file:", e);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body.userId || "default-user";
    const feedback = body.feedback;

    if (!feedback) {
      return NextResponse.json({ error: "Missing feedback content" }, { status: 400 });
    }

    const items = readFeedback();
    items.push({
      userId,
      feedback,
      timestamp: new Date().toISOString()
    });

    writeFeedback(items);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error in feedback route:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
