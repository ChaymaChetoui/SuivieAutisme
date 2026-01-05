// src/components/common/EmotionBadge.jsx
import { Smile, Frown, Angry, AlertCircle, Sparkles, Meh, ThumbsDown } from 'lucide-react';
import { clsx } from 'clsx';

const emotionConfig = {
  joie: {
    icon: Smile,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    label: 'Joie'
  },
  tristesse: {
    icon: Frown,
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    label: 'Tristesse'
  },
  colère: {
    icon: Angry,
    color: 'bg-red-100 text-red-800 border-red-300',
    label: 'Colère'
  },
  peur: {
    icon: AlertCircle,
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    label: 'Peur'
  },
  surprise: {
    icon: Sparkles,
    color: 'bg-pink-100 text-pink-800 border-pink-300',
    label: 'Surprise'
  },
  neutre: {
    icon: Meh,
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    label: 'Neutre'
  },
  dégoût: {
    icon: ThumbsDown,
    color: 'bg-green-100 text-green-800 border-green-300',
    label: 'Dégoût'
  }
};

const EmotionBadge = ({ emotion, size = 'md', showIcon = true, className = '' }) => {
  const config = emotionConfig[emotion] || emotionConfig.neutre;
  const Icon = config.icon;

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium border',
        config.color,
        sizes[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  );
};

export default EmotionBadge;