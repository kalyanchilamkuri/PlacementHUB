export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5">
      <div className="skeleton h-10 w-56" />
      <div className="grid gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-28" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-72" />
        ))}
      </div>
    </div>
  );
}
