import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderByToken, useSubmitCSAT } from '../hooks/useOrders';
import { AlertCircle, CheckCircle } from 'lucide-react';

const CsatSubmission: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { order, isLoading, error } = useOrderByToken(token);
  const { submit, isSubmitting } = useSubmitCSAT(order?.id || '');

  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (selectedScore: number) => {
    if (!order?.id) return;

    setScore(selectedScore);
    await submit(selectedScore, comment);
    setIsSubmitted(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-emerald-400 border-t-emerald-500 animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading feedback form...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-900/30 border border-red-500 rounded-2xl p-8 max-w-sm w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg font-bold mb-2">Invalid Feedback Link</p>
          <p className="text-red-200">This feedback form has expired or is invalid</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <CheckCircle className="w-20 h-20 text-white mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-2">Thank You!</h2>
          <p className="text-emerald-100 mb-6">
            Your feedback has been recorded. We appreciate your business and look forward to serving you again!
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full px-6 py-3 bg-white text-emerald-600 rounded-xl font-bold hover:bg-emerald-50 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">How was your experience?</h1>
          <p className="text-slate-600">Order #{order.readable_id} - {order.customer_name}</p>
        </div>

        {/* Score Selection */}
        <div className="space-y-4 mb-8">
          <button
            onClick={() => handleSubmit(5)}
            disabled={isSubmitting}
            className="w-full px-6 py-6 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all transform hover:scale-105 text-2xl"
          >
            <span className="text-5xl">⭐</span>
            <span>Loved it!</span>
          </button>

          <button
            onClick={() => handleSubmit(3)}
            disabled={isSubmitting}
            className="w-full px-6 py-6 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all transform hover:scale-105 text-2xl"
          >
            <span className="text-5xl">⚠️</span>
            <span>Had issues</span>
          </button>
        </div>

        {/* Comment Section */}
        {score !== null && !isSubmitted && (
          <div className="mt-8 border-t border-slate-200 pt-8">
            <label className="block text-sm font-bold text-slate-900 mb-3">
              {score === 5 ? 'Tell us what you loved!' : 'Tell us what went wrong'}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Your feedback helps us improve..."
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        )}

        {/* Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-sm text-blue-700">
            ✨ Your feedback is valuable and helps other customers make better choices
          </p>
        </div>
      </div>
    </div>
  );
};

export default CsatSubmission;
