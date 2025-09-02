import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { TeacherType } from "@/types";

// Helper function to check if a string is already base64
function isBase64(str: string): boolean {
    try {
        // Check if it's a data URL format
        if (str.startsWith('data:image/')) {
            return true;
        }
        // Check if it's a valid base64 string
        return btoa(atob(str)) === str;
    } catch (err) {
        return false;
    }
}

// Helper function to get MIME type from file extension
function getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml'
    };
    console.log(mimeTypes[ext], ext)
    return mimeTypes[ext] || 'image/png';
}

// Helper function to convert image file to base64 data URL
async function imageToBase64(imagePath: string): Promise<string> {
    try {
        const imageBuffer = await fs.readFile(imagePath);
        const mimeType = getMimeType(imagePath);
        const base64String = imageBuffer.toString('base64');
        return `data:${mimeType};base64,${base64String}`;
    } catch (error) {
        console.error(`Error reading image file: ${imagePath}`, error);
        throw error;
    }
}

export async function GET(params: { url: string; }) {
    try {
        const splitUrl = params.url.split("/");
        let teacher = splitUrl[splitUrl.length - 1];
        const isSample = teacher.includes("sample__");
        console.log(isSample);
        teacher = teacher.replace("sample__", "");
        let teacherPath = path.join(process.cwd(), "data", "teachers", teacher);

        if (isSample) {
            console.log("IS A SAMPLE")
            teacherPath = path.join(process.cwd(), "data", "samples", "teachers", teacher)
        }
        else {
            console.log("NOT A SAMLE")
        }
        const teacherDataPath = path.join(teacherPath, "data.json");
        const teacherContent: string = await fs.readFile(teacherDataPath, "utf-8");
        const teacherJson: TeacherType = JSON.parse(teacherContent) as TeacherType;

        // Process images to convert to base64 if they aren't already
        if (teacherJson.images) {
            const processedImages: { [key: string]: string } = {};

            for (const [emotion, imagePath] of Object.entries(teacherJson.images)) {
                if (typeof imagePath === 'string') {
                    if (isBase64(imagePath)) {
                        // Already base64, keep as is
                        processedImages[emotion] = imagePath;
                    } else {
                        // Convert file path to base64
                        try {
                            const fullImagePath = path.join(teacherPath, imagePath);
                            const base64Image = await imageToBase64(fullImagePath);
                            processedImages[emotion] = base64Image;
                        } catch (error) {
                            console.error(`Failed to process image ${imagePath} for emotion ${emotion}:`, error);
                            // Keep original path if conversion fails
                            processedImages[emotion] = imagePath;
                        }
                    }
                } else {
                    // Handle non-string values
                    processedImages[emotion] = imagePath;
                }
            }

            // Update the teacher object with processed images
            teacherJson.images = processedImages;
        }

        return NextResponse.json(teacherJson);
    } catch (e) {
        console.log(e);
        return NextResponse.json({
            error: e
        }, { status: 500 });
    }
}
