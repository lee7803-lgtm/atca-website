import { BrandMark } from "@/components/BrandMark";
import { IconBadge, type IconBadgeName } from "@/components/IconBadge";

const orbitNodes: Array<{
  label: string;
  icon: IconBadgeName;
  className: string;
}> = [
  { label: "协会展示", icon: "association", className: "left-3 top-[24%] sm:left-8" },
  { label: "道士认证", icon: "certification", className: "right-3 top-[24%] sm:right-8" },
  { label: "会员申请", icon: "membership", className: "left-5 bottom-[25%] sm:left-12" },
  { label: "证书查询", icon: "query", className: "right-5 bottom-[25%] sm:right-12" },
  { label: "联系合作", icon: "contact", className: "left-1/2 top-4 -translate-x-1/2" }
];

export function OrbitVisual() {
  return (
    <div className="visual-stage">
      <div className="absolute inset-8 rounded-full border border-gold/15" aria-hidden="true" />
      <div className="absolute inset-16 rounded-full border border-[#7F1D1D]/10" aria-hidden="true" />
      <div className="absolute inset-24 rounded-full border border-gold/10" aria-hidden="true" />
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative grid place-items-center">
          <div className="absolute h-56 w-56 rounded-full bg-[#7F1D1D]/[0.035] blur-xl sm:h-72 sm:w-72" />
          <BrandMark size="lg" />
        </div>
      </div>
      {orbitNodes.map((item) => (
        <div className={`orbital-label ${item.className}`} key={item.label}>
          <IconBadge name={item.icon} size="sm" />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
