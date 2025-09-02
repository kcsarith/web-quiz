import { NextResponse } from "next/server";
import { Dirent, promises as fs } from "fs";
import path from "path";
import { QuizType } from "@/types";


export async function GET(params: { url: string }) {
    const results: QuizType[] = []
    try {
        const folderPath = params.url.split("quizzes/")[1]
        let quizPath = path.join(process.cwd(), "data", "quizzes", folderPath)

        const isSample = folderPath.includes("samples/");
        quizPath = quizPath.replace("samples/", "");;

        if (isSample) {
            quizPath = path.join(process.cwd(), "data", "samples", "quizzes", folderPath)
        }
        console.log(quizPath);
        const quizItems: Dirent<string>[] = await fs.readdir(quizPath, { withFileTypes: true })
        for (let i = 0; i < quizItems.length; i++) {
            const quizItem: Dirent<string> = quizItems[i];
            if (quizItem.name.includes(".question")) {
                const quizContents: string = await fs.readFile(path.join(quizItem.path, quizItem.name), "utf-8")
                const quizObject: QuizType = JSON.parse(quizContents) as QuizType;
                results.push(quizObject)
            }
        }
        return NextResponse.json(results);
    } catch (e) {
        return NextResponse.json({
            error: e
        }, { status: 500 });
    }
}
