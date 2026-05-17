import { Badge } from "@ui/components/badge";
import type { TaxonomyOption } from "./types";

export function SummaryBadges({ items }: { items: TaxonomyOption[] }) {
  if (!items.length) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {items.slice(0, 2).map((item) => (
        <Badge key={item.id} variant="outline" className="text-[10px]">
          {item.name}
        </Badge>
      ))}
      {items.length > 2 ? (
        <Badge variant="secondary" className="text-[10px]">
          +{items.length - 2}
        </Badge>
      ) : null}
    </div>
  );
}
