import { pipeline, FeatureExtractionPipeline } from '@huggingface/transformers';

export class EmbeddingService {
    private static instance: EmbeddingService;
    private extractor: FeatureExtractionPipeline | null = null;

    private readonly MODEL_NAME = 'Xenova/all-mpnet-base-v2';

    private constructor() { }

    public static getInstance(): EmbeddingService {
        if (!EmbeddingService.instance) {
            EmbeddingService.instance = new EmbeddingService();
        }
        return EmbeddingService.instance;
    }

    public async initialize(): Promise<void> {
        if (this.extractor) return;

        try {
            this.extractor = await pipeline('feature-extraction', this.MODEL_NAME, {
                dtype: 'q8', 
            });

        } catch (error) {
            console.error('[EmbeddingService] Failed to load AI model:', error);
            throw error;
        }
    }

    public async generateVector(text: string): Promise<number[]> {
        if (!this.extractor) {
            await this.initialize();
        }

        const output = await this.extractor!(text, {
            pooling: 'mean',
            normalize: true,
        });

        return Array.from(output.data);
    }
}