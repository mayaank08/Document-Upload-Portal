'use client'

interface HeaderProps {
  progress: number
}

export default function Header({ progress }: HeaderProps) {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(Math.max(progress, 0), 100)
  const circumference = 2 * Math.PI * 28
  const offset = circumference - (normalizedProgress / 100) * circumference

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <span className="text-green-600 font-bold text-xl">M</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            Document Upload Portal
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {/* Logo Icon - Building/House */}
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 21H21M5 21V7L12 3L19 7V21M9 9V21M15 9V21"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {/* Logo Text */}
            <span className="text-sm font-semibold text-gray-900">Broker</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-16 relative">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#E5E7EB"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#10B981"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-semibold text-gray-700">
                  {Math.round(normalizedProgress)}%
                </span>
              </div>
            </div>
            <span className="text-sm text-green-600 font-medium">
              Completed
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

