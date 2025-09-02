import { NextRequest, NextResponse } from "next/server";
import { Dirent, promises as fs } from "fs";
import path from "path";
import { defaultPrefs, UserPrefsType } from "@/types";
import { updateObjectShallow } from "@/lib";

export async function GET(params: { url: string }) {
    try {
        const generatedFolder: string = path.join(process.cwd(), "data", "prefs")
        const samplesFolder: string = path.join(process.cwd(), "data", "samples", "prefs")
        const generatedItems: Dirent<string>[] = await fs.readdir(generatedFolder, { withFileTypes: true })
        const sampleItems: Dirent<string>[] = await fs.readdir(samplesFolder, { withFileTypes: true })
        const combinedItems: Dirent<string>[] = generatedItems.concat(sampleItems);
        return NextResponse.json(combinedItems)
    } catch (e) {
        return NextResponse.json({
            error: e
        }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const generatedFolder: string = path.join(process.cwd(), "data", "prefs")
        const generatedItems: string[] = await fs.readdir(generatedFolder, { withFileTypes: false })
        const body: Record<string, any> = await request.json();

        const existingFiles: Set<string> = new Set()
        generatedItems.forEach((ele) => {
            console.log(ele)
            existingFiles.add(ele.split(".")[0])
        });

        const newPrefs = updateObjectShallow(defaultPrefs, body) as UserPrefsType;

        let sequence = 0;
        let nonCollidingUsername = newPrefs.username;
        while (existingFiles.has(nonCollidingUsername)) {
            if (sequence > 9999) {
                throw DOMException
            }
            let extraZeros = "";
            if (sequence < 1000) {
                extraZeros = "0"
            }
            if (sequence < 100) {
                extraZeros = "00"
            }
            if (sequence < 10) {
                extraZeros = "000"
            }
            nonCollidingUsername = `${newPrefs.username}_${extraZeros}${sequence}`
            sequence++
        }
        fs.writeFile(`data/prefs/${nonCollidingUsername}.json`, JSON.stringify(newPrefs))

        return NextResponse.json(
            newPrefs,
        );
    } catch (e) {
        return NextResponse.json({
            error: e instanceof Error ? e.message : 'Unknown error'
        }, { status: 500 });
    }
}
