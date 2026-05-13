import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Container, Page, PageContent } from "@ui/components/layout";
import { Heading, Text } from "@ui/components/typography";
import {
  STORE_CONTAINER_INSET,
  STORE_CONTAINER_MAX_DEFAULT,
  STORE_PAGE_CONTENT_CLASS,
} from "@ui/lib/layout-shell";

export const metadata: Metadata = {
  title: "Hướng dẫn sử dụng",
  description: "Hướng dẫn sử dụng hệ thống HUB.",
};

const steps = [
  "Dang nhap bang tai khoan duoc cap boi nha truong.",
  "Truy cap muc Bai viet de xem thong bao moi nhat.",
  "Xem huong dan va lien he bo phan ho tro khi can.",
];

export default function GuidePage() {
  return (
    <Page>
      <PageContent className={STORE_PAGE_CONTENT_CLASS}>
        <Container
          max={STORE_CONTAINER_MAX_DEFAULT}
          className={`${STORE_CONTAINER_INSET} space-y-6`}
        >
          <Heading as="h1" size="section">
            Huong dan su dung
          </Heading>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <Card key={step} className="rounded-lg">
                <CardHeader>
                  <CardTitle>Buoc {index + 1}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Text variant="small">{step}</Text>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </PageContent>
    </Page>
  );
}
