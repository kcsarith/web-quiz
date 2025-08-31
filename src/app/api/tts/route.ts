import {
    SynthesizeSpeechCommand,
    OutputFormat,
    DescribeVoicesCommand
} from "@aws-sdk/client-polly";
import { pollyClient } from "@/lib";
import { NextResponse, NextRequest } from "next/server";

export async function GET() {
    try {
        const command = new DescribeVoicesCommand({});
        const voicesResponse = await pollyClient.send(command);
        const voices: any = {}
        voicesResponse.Voices?.forEach((v) => {
            const languageName = v.LanguageName;
            const gender = v.Gender;
            if (languageName) {
                if (!(languageName in voices)) {
                    voices[languageName] = {
                        male: [],
                        female: []
                    }
                }
                switch (gender) {
                    case "Male":
                        voices[languageName].male.push(v.Name)
                    case "Female":
                        voices[languageName].female.push(v.Name)
                }
            }
        });

        return NextResponse.json(voices)

    } catch (e) {
        console.error('Error fetching voices:', e);
        return NextResponse.json({
            status: 200,
            data: null,
            error: e,
        })
    }
}

export async function POST(request: NextRequest) {
    const requestBody = await request.json();
    try {
        const {
            Text: text = "",
            OutputFormat: outputFormat = OutputFormat.MP3,
            VoiceId: voiceId = "Ivy",
            SampleRate: sampleRate = "22050",
        } = requestBody

        const command: SynthesizeSpeechCommand = new SynthesizeSpeechCommand({
            Text: text,
            OutputFormat: outputFormat,
            VoiceId: voiceId,
            SampleRate: sampleRate,
        });

        const response = await pollyClient.send(command);

        const audioStream = response.AudioStream;

        if (!audioStream) {
            return NextResponse.json({
                error: "No audio stream received",
            }, { status: 500 });
        }
        const audioBytes = await audioStream.transformToByteArray();
        const audioBuffer = Buffer.from(audioBytes);

        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": audioBuffer.length.toString(),
                "Content-Disposition": "inline; filename=speech.mp3",
            },
        });
    } catch (e) {
        console.error("Error synthesizing speech:", e);
        let bodyText = "Couldn't find Text in Payload."
        if (requestBody.Text) {
            bodyText = requestBody.Text;
        }
        return NextResponse.json(
            {
                text: bodyText
            }, { status: 500 }
        );
    }
}
