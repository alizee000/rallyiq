import React, { useState, useEffect } from 'react';

interface PlayerAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: string;
  textSize?: string;
  className?: string;
}

export default function PlayerAvatar({
  name,
  avatarUrl,
  size = 'w-8 h-8',
  textSize = 'text-xs',
  className = '',
}: PlayerAvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error state if avatarUrl changes
  useEffect(() => {
    setHasError(false);
  }, [avatarUrl]);

  const cleanName = (name || '').trim();
  const initial = (cleanName.charAt(0) || '?').toUpperCase();

  if (avatarUrl && !hasError) {
    return (
      <img
        src={avatarUrl}
        alt={cleanName}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setHasError(true)}
        className={`${size} rounded-full object-cover shrink-0 border border-white shadow-sm ${className}`}
      />
    );
  }

  return (
    <div
      className={`${size} rounded-full bg-gradient-to-tr from-lime-DEFAULT/30 to-cyan-DEFAULT/30 text-graphite-100 font-black ${textSize} flex items-center justify-center shrink-0 border border-white shadow-sm ${className}`}
      title={cleanName}
    >
      {initial}
    </div>
  );
}
