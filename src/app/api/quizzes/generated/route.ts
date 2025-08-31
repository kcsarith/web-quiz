import { NextResponse } from "next/server";
import { Dirent, promises as fs } from "fs";
import path from "path";


type PathToFileMapping = {
    [filePath: string]: string[];
}
export async function GET(params: { url: string }) {
    const generatedQuizzesFolder: string = path.join(process.cwd(), "data", "quizzes");
    const generatedQuizPaths: Dirent<string>[] = await fs.readdir(generatedQuizzesFolder, { withFileTypes: true, recursive: true });
    const pathToFileMapping: PathToFileMapping = {}
    generatedQuizPaths.forEach((ele: Dirent<string>) => {
        const cleanedPath: string = ele.path.split("data/")[1].replace("quizzes/", "").replace("quizzes", "")
        if (!(cleanedPath in pathToFileMapping)) {
            console.log(cleanedPath)
            pathToFileMapping[cleanedPath] = [];
        }
        if (ele.name.includes(".question")) {
            pathToFileMapping[cleanedPath].push(ele.name);
        }
    })
try {
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
