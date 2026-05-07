import Link from 'next/link';

type Props = { href: string; label: string; variant?: 'primary' | 'secondary' };
export default function CTAButton({ href, label, variant = 'secondary' }: Props) {
  return (
    <Link href={href} className={variant === 'primary' ? 'primary-btn' : 'secondary-btn'}>
      {label}
    </Link>
  );
}
