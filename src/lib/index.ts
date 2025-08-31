import { PollyClient } from "@aws-sdk/client-polly";

export const pollyClient = new PollyClient({ region: "us-east-1" });

export function updateObject<T extends Record<PropertyKey, any>>(
    target: T,
    source: Record<PropertyKey, any>
): T {
    Object.keys(source).forEach((key) => {
        if (key in target) {
            target[key as keyof T] = source[key];
        }
    });
    return target;
}
