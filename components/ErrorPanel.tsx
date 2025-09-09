'use client';
export default function ErrorPanel({ message, detail }: { message: string; detail?: string }) {
  if (!message) return null;
  return (
    <div className="bg-red-950/40 border border-red-700 text-red-200 rounded p-3 text-sm animate-fade-in">
      <div className="font-semibold">Error</div>
      <div>{message}</div>
      {detail && <pre className="mt-2 text-xs whitespace-pre-wrap opacity-80">{detail}</pre>}
    </div>
  );
}

