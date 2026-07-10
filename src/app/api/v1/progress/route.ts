import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SCRATCH_DIR = path.join(process.cwd(), "scratch");
const PROGRESS_FILE = path.join(SCRATCH_DIR, "dap-progress.json");

function ensureFileExists() {
  if (!fs.existsSync(SCRATCH_DIR)) {
    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
  }
  if (!fs.existsSync(PROGRESS_FILE)) {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify({}), "utf8");
  }
}

interface UserProgress {
  completedTours: string[];
}

function readProgress(): Record<string, UserProgress> {
  try {
    ensureFileExists();
    const data = fs.readFileSync(PROGRESS_FILE, "utf8");
    return JSON.parse(data) as Record<string, UserProgress>;
  } catch (e) {
    console.error("Error reading progress file:", e);
    return {};
  }
}

function writeProgress(data: Record<string, UserProgress>) {
  try {
    ensureFileExists();
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing progress file:", e);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "default-user";

  const progress = readProgress();
  const userProgress = progress[userId] || { completedTours: [] };

  return NextResponse.json(userProgress);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body.userId || "default-user";
    const tourId = body.tourId;

    if (!tourId) {
      return NextResponse.json({ error: "Missing tourId" }, { status: 400 });
    }

    const progress = readProgress();
    if (!progress[userId]) {
      progress[userId] = { completedTours: [] };
    }

    if (!progress[userId].completedTours.includes(tourId)) {
      progress[userId].completedTours.push(tourId);
    }

    writeProgress(progress);

    return NextResponse.json({ success: true, completedTours: progress[userId].completedTours });
  } catch (e) {
    console.error("Error in progress POST route:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
