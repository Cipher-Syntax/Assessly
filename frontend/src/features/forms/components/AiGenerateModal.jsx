import React, { useState } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';

const AiGenerateModal = ({ isOpen, onClose, onGenerate, isGenerating }) => {
    const [prompt, setPrompt] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (prompt.trim()) {
            onGenerate(prompt);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4">
            <div className="w-full max-w-lg rounded-xl border border-default bg-secondary shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-default px-6 py-4">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-primary">
                        <Sparkles className="h-5 w-5 text-[var(--primary-500)]" />
                        Generate Questions with AI
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isGenerating}
                        className="rounded-lg p-1 text-secondary transition hover:bg-tertiary hover:text-primary disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6">
                    <p className="mb-4 text-sm text-secondary">
                        Describe what kind of questions you want to add to your form. For example: "5 multiple choice questions about ancient Rome" or "a feedback survey for a software product".
                    </p>
                    
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter your prompt here..."
                        disabled={isGenerating}
                        className="w-full rounded-lg border border-default bg-tertiary p-3 text-sm text-primary placeholder:text-muted focus:border-[var(--primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)] min-h-[120px] resize-none disabled:opacity-70"
                        autoFocus
                    />
                    
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isGenerating}
                            className="rounded-lg border border-default px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-tertiary hover:text-primary disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isGenerating || !prompt.trim()}
                            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary-500)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-600)] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    Generate
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AiGenerateModal;
