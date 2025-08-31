import { NextResponse } from "next/server";
import { Dirent, promises as fs } from "fs";
import path from "path";
import { QuizType } from "@/types";


export async function GET(params: { url: string }) {
    const results: QuizType[] = []
    try {
        const folderPath = params.url.split("quizzes/generated/")[1]
        const quizPath = path.join(process.cwd(), "data", "quizzes", folderPath)

        const quizItems: Dirent<string>[] = await fs.readdir(quizPath, { withFileTypes: true })
        for (let i = 0; i < quizItems.length; i++) {
            const quizItem: Dirent<string> = quizItems[i];
            if (quizItem.name.includes(".question")) {
                const quizContents: string = await fs.readFile(path.join(quizItem.path, quizItem.name), "utf-8")
                const quizObject: QuizType = await JSON.parse(quizContents) as QuizType;
                results.push(quizObject)
            }
        }
        return NextResponse.json({
            status: 200,
            data: results,
            error: null
        });
    } catch (e) {
        return NextResponse.json({
            status: 500,
            data: results,
            error: e
        });
    }
}
