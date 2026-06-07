import { useState } from 'react';
import { useGenerateVideo } from '@/hooks/use-generate-video';
import { VideoPreview } from '@/components/VideoPreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Example: VideoGeneratorDemo
 *
 * This component demonstrates the complete flow:
 * 1. User enters business description and social handles
 * 2. Calls the dual-agent API endpoint
 * 3. Displays the generated video preview
 * 4. Shows brand identity JSON
 */
export function VideoGeneratorDemo() {
  const { loading, error, data, generateVideo, reset } = useGenerateVideo();
  const [formData, setFormData] = useState({
    userPrompt: '',
    instagram: '',
    telegram: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await generateVideo(formData);
  };

  const handleReset = () => {
    reset();
    setFormData({
      userPrompt: '',
      instagram: '',
      telegram: '',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">SOTA flovo</h1>
          <p className="text-slate-400">Generate premium 30-second video ads with AI</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Input Form */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6 backdrop-blur-sm sticky top-8">
              <h2 className="text-lg font-semibold text-white mb-4">Create Video</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Business Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Business Idea or Product
                  </label>
                  <textarea
                    name="userPrompt"
                    value={formData.userPrompt}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        userPrompt: e.target.value,
                      }))
                    }
                    placeholder="Describe your business idea, product, or service..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-colors resize-none h-24"
                  />
                </div>

                {/* Instagram Handle */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Instagram Handle
                  </label>
                  <Input
                    type="text"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleInputChange}
                    placeholder="@yourhandle"
                    className="bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                  />
                </div>

                {/* Telegram Link */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Telegram Channel
                  </label>
                  <Input
                    type="text"
                    name="telegram"
                    value={formData.telegram}
                    onChange={handleInputChange}
                    placeholder="t.me/yourchannel"
                    className="bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={loading || !formData.userPrompt || !formData.instagram || !formData.telegram}
                    className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-medium rounded-lg py-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Generating...' : 'Generate Video'}
                  </Button>
                  {data && (
                    <Button
                      type="button"
                      onClick={handleReset}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg py-2 transition-colors"
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </form>

              {/* Generation Progress */}
              {loading && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                    Processing with AI agents...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Preview & Results */}
          <div className="lg:col-span-2">
            {/* Video Preview */}
            {data?.htmlCode && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-white mb-4">Video Preview</h2>
                <VideoPreview htmlCode={data.htmlCode} />
              </div>
            )}

            {/* Brand Identity JSON */}
            {data?.brandIdentity && (
              <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6 backdrop-blur-sm">
                <h2 className="text-lg font-semibold text-white mb-4">Brand Identity</h2>
                <div className="bg-slate-950 rounded-lg p-4 overflow-auto max-h-96">
                  <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap break-words">
                    {JSON.stringify(data.brandIdentity, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!data && !loading && (
              <div className="flex items-center justify-center h-96 bg-slate-900/30 border-2 border-dashed border-slate-700 rounded-xl">
                <div className="text-center">
                  <svg
                    className="w-16 h-16 text-slate-600 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-slate-400 font-medium">Your video will appear here</p>
                  <p className="text-slate-500 text-sm mt-2">Fill in the form and click "Generate Video"</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoGeneratorDemo;
