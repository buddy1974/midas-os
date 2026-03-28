export default function NewsletterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4"
      style={{ backgroundColor: "var(--background)" }}>
      <h1
        className="text-4xl font-serif tracking-widest uppercase"
        style={{ color: "var(--color-gold)" }}
      >
        Newsletter
      </h1>
      <p className="text-sm tracking-wide" style={{ color: "var(--color-text-dim)" }}>
        Subscriber management and campaign analytics
      </p>
      <span
        className="text-xs px-3 py-1 rounded-full font-semibold tracking-widest uppercase"
        style={{
          backgroundColor: "rgba(201,168,76,0.15)",
          color: "var(--color-gold)",
          border: "1px solid rgba(201,168,76,0.3)",
        }}
      >
        Coming Soon
      </span>
    </div>
  );
}
