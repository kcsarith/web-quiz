import { NextResponse } from "next/server";
import { Dirent, promises as fs } from "fs";
import path from "path";
import { QuizType } from "@/types";

export async function GET(request: Request) {
    const results: QuizType[] = []
    try {
        // Get the URL and decode special characters
        const url = new URL(request.url);
        let folderPath = decodeURIComponent(url.pathname.split("quiz/")[1]);

        let quizPath = path.join(process.cwd(), "data", "quiz", folderPath);

        const isSample = folderPath.includes("samples/");
        quizPath = quizPath.replace("samples/", "");
        folderPath = folderPath.replace("samples/", "");

        if (isSample) {
            quizPath = path.join(process.cwd(), "data", "samples", "quiz", folderPath);
        }

        console.log("Decoded quiz path:", quizPath);

        const quizItems: Dirent<string>[] = await fs.readdir(quizPath, { withFileTypes: true });

        for (let i = 0; i < quizItems.length; i++) {
            const quizItem: Dirent<string> = quizItems[i];
            if (quizItem.name.includes(".question") || quizItem.name.includes(".json")) {
                const quizContents: string = await fs.readFile(path.join(quizItem.path, quizItem.name), "utf-8");
                const quizObject: QuizType = JSON.parse(quizContents) as QuizType;
                results.push(quizObject);
            }
        }

        return NextResponse.json(results);
    } catch (e) {
        console.error("Quiz API error:", e);
        return NextResponse.json({
            error: e instanceof Error ? e.message : "Unknown error occurred"
        }, { status: 500 });
    }
}
