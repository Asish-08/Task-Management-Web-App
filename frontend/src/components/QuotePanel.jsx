export function QuotePanel({ quote }) {
  if (!quote) {
    return (
      <div className="bg-white rounded-xl p-4 h-full flex flex-col items-center justify-center gap-3 animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-1/4" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-3 bg-gray-200 rounded w-1/3 mt-1" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-4 h-full flex flex-col items-center justify-center text-center gap-2">
      <p className="text-indigo-600 text-xs font-semibold uppercase tracking-wider">
        Daily Quote
      </p>
      <blockquote className="text-gray-900 text-lg font-bold italic leading-relaxed">
        &ldquo;{quote.text}&rdquo;
      </blockquote>
      {quote.author && (
        <p className="text-gray-900 text-xs">— {quote.author}</p>
      )}
    </div>
  )
}
