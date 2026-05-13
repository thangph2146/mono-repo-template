import { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@ui/components/button";
import { Card, CardHeader, CardTitle, CardContent } from "@ui/components/card";
import { Text } from "@ui/components/typography";

export interface ContentCardButton {
  href: string;
  text: string;
  variant?: "default" | "outline" | "ghost";
  leftIcon?: ReactNode;
}

export interface ContentCardProps {
  title: string;
  description: string;
  buttons?: ContentCardButton[];
  children?: ReactNode;
}

export function ContentCard({ title, description, buttons = [], children }: ContentCardProps) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <Text variant="muted">{description}</Text>
      </CardHeader>
      {(buttons.length > 0 || children) && (
        <CardContent className="space-y-3">
          {buttons.map((btn) => (
            <Link key={btn.href} href={btn.href}>
              <Button variant={btn.variant ?? "outline"} className="w-full justify-start rounded-lg">
                {btn.leftIcon}
                <span>{btn.text}</span>
                <ArrowRight className="ml-auto size-4" />
              </Button>
            </Link>
          ))}
          {children}
        </CardContent>
      )}
    </Card>
  );
}
