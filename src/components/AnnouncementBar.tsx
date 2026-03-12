export default function AnnouncementBar({ text }: { text: string }) {
  return (
    <div className="bg-gradient-to-r from-indigo-700 via-fuchsia-600 to-cyan-600 border-y border-zinc-800">
      <div className="mx-auto max-w-7xl px-4 py-2 overflow-hidden">
        <div className="whitespace-nowrap animate-marquee text-white font-medium">
          <span className="mx-8">{text}</span>
          <span className="mx-8">{text}</span>
          <span className="mx-8">{text}</span>
        </div>
      </div>
    </div>
  );
}
