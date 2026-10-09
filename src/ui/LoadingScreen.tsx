import { useState, useEffect } from 'react'

interface LoadingScreenProps {
  onLoaded: () => void
}

export function LoadingScreen({ onLoaded }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          // Fade out then hide
          setTimeout(() => {
            setIsVisible(false)
            onLoaded()
          }, 500)
          return 100
        }
        // Increase by random amount, slowing near end
        const increment = prev < 70 ? Math.random() * 15 + 5 : Math.random() * 5 + 1
        return Math.min(prev + increment, 100)
      })
    }, 100)

    return () => clearInterval(interval)
  }, [onLoaded])

  if (!isVisible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0a0a0f',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        opacity: progress >= 100 ? 0 : 1,
        transition: 'opacity 0.5s ease-out',
        pointerEvents: progress >= 100 ? 'none' : 'auto',
      }}
    >
      {/* Title */}
      <h1
        style={{
          color: '#ffffff',
          fontSize: 48,
          fontWeight: 'bold',
          marginBottom: 8,
          letterSpacing: 4,
          fontFamily: 'monospace',
        }}
      >
        NEON CITY
      </h1>

      {/* Subtitle */}
      <p
        style={{
          color: '#00ffff',
          fontSize: 14,
          marginBottom: 40,
          fontFamily: 'monospace',
        }}
      >
        Drive Through Tech
      </p>

      {/* Progress bar container */}
      <div
        style={{
          width: 300,
          height: 8,
          backgroundColor: '#ffffff22',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        {/* Progress bar fill */}
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: '#00ffff',
            transition: 'width 0.1s ease-out',
          }}
        />
      </div>

      {/* Loading text */}
      <p
        style={{
          color: '#ffffff88',
          fontSize: 12,
          marginTop: 16,
          fontFamily: 'monospace',
        }}
      >
        {progress < 30 && 'Loading assets...'}
        {progress >= 30 && progress < 60 && 'Building city...'}
        {progress >= 60 && progress < 90 && 'Starting engine...'}
        {progress >= 90 && 'Get ready!'}
      </p>
    </div>
  )
}
