import { PollyClient } from "@aws-sdk/client-polly";

export const pollyClient = new PollyClient({ region: "us-east-1" });
