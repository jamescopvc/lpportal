export default async function PortalHome({
  searchParams,
}: {
  searchParams: Promise<{ fund?: string }>;
}) {
  const params = await searchParams;
  const fundParam = params.fund ? `?fund=${params.fund}` : "";

  const cards = [
    {
      label: "Fund Stats",
      href: `/portal/stats${fundParam}`,
      desc: "Performance metrics and historical data",
    },
    {
      label: "Portfolio",
      href: `/portal/portfolio${fundParam}`,
      desc: "Companies and investments",
    },
    {
      label: "Updates",
      href: `/portal/updates${fundParam}`,
      desc: "Latest updates from the team",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
      <h1 className="text-5xl font-light tracking-tight text-center mb-20">
        Welcome to ScOp
      </h1>
      <div className="grid grid-cols-3 gap-px bg-gray-200 max-w-2xl w-full">
        {cards.map((card) => (
          <a
            key={card.label}
            href={card.href}
            className="bg-white p-10 text-center hover:bg-gray-50 transition-colors"
          >
            <p className="font-semibold tracking-tight">{card.label}</p>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              {card.desc}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
