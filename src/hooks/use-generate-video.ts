import { useState } from 'react';
import { generateVideoJson } from '@/lib/api/generate-video';

interface GenerateVideoRequest {
  userPrompt: string;
  instagram: string;
  telegram: string;
}

interface GenerateVideoResponse {
  success: boolean;
  htmlCode: string;
  brandIdentity?: Record<string, unknown>;
}

interface UseGenerateVideoState {
  loading: boolean;
  error: string | null;
  data: GenerateVideoResponse | null;
}

export function useGenerateVideo(initialState?: Partial<UseGenerateVideoState>) {
  const [state, setState] = useState<UseGenerateVideoState>({
    loading: false,
    error: null,
    data: null,
    ...initialState,
  });

  const generateVideo = async (request: GenerateVideoRequest): Promise<GenerateVideoResponse | null> => {
    setState({ loading: true, error: null, data: null });

    try {
      const result = await generateVideoJson({
        data: {
          description: request.userPrompt,
          brandUrl: request.instagram || request.telegram || '',
          extractedBrand: {},
        },
      });

      if (!result?.schema) throw new Error('No video schema returned');

      const data: GenerateVideoResponse = {
        success: true,
        htmlCode: JSON.stringify(result.schema),
        brandIdentity: {},
      };
      setState({ loading: false, error: null, data });
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setState({ loading: false, error: errorMessage, data: null });
      return null;
    }
  };

  const reset = () => setState({ loading: false, error: null, data: null });

  return { ...state, generateVideo, reset };
}
