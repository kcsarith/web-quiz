import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { UserPrefsType, defaultPrefs } from "@/types";
import { readFileAndParseJson, updateObjectDeep } from "@/lib";
async function getUserPrefByName(name: string): Promise<UserPrefsType> {
    return defaultPrefs
}
export async function GET(request: NextRequest) {
    try {
        const username: string = request.url.split("prefs/")[1]
        const filePath: string = path.join("data", "prefs", `${username}.json`)
        const fileObject = readFileAndParseJson(filePath)
        return NextResponse.json(fileObject)
    } catch (e) {
        return NextResponse.json({
            error: e
        }, { status: 500 })

    }
}

export async function PUT(request: NextRequest) {
    try {
        const username: string = request.url.split("prefs/")[1]
        const filePath = path.join("data", "prefs", `${username}.json`)
        const body: Record<string, any> = await request.json();
        const fileObject = await readFileAndParseJson(filePath) as UserPrefsType
        const bodyKeys = Object.keys(body);
        bodyKeys.forEach((bodyKey: string) => {
            if (!(bodyKey in fileObject)) {
                delete body[bodyKey]
            }
        })
        const updatedObject: UserPrefsType = updateObjectDeep(fileObject, body)
        fs.writeFile(filePath, JSON.stringify(updatedObject))
        return NextResponse.json(updatedObject)
    } catch (e) {
        return NextResponse.json({ error: e }, { status: 500 })
    }
}
