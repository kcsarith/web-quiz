import { NextResponse } from "next/server";
import { Dirent, promises as fs } from "fs"
import path from "path"

export async function GET() {
    try {
        const teachersFolder: string = path.join(process.cwd(), "data", "samples", "teachers")
        const teacherItems: Dirent<string>[] = await fs.readdir(teachersFolder, { withFileTypes: true })
        return NextResponse.json({
            status: 200,
            data: teacherItems,
            error: null
        })
    } catch (e) {
        return NextResponse.json({
            status: 500,
            data: null,
            error: e
        })
    }
}
