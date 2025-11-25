import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

const CsatSubmission: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [score, setScore] = useState<number | null>(null);
    const [comment, setComment] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (score === null) return alert("Please select a score."); // Use custom modal in final product

        setIsSubmitting(true);
        console.log(`Submitting CSAT for token ${token}: Score=${score}, Comment=${comment}`);

        // FR3.3: POST /public/orders/:token/csat (Mocking the public API call)
        // In production: Use Tanstack Mutation here
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        setIsSubmitting(false);
        setIsSubmitted(true);
    };

    if (isSubmitted) {
        return (
        <div className="min-h-screen bg-linear-to-br from-white via-blue-50 to-blue-100 flex items-center justify-center p-4">
            <div className="bg-white border border-blue-100 rounded-2xl p-8 text-center max-w-sm">
                <div className="text-6xl mb-4 flex justify-center">✅</div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Thank You!</h1>
                <p className="text-lg text-slate-600 mb-6">
                        Your feedback helps us improve delivery and build trust with our community.
                    </p>
                    <div className="text-xs text-slate-600 bg-blue-50 rounded-lg p-3 border border-blue-200">
                        Token: {token}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-white via-blue-50 to-blue-100 flex items-center justify-center p-4">
            <div className="bg-white border border-blue-100 rounded-2xl p-8 max-w-lg w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4">⭐</div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Rate Your Delivery</h1>
                    <p className="text-slate-600">
                        How would you rate the transparency and speed of your delivery experience?
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Rating Selector */}
                    <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                        <p className="text-slate-600 text-sm mb-4">Select a rating:</p>
                        <div className="flex justify-between gap-2">
                            {[
                                { score: 5, emoji: '😍', label: 'Excellent' },
                                { score: 4, emoji: '😊', label: 'Good' },
                                { score: 3, emoji: '😐', label: 'Okay' },
                                { score: 2, emoji: '😟', label: 'Poor' },
                                { score: 1, emoji: '😡', label: 'Terrible' }
                            ].map(({ score: s, emoji, label }) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setScore(s)}
                                    className={`flex-1 py-4 px-2 rounded-xl transition-all duration-200 transform ${
                                        score === s 
                                            ? 'bg-linear-to-br from-blue-500 to-blue-600 text-white scale-110 shadow-lg' 
                                            : 'bg-blue-50 hover:bg-blue-100 border border-blue-200 text-slate-700'
                                    }`}
                                    title={label}
                                >
                                    <span className="text-3xl block mb-1">{emoji}</span>
                                    <span className="text-xs font-semibold">{s}★</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Score Display */}
                    {score !== null && (
                        <div className="text-center p-4 bg-blue-100 border border-blue-200 rounded-xl">
                            <p className="text-slate-600 text-sm">Your Rating</p>
                            <p className="text-slate-900 font-bold text-lg mt-1">
                                {score === 5 ? '⭐ Excellent' : score === 4 ? '⭐ Good' : score === 3 ? '⭐ Okay' : score === 2 ? '⭐ Poor' : '⭐ Terrible'}
                            </p>
                        </div>
                    )}

                    {/* Comment Section */}
                    <div>
                        <label htmlFor="comment" className="block text-sm font-semibold text-slate-900 mb-2">
                            📝 Additional Comments (Optional)
                        </label>
                        <textarea
                            id="comment"
                            rows={4}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                            placeholder="Tell us what we did well, or how we can improve... (e.g., rider punctuality, packaging, communication)"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={score === null || isSubmitting}
                        className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl text-lg font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Submitting...
                            </>
                        ) : (
                            <>
                                <span>Send Feedback</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </>
                        )}
                    </button>

                    {/* Info Text */}
                    <p className="text-center text-xs text-slate-400">
                        Your feedback is important and helps us serve you better. It will never be shared without consent.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default CsatSubmission;