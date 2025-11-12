"use client";

import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Play } from 'lucide-react';

interface OptimizedVideoProps {
  src: string;
  fallbackSrc?: string;
  poster?: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  onError?: (error: Event) => void;
  onLoad?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const OptimizedVideo: React.FC<OptimizedVideoProps> = ({
  src,
  fallbackSrc,
  poster,
  className = '',
  controls = true,
  autoPlay = false,
  muted = false,
  loop = false,
  playsInline = false,
  preload = 'metadata',
  onError,
  onLoad,
  onPlay,
  onPause,
  onEnded,
  style,
  children,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasTriedFallback, setHasTriedFallback] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle video error
  const handleError = (event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    try {
      const errorEvent = event.nativeEvent;
      const videoElement = event.currentTarget;
      
      // Get more detailed error information
      const errorInfo = {
        code: videoElement.error?.code || 'unknown',
        message: videoElement.error?.message || 'Video failed to load',
        networkState: videoElement.networkState,
        readyState: videoElement.readyState,
        src: videoElement.src,
        currentSrc: videoElement.currentSrc
      };
      
      console.error('Video error:', errorInfo);
      
      // Try fallback source if available and not already tried
      if (fallbackSrc && !hasTriedFallback && currentSrc === src) {
        console.log('Trying fallback video source:', fallbackSrc);
        setCurrentSrc(fallbackSrc);
        setHasTriedFallback(true);
        setIsLoading(true);
        setHasError(false);
        return;
      }
      
      setHasError(true);
      setIsLoading(false);
      
      // Call the onError prop if provided
      if (onError) {
        onError(errorEvent);
      }
    } catch (error) {
      console.error('Error in handleError:', error);
      setHasError(true);
      setIsLoading(false);
    }
  };

  // Handle video load
  const handleLoad = () => {
    console.log('Video loaded successfully:', currentSrc);
    setIsLoading(false);
    setHasError(false);
    if (onLoad) {
      onLoad();
    }
  };

  // Handle video play
  const handlePlay = () => {
    setIsPlaying(true);
    if (onPlay) {
      onPlay();
    }
  };

  // Handle video pause
  const handlePause = () => {
    setIsPlaying(false);
    if (onPause) {
      onPause();
    }
  };

  // Handle video ended
  const handleEnded = () => {
    setIsPlaying(false);
    if (onEnded) {
      onEnded();
    }
  };

  // Reset error state when src changes
  useEffect(() => {
    if (src) {
      setHasError(false);
      setIsLoading(true);
      setCurrentSrc(src);
      setHasTriedFallback(false);
    }
  }, [src]);

  // Add error boundary for video element
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleVideoError = (e: Event) => {
      console.error('Native video error:', e);
      const target = e.target as HTMLVideoElement;
      if (target.error) {
        console.error('Video error details:', {
          code: target.error.code,
          message: target.error.message,
          networkState: target.networkState,
          readyState: target.readyState
        });
      }
    };

    const handleLoadStart = () => {
      console.log('Video load started:', src);
    };

    const handleCanPlay = () => {
      console.log('Video can play:', src);
    };

    videoElement.addEventListener('error', handleVideoError);
    videoElement.addEventListener('loadstart', handleLoadStart);
    videoElement.addEventListener('canplay', handleCanPlay);
    
    return () => {
      videoElement.removeEventListener('error', handleVideoError);
      videoElement.removeEventListener('loadstart', handleLoadStart);
      videoElement.removeEventListener('canplay', handleCanPlay);
    };
  }, [src]);

  // If there's an error, show error state
  if (hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}
        style={style}
      >
        <div className="text-center space-y-2 p-4">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Failed to load video
          </p>
          <button
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
              if (videoRef.current) {
                videoRef.current.load();
              }
            }}
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={style}>
      <video
        ref={videoRef}
        src={currentSrc}
        poster={poster}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        preload={preload}
        onError={handleError}
        onLoadedData={handleLoad}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        className="w-full h-full object-cover"
        {...props}
      >
        <track kind="captions" srcLang="en" label="English captions" />
        {children}
      </video>
      
      {/* Loading overlay */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading video...</p>
          </div>
        </div>
      )}
      
      {/* Play button overlay for non-autoplay videos */}
      {!autoPlay && !isPlaying && !isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.play();
              }
            }}
            className="w-16 h-16 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
          >
            <Play className="w-8 h-8 text-white ml-1" />
          </button>
        </div>
      )}
    </div>
  );
};

export default OptimizedVideo;
