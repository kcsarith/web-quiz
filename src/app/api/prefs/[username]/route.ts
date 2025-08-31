import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(params: { url: string }) {
    try {
        const username: string = params.url.split("prefs/")[1]
        const filePath: string = path.join(process.cwd(), "data", "prefs", `${username}.json`)
        const fileContents: string = await fs.readFile(filePath, "utf-8")
        const fileObject = JSON.parse(fileContents);
        return NextResponse.json({
            status: 200,
            data: fileObject,
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
