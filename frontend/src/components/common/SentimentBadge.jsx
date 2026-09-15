import React from 'react';
import { Smile, Meh, Frown, Sparkles } from 'lucide-react';

export default function SentimentBadge({ sentiment = 'Neutral', score, confidence, size = 'md' }) {
  const sent = (sentiment || 'Neutral').toLowerCase();

  let config = {
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    icon: Smile,
    label: 'Positive',
    badgeDot: 'bg-emerald-500'
  };

  if (sent === 'negative') {
    config = {
      bg: 'bg-rose-50 border-rose-200 text-rose-700',
      icon: Frown,
      label: 'Negative',
      badgeDot: 'bg-rose-500'
    };
  } else if (sent === 'neutral') {
    config = {
      bg: 'bg-amber-50 border-amber-200 text-amber-700',
      icon: Meh,
      label: 'Neutral',
      badgeDot: 'bg-amber-500'
    };
  }

  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm ${config.bg} ${sizeClasses}`}
        title={`Sentiment: ${config.label}${score !== undefined ? ` (Polarity: ${score})` : ''}${confidence !== undefined ? ` | Confidence: ${Math.round(confidence * 100)}%` : ''}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.badgeDot} animate-pulse`} />
        <Icon className="w-3.5 h-3.5" />
        <span>{config.label}</span>
        {confidence !== undefined && (
          <span className="text-[10px] opacity-75 font-normal ml-0.5">
            {Math.round(confidence * 100)}%
          </span>
        )}
      </span>
    </div>
  );
}
