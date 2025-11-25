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
            <div className="p-8 text-center max-w-md mx-auto bg-white min-h-screen flex flex-col justify-center items-center">
                <i className="fa-solid fa-check-circle text-green-500 text-6xl mb-4"></i>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Thank You!</h1>
                <p className="text-lg text-gray-600">Your feedback helps us improve delivery and build trust.</p>
                <div className="mt-8 text-sm text-gray-500">Order Token: {token}</div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8 max-w-lg mx-auto bg-white min-h-screen font-sans">
            <h1 className="text-2xl font-bold mb-4 text-blue-700 text-center">Rate Your Delivery</h1>
            <p className="text-lg text-gray-600 mb-8 text-center">How would you rate the transparency and speed of your delivery service?</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex justify-center space-x-4">
                    {[5, 4, 3, 2, 1].map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setScore(s)}
                            className={`p-4 rounded-full transition duration-150 transform ${
                                score === s ? 'bg-yellow-500 shadow-lg scale-110' : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                        >
                            <span className="text-3xl">
                                {s === 5 ? '⭐️' : s === 4 ? '😊' : s === 3 ? '😐' : s === 2 ? '😟' : '😡'}
                            </span>
                        </button>
                    ))}
                </div>
                <p className="text-center text-sm text-gray-500">
                    {score !== null ? `You selected: ${score} Stars` : 'Tap to select a score'}
                </p>

                <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">Optional Comment:</label>
                    <textarea
                        id="comment"
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full border-gray-300 border rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Tell us what we did well, or how we can improve..."
                    ></textarea>
                </div>

                <button
                    type="submit"
                    disabled={score === null || isSubmitting}
                    className="w-full bg-blue-600 text-white p-3 rounded-lg text-lg font-bold shadow-md hover:bg-blue-700 disabled:bg-gray-400 transition duration-150"
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
            </form>
        </div>
    );
};

export default CsatSubmission;