import { promises as fs, readFile } from "fs";
import path, { resolve } from "path";

import { PollyClient } from "@aws-sdk/client-polly";

export const pollyClient = new PollyClient({ region: "us-east-1" });

export function updateObjectShallow<T extends Record<PropertyKey, any>>(
    source: Record<PropertyKey, any>,
    target: T,
): T {
    Object.keys(target).forEach((key) => {
        if (key in source) {
            source[key as keyof T] = target[key];
        }
    });
    return source;
}

export type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export function updateObjectDeep<T extends Record<string, any>>(source: T, target: DeepPartial<T>): T {
    if (!target || typeof target !== 'object') {
        return source;
    }

    Object.keys(target).forEach((key) => {
        const typedKey = key as keyof typeof target;
        const targetValue = target[typedKey];

        if (!source.hasOwnProperty(key)) {
            source[key as keyof T] = targetValue as any;
            return;
        }

        const sourceValue = source[key as keyof T];

        if (
            targetValue &&
            typeof targetValue === 'object' &&
            !Array.isArray(targetValue) &&
            sourceValue &&
            typeof sourceValue === 'object' &&
            !Array.isArray(sourceValue)
        ) {
            updateObjectDeep(
                sourceValue as Record<string, any>,
                targetValue as DeepPartial<Record<string, any>>
            );
        } else {
            source[key as keyof T] = targetValue as any;
        }
    });

    return source;
}

export function readFileAndParseJson(pathToSearch: string): Promise<Record<string, any>> {
    const filePath: string = path.join(process.cwd(), pathToSearch)

    return new Promise<Record<string, any>>((resolve, reject) => {
        readFile(filePath, "utf-8", (err, data) => {
            if (err) {
                reject({ error: err.message });
            } else {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject({ error: e });
                }
            }
        })
    })

}

export function removeMiddlePathSegment(path: string, segmentToRemove: string) {
    const segments = path.split('/');
    const indexToRemove = segments.indexOf(segmentToRemove);

    if (indexToRemove !== -1) {
        // Remove the segment at the found index
        segments.splice(indexToRemove, 1);
    }

    return segments.join('/');
}
