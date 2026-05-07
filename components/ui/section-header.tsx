type Props = { title: string; subtitle?: string };
export default function SectionHeader({ title, subtitle }: Props) {
  return (
    <div className="space-y-3">
      <h1 className="page-title">{title}</h1>
      {subtitle ? <p className="max-w-3xl leading-relaxed text-zinc-300">{subtitle}</p> : null}
    </div>
  );
}
