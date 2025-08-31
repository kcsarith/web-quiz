import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { TeacherType } from "@/types";
export async function GET(params: { url: string; }) {
    try {
        const splitUrl = params.url.split("/");
        const teacher = splitUrl[splitUrl.length-1];
        console.log(teacher)
        const teacherPath = path.join(process.cwd(), "data", "samples", "teachers", teacher, "data.json")
        const teacherContent: string = await fs.readFile(teacherPath, "utf-8")
        const teacherJson: TeacherType = JSON.parse(teacherContent) as TeacherType
        return NextResponse.json({
            status: 200,
            data: teacherJson,
            error: null
        })
    } catch (e) {
        console.log(e)
        return NextResponse.json({
            status: 500,
            data: null,
            error: e
        })
    }
}
