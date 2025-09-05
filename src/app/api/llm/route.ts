import { NextRequest, NextResponse } from "next/server";


const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.LLM_BEARER_TOKEN}`,
}

export async function GET(params: { url: string }) {
    try {
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.LLM_BEARER_TOKEN}`,
        }

        const response = await fetch(
            `${process.env.LLM_BASE_URL}/models`,
            {
                headers: headers
            }
        );
        const data = await response.json();


        return NextResponse.json(data)
    } catch (e) {
        return NextResponse.json({
            error: e
        }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const body: Record<string, any> = await request.json();
    const { model = "qwenqwen25-coder-32b-instruct", messages } = body;
    try {
        const response = await fetch(
            `${process.env.LLM_BASE_URL}/chat/completions`,
            {
                method: "POST",
                headers: headers,
                body: JSON.stringify({
                    "model": model,
                    "messages": messages
                }),
            }
        );
        const data = await response.json();

        return NextResponse.json(
            data.choices[0].message.content
        );
    } catch (e) {
        return NextResponse.json({
            error: e instanceof Error ? e.message : 'Unknown error'
        }, { status: 500 });
    }
}
