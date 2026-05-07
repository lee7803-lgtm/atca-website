export default function PageHero({ children }: { children: React.ReactNode }) {
  return <section className="fade-in mx-auto w-full max-w-7xl px-6 pb-16 pt-6 md:px-12 md:pt-12">{children}</section>;
}
