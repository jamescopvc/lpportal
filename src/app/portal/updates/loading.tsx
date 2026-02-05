export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="flex gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-black" style={{ animation: "fade-pulse 1.2s ease-in-out infinite" }} />
        <div className="w-1.5 h-1.5 rounded-full bg-black" style={{ animation: "fade-pulse 1.2s ease-in-out 0.2s infinite" }} />
        <div className="w-1.5 h-1.5 rounded-full bg-black" style={{ animation: "fade-pulse 1.2s ease-in-out 0.4s infinite" }} />
      </div>
    </div>
  );
}
