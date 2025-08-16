interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const CircularProgress = ({ 
  value, 
  size = 44, 
  strokeWidth = 3,
  className = "" 
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative">
      <svg
        className={`absolute inset-0 -rotate-90 transition-all duration-300 ${className}`}
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted-foreground) / 0.2)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circle with enhanced styling */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
          style={{
            filter: 'drop-shadow(0 0 6px hsl(var(--primary) / 0.5))',
            strokeDashoffset: offset
          }}
        />
        
        {/* Inner glow effect */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius - strokeWidth}
          fill="hsl(var(--primary) / 0.05)"
          className="transition-all duration-700"
        />
      </svg>
    </div>
  );
};