'use client'

export const MagicalBackground = () => {
  return (
    <div className="fixed inset-0 z-0 bg-fantasy-bg">
      {/* Background texture overlay */}
      <div className="absolute inset-0 bg-texture opacity-30"></div>

      {/* Vignette effect */}
      <div className="absolute inset-0 bg-vignette pointer-events-none"></div>

      {/* Magical glow orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-forest/20 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-gold-ancient/10 rounded-full blur-[100px] animate-pulse-slow"
        style={{ animationDelay: '2s' }}
      ></div>

      {/* Decorative SVG elements */}
      <svg
        className="absolute top-0 left-0 w-64 h-64 text-forest-deep/60 pointer-events-none"
        fill="currentColor"
        viewBox="0 0 100 100"
      >
        <path
          d="M0,0 L0,40 Q10,35 20,45 T40,40 T60,50 T80,40 L100,0 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
        ></path>
        <path
          d="M-10,-10 C20,10 10,50 40,60 C50,65 30,80 50,90"
          fill="none"
          stroke="#1a2f1a"
          strokeWidth="2"
        ></path>
        <path
          d="M0,0 C20,20 10,60 30,80"
          fill="none"
          opacity="0.5"
          stroke="#2d4a2d"
          strokeWidth="3"
        ></path>
        <circle cx="20" cy="30" fill="#2d4a2d" r="3"></circle>
        <circle cx="35" cy="55" fill="#3a5c3a" r="4"></circle>
        <circle cx="10" cy="50" fill="#2d4a2d" r="2"></circle>
      </svg>

      {/* Firefly animations - MATCHING ORIGINAL DESIGN */}
      <div
        className="absolute w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_10px_#fbbf24]"
        style={{
          top: '70%',
          left: '20%',
          animation: 'fly 10s linear infinite',
        }}
      ></div>
      <div
        className="absolute w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_10px_#fbbf24]"
        style={{
          top: '50%',
          left: '80%',
          animation: 'fly 10s linear infinite 2s',
        }}
      ></div>
      <div
        className="absolute w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_10px_#fbbf24]"
        style={{
          top: '80%',
          left: '50%',
          animation: 'fly 10s linear infinite 4s',
        }}
      ></div>
      <div
        className="absolute w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_10px_#fbbf24]"
        style={{
          top: '30%',
          left: '30%',
          animation: 'fly 10s linear infinite 1s',
        }}
      ></div>
      <div
        className="absolute w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_10px_#fbbf24]"
        style={{
          top: '20%',
          left: '70%',
          animation: 'fly 10s linear infinite 5s',
        }}
      ></div>

      {/* Additional fireflies for more magical effect */}
      <div
        className="absolute w-2 h-2 bg-yellow-300 rounded-full shadow-[0_0_8px_#fde047]"
        style={{
          top: '60%',
          left: '10%',
          animation: 'fly 12s linear infinite 3s',
        }}
      ></div>
      <div
        className="absolute w-2 h-2 bg-yellow-300 rounded-full shadow-[0_0_8px_#fde047]"
        style={{
          top: '40%',
          left: '90%',
          animation: 'fly 12s linear infinite 6s',
        }}
      ></div>
      <div
        className="absolute w-2 h-2 bg-yellow-300 rounded-full shadow-[0_0_8px_#fde047]"
        style={{
          top: '85%',
          left: '15%',
          animation: 'fly 12s linear infinite 8s',
        }}
      ></div>
    </div>
  )
}
