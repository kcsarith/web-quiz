import { NextResponse } from "next/server";
import { Dirent, promises as fs } from "fs";
import path from "path";
import { removeMiddlePathSegment } from "@/lib"

type PathToFileMapping = {
    [filePath: string]: string[];
}
export async function GET(params: { url: string }) {
    try {
        const generatedQuizzesFolder: string = path.join(process.cwd(), "data", "quiz");
        const sampleQuizzesFolder: string = path.join(process.cwd(), "data", "samples", "quiz");
        const generatedQuizPaths: Dirent<string>[] = await fs.readdir(generatedQuizzesFolder, { withFileTypes: true, recursive: true });
        const sampleQuizPaths: Dirent<string>[] = await fs.readdir(sampleQuizzesFolder, { withFileTypes: true, recursive: true });
        const combinedArr = generatedQuizPaths.concat(sampleQuizPaths);
        const pathToFileMapping: PathToFileMapping = {}
        combinedArr.forEach((ele: Dirent<string>) => {
            const cleanedPath: string = removeMiddlePathSegment(ele.path.split("data/")[1], "quiz")

            if (!(cleanedPath in pathToFileMapping)) {
                pathToFileMapping[cleanedPath] = [];
            }
            if (ele.name.includes(".question") || ele.name.includes(".json")) {
                pathToFileMapping[cleanedPath].push(ele.name);
            }
        })
        return NextResponse.json(pathToFileMapping);
    } catch (e) {
        return NextResponse.json({
            status: 500,
            data: null,
            error: e
        });
    }
}
