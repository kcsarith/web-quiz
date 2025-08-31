import { NextResponse } from "next/server";
import { Dirent, promises as fs } from "fs";
import path from "path";


type PathToFileMapping = {
    [filePath: string]: string[];
}
export async function GET(params: { url: string }) {
    try {
        const generatedQuizzesFolder: string = path.join(process.cwd(), "data", "quizzes");
        const sampleQuizzesFolder: string = path.join(process.cwd(), "data", "samples", "quizzes");
        const generatedQuizPaths: Dirent<string>[] = await fs.readdir(generatedQuizzesFolder, { withFileTypes: true, recursive: true });
        const sampleQuizPaths: Dirent<string>[] = await fs.readdir(sampleQuizzesFolder, { withFileTypes: true, recursive: true });
        const combinedArr = generatedQuizPaths.concat(sampleQuizPaths);
        const pathToFileMapping: PathToFileMapping = {}
        combinedArr.forEach((ele: Dirent<string>) => {
            const cleanedPath: string = ele.path.split("data/")[1]
            if (!(cleanedPath in pathToFileMapping)) {
                pathToFileMapping[cleanedPath] = [];
            }
            if (ele.name.includes(".question")) {
                pathToFileMapping[cleanedPath].push(ele.name);
            }
        })
        return NextResponse.json({
            status: 200,
            data: pathToFileMapping,
            error: null
        });
    } catch (e) {
        return NextResponse.json({
            status: 500,
            data: null,
            error: e
        });
    }
}
