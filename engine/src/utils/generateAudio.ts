import { elevenlabs } from "../lib/elevenlabs";
import { env } from "../lib/env";
import fs from 'node:fs/promises';
import path from 'node:path';
import { logger } from "../lib/logger";

export const generateAudio = async (content: string): Promise<string> => {
    try {
        const dataDir = './data';
        if (!await fs.exists(dataDir)) {
            await fs.mkdir(dataDir, { recursive: true });
        }

        const audioStream = await elevenlabs.generate({
            model_id: env.ELEVENLABS_MODEL_ID,
            voice: env.ELEVENLABS_VOICE_ID,
            text: content,
            output_format: "mp3_44100_128"
        });

        const filePath = path.join(dataDir, 'latest.mp3');
        
        // make a place for a new file
        if (await fs.exists(filePath)) {
            await fs.rm(filePath);
        }
        
        await fs.writeFile(filePath, audioStream);

        logger.info(`Voice generated successfully, saved as ${filePath}`);
        return filePath;
    } catch (err) {
        logger.error(err, "Failed to generate audio for message with ElevenLabs API");
        throw err;
    }
};