import { Dirent, promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const generatedTeachersFolder: string = path.join(process.cwd(), "data", "teachers")
        const sampleTeachersFolder: string = path.join(process.cwd(), "data", "samples", "teachers")

        const generatedTeacherPaths: Dirent<string>[] = await fs.readdir(generatedTeachersFolder, { withFileTypes: true })
        const sampleTeacherPaths: Dirent<string>[] = await fs.readdir(sampleTeachersFolder, { withFileTypes: true })

        return NextResponse.json({
                generated: generatedTeacherPaths,
                samples: sampleTeacherPaths
            }
        )

    } catch (e) {
        console.error(e)
        return NextResponse.json({
            error: e,
        }, { status: 500 })
    }
}
