import React from 'react';
import { Check, X } from 'lucide-react';

export function PasswordStrengthMeter({ strength }) {
  const { score, requirements } = strength;

  const getStrengthLabel = () => {
    switch (score) {
      case 0:
      case 1:
        return 'Very Weak';
      case 2:
        return 'Weak';
      case 3:
        return 'Fair';
      case 4:
        return 'Good';
      case 5:
        return 'Strong';
      default:
        return 'Unknown';
    }
  };

  const getStrengthColor = () => {
    switch (score) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
        return 'bg-lime-500';
      case 5:
        return 'bg-green-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getTextColor = () => {
    switch (score) {
      case 0:
      case 1:
        return 'text-red-400';
      case 2:
        return 'text-orange-400';
      case 3:
        return 'text-yellow-400';
      case 4:
        return 'text-lime-400';
      case 5:
        return 'text-green-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="mt-3 space-y-3">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className={`text-xs font-medium ${getTextColor()}`}>
            Password Strength: {getStrengthLabel()}
          </span>
          <span className="text-xs text-slate-400">{score}/5</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${getStrengthColor()} transition-all duration-300`}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2">
          {requirements.minLength ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <X className="w-4 h-4 text-red-400" />
          )}
          <span className={requirements.minLength ? 'text-green-400' : 'text-slate-400'}>
            8+ characters
          </span>
        </div>

        <div className="flex items-center gap-2">
          {requirements.hasUppercase ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <X className="w-4 h-4 text-red-400" />
          )}
          <span className={requirements.hasUppercase ? 'text-green-400' : 'text-slate-400'}>
            Uppercase (A-Z)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {requirements.hasLowercase ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <X className="w-4 h-4 text-red-400" />
          )}
          <span className={requirements.hasLowercase ? 'text-green-400' : 'text-slate-400'}>
            Lowercase (a-z)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {requirements.hasNumber ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <X className="w-4 h-4 text-red-400" />
          )}
          <span className={requirements.hasNumber ? 'text-green-400' : 'text-slate-400'}>
            Number (0-9)
          </span>
        </div>

        <div className="flex items-center gap-2 col-span-2">
          {requirements.hasSpecial ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <X className="w-4 h-4 text-red-400" />
          )}
          <span className={requirements.hasSpecial ? 'text-green-400' : 'text-slate-400'}>
            Special character (!@#$%^&*)
          </span>
        </div>
      </div>
    </div>
  );
}
