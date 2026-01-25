import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Heart, Coffee, Sparkles, Check } from 'lucide-react';

export default function SupportModal({ isOpen, onClose }) {
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const presetAmounts = [5, 10, 25, 50];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = selectedAmount || customAmount;
    if (!amount) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  const handleClose = () => {
    setSelectedAmount(null);
    setCustomAmount('');
    setSubmitted(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-pink-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Support Us</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-10 h-10 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Thank You!</h3>
                <p className="text-slate-400 text-sm">
                  Your support means the world to us. We'll keep building amazing features for you!
                </p>
              </div>
              <Button
                onClick={handleClose}
                className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl"
              >
                Close
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <p className="text-slate-400 text-sm">
                  Help us keep Rent-A-Speaker running! Your donation helps us improve the platform and support our community.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Preset Amounts */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Select an amount
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {presetAmounts.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => {
                          setSelectedAmount(amount);
                          setCustomAmount('');
                        }}
                        className={`p-3 rounded-xl border font-semibold transition-all ${
                          selectedAmount === amount
                            ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                            : 'bg-slate-800 border-slate-700 text-white hover:border-slate-600'
                        }`}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Or enter a custom amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedAmount(null);
                      }}
                      className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 pl-8"
                      min="1"
                    />
                  </div>
                </div>

                {/* Perks */}
                <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Coffee className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-300">Buy the team a coffee</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-slate-300">Help us build new features</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Heart className="w-4 h-4 text-pink-400" />
                    <span className="text-slate-300">Support the creator community</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || (!selectedAmount && !customAmount)}
                  className="w-full h-12 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold rounded-xl disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 mr-2" />
                      Donate {selectedAmount ? `$${selectedAmount}` : customAmount ? `$${customAmount}` : ''}
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-slate-500">
                  This is a demo donation form. No actual payment will be processed.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
