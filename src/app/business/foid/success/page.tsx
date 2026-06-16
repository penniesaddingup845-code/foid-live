export default function FoidSuccessPage() {
  return (
    <div className="mx-auto max-w-2xl text-center py-16">
      <div className="text-5xl mb-6">🎉</div>
      <h1 className="text-2xl font-bold text-stone-100 mb-2">Welcome to FOID!</h1>
      <p className="text-sm text-stone-400 mb-6">
        Your subscription is active. You're locked in at the early bird rate.
      </p>
      <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-left">
        <h2 className="text-sm font-medium text-stone-200 mb-3">What happens next:</h2>
        <ol className="space-y-2 text-sm text-stone-400">
          <li>1. Check your email for a welcome message</li>
          <li>2. Complete your intake form (link in email)</li>
          <li>3. We'll configure your intelligence lane within 24 hours</li>
          <li>4. Your first brief arrives the next morning</li>
        </ol>
      </div>
      <div className="mt-6">
        <a href="/" className="rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm text-stone-200 hover:border-white/20">
          Return to Command Palace
        </a>
      </div>
    </div>
  );
}
