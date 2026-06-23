export function QuotePanel({ quote, dark }) {
  const card = dark ? 'bg-zinc-900' : 'bg-white'
  const skeleton = dark ? 'bg-zinc-700' : 'bg-gray-200'

  if (!quote) {
    return (
      <div className={`${card} rounded-xl p-4 h-full flex flex-col items-center justify-center gap-3 animate-pulse`}>
        <div className={`h-3 ${skeleton} rounded w-1/4`} />
        <div className={`h-4 ${skeleton} rounded w-full`} />
        <div className={`h-4 ${skeleton} rounded w-5/6`} />
        <div className={`h-3 ${skeleton} rounded w-1/3 mt-1`} />
      </div>
    )
  }

  return (
    <div className={`${card} rounded-xl p-4 h-full flex flex-col items-center justify-center text-center gap-2`}>
      <p className="text-indigo-600 text-xs font-semibold uppercase tracking-wider">
        Daily Quote
      </p>
      <blockquote className={`text-lg font-bold italic leading-relaxed ${dark ? 'text-gray-100' : 'text-gray-900'}`}>
        &ldquo;{quote.text}&rdquo;
      </blockquote>
      {quote.author && (
        <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-900'}`}>— {quote.author}</p>
      )}
    </div>
  )
}
