export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-4">
      <div className="skeleton h-10 w-64" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-40" />
        ))}
      </div>
    </div>
  );
}
