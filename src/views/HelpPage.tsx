import React from 'react';
import { Link } from 'react-router-dom';

const HelpPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-blue-900">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/10 border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">📚 WOT Help Center</h1>
              <p className="text-slate-400 text-sm">Everything you need to know about the Dashboard</p>
            </div>
            <Link 
              to="/sme" 
              className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
        {/* Section 1: Dashboard Overview */}
        <section className="mb-8">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">📊</span>
              <h2 className="text-3xl font-bold text-white">1. The Dashboard Overview</h2>
            </div>
            
            <p className="text-slate-300 mb-6 leading-relaxed">
              The WOT Dashboard uses a <span className="font-semibold text-blue-300">Kanban Pipeline</span> to reflect your production workflow. Your goal is to move every order from left to right by simply clicking the action button on the order card.
            </p>

            {/* Status Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20 bg-white/5">
                    <th className="px-6 py-4 text-left font-bold text-blue-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left font-bold text-blue-300 uppercase tracking-wider">Meaning</th>
                    <th className="px-6 py-4 text-left font-bold text-blue-300 uppercase tracking-wider">Responsible</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {[
                    { status: '⭐ NEW', meaning: 'Order received (from WhatsApp). Requires processing.', responsible: 'SME Staff' },
                    { status: '⚙️ PROCESSING', meaning: 'Order is being prepared/packed.', responsible: 'SME Staff' },
                    { status: '📦 READY', meaning: 'Order ready for rider/dispatch. Requires Rider Phone.', responsible: 'SME Staff' },
                    { status: '🚀 DISPATCHED', meaning: 'Rider is on the way. Customer gets Live Tracking.', responsible: 'Rider/System' },
                    { status: '✅ COMPLETED', meaning: 'Delivered, payment confirmed, and rated.', responsible: 'SME/System' },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">{row.status}</td>
                      <td className="px-6 py-4 text-slate-300">{row.meaning}</td>
                      <td className="px-6 py-4 text-slate-300">{row.responsible}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 2: Core Actions */}
        <section className="mb-8">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">⚡</span>
              <h2 className="text-3xl font-bold text-white">2. Core Actions</h2>
            </div>

            {/* Action A: Create Order */}
            <div className="mb-8 p-6 bg-linear-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/30 rounded-xl">
              <h3 className="text-xl font-bold text-emerald-300 mb-4 flex items-center gap-2">
                <span className="text-2xl">➕</span> A. Creating a New Order
              </h3>
              <ul className="space-y-3 text-slate-200">
                <li className="flex gap-3">
                  <span className="text-emerald-400 font-bold">1.</span>
                  <span>Click the <span className="bg-white/10 px-2 py-1 rounded font-mono text-sm">+ New Order</span> button (top right).</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-400 font-bold">2.</span>
                  <span>Input: <span className="text-emerald-300 font-semibold">Customer Name, Phone, Address, Price</span></span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-400 font-bold">3.</span>
                  <span>Click <span className="bg-white/10 px-2 py-1 rounded font-mono text-sm">Create Order</span> — it appears in the NEW column.</span>
                </li>
              </ul>
            </div>

            {/* Action B: Assign Rider */}
            <div className="p-6 bg-linear-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl">
              <h3 className="text-xl font-bold text-blue-300 mb-4 flex items-center gap-2">
                <span className="text-2xl">🚚</span> B. Assigning a Rider (READY Status)
              </h3>
              <p className="text-slate-300 mb-4">Critical for <span className="font-semibold text-blue-300">Better Visibility</span> & <span className="font-semibold text-blue-300">Greener Growth</span></p>
              <ul className="space-y-3 text-slate-200 mb-4">
                <li className="flex gap-3">
                  <span className="text-blue-400 font-bold">1.</span>
                  <span>Find the order in the <span className="bg-white/10 px-2 py-1 rounded font-mono text-sm">READY</span> column.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-400 font-bold">2.</span>
                  <span>Click <span className="bg-white/10 px-2 py-1 rounded font-mono text-sm">🎯 Assign Rider</span></span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-400 font-bold">3.</span>
                  <span>Enter the <span className="font-semibold text-blue-300">Rider Phone Number</span> and confirm.</span>
                </li>
              </ul>

              {/* Automation Impact Box */}
              <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                <p className="font-bold text-yellow-300 mb-2">🤖 AUTOMATION IMPACT (WABA Triggers):</p>
                <ul className="space-y-1 text-slate-200 text-sm">
                  <li>✓ Rider receives PWA Link via WhatsApp to start GPS tracking</li>
                  <li>✓ Customer receives Live Tracking Link & confirmation</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Rider & Tracking */}
        <section className="mb-8">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">🛣️</span>
              <h2 className="text-3xl font-bold text-white">3. Rider Link & Customer Tracking</h2>
            </div>

            {/* Rider Action */}
            <div className="mb-8 p-6 bg-linear-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl">
              <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                <span className="text-2xl">🏍️</span> Rider Action (No App Download!)
              </h3>
              <ul className="space-y-3 text-slate-200">
                <li className="flex gap-3">
                  <span className="text-purple-400 font-bold">1.</span>
                  <span>Rider clicks the WOT link in WhatsApp</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-purple-400 font-bold">2.</span>
                  <span>Accepts browser prompt to <span className="font-semibold text-purple-300">share location</span></span>
                </li>
                <li className="flex gap-3">
                  <span className="text-purple-400 font-bold">3.</span>
                  <span>Upon delivery, taps <span className="bg-white/10 px-2 py-1 rounded font-mono text-sm">Delivered & Paid</span> to stop tracking.</span>
                </li>
              </ul>
            </div>

            {/* Customer Satisfaction */}
            <div className="p-6 bg-linear-to-br from-pink-500/20 to-pink-600/20 border border-pink-500/30 rounded-xl">
              <h3 className="text-xl font-bold text-pink-300 mb-4 flex items-center gap-2">
                <span className="text-2xl">😊</span> Customer Satisfaction (CSAT)
              </h3>
              <ul className="space-y-3 text-slate-200">
                <li className="flex gap-3">
                  <span className="text-pink-400 font-bold">✓</span>
                  <span>Customer receives a <span className="font-semibold text-pink-300">2-tap CSAT Survey</span> link after delivery</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-pink-400 font-bold">✓</span>
                  <span>Feedback instantly visible on your Dashboard for insights</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Tips Section */}
        <section className="mb-8">
          <div className="backdrop-blur-xl bg-linear-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-2xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-blue-300 mb-6 flex items-center gap-2">
              <span>💡</span> Pro Tips
            </h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="font-semibold text-white">Always Verify Phone Numbers</p>
                  <p className="text-slate-300 text-sm">Ensure rider phone numbers are correct to avoid delivery delays.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="font-semibold text-white">Monitor the Kanban Board</p>
                  <p className="text-slate-300 text-sm">Keep orders flowing from left to right to maintain efficiency.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">📍</span>
                <div>
                  <p className="font-semibold text-white">Check Customer Feedback</p>
                  <p className="text-slate-300 text-sm">Use CSAT ratings to improve service quality continuously.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-white/10">
          <p className="text-slate-400 text-sm">
            <span className="font-semibold text-blue-300">WOT:</span> Built for Smarter Workflows, Better Visibility, and Greener Growth.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;