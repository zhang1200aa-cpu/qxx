import { CheckCircle2 } from "lucide-react";
import { getLang } from "@/lib/i18n";
import { getDict } from "@/lib/i18n-dict";

/** Hero 下方的信任徽章 */
export async function TrustBadges() {
  const lang = await getLang();
  const dict = getDict(lang);
  const badges = [
    dict.trust.official,
    dict.trust.liveSync,
    dict.trust.noSignup,
  ];

  return (
    <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
      {badges.map((badge) => (
        <li
          key={badge}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
          {badge}
        </li>
      ))}
    </ul>
  );
}