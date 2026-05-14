import type { Metadata } from "next"
import { Container, Page, PageContent } from "@ui/components/layout"
import { Heading, Text } from "@ui/components/typography"
import {
  STORE_CONTAINER_INSET,
  STORE_CONTAINER_MAX_DEFAULT,
  STORE_PAGE_CONTENT_CLASS,
} from "@ui/lib/layout-shell"
import { ContactSection } from "@/features/pages/home-page/sub-sections/contact-section"
import { buildSeoMetadata } from "@/lib/seo"

export const metadata: Metadata = buildSeoMetadata({
  title: "Liên hệ hỗ trợ phụ huynh",
  description:
    "Gửi yêu cầu hỗ trợ, góp ý hoặc phản ánh đến nhà trường qua hệ thống HUB Parent.",
  path: "/lien-he",
})

export default function ContactPage() {
  return (
    <Page>
      <PageContent className={STORE_PAGE_CONTENT_CLASS}>
        <Container
          max={STORE_CONTAINER_MAX_DEFAULT}
          className={`${STORE_CONTAINER_INSET} space-y-3 pb-0`}
        >
          <Heading as="h1" size="section">
            Liên hệ hỗ trợ
          </Heading>
          <Text variant="muted" className="max-w-3xl">
            Gửi yêu cầu hỗ trợ, góp ý hoặc phản ánh trực tiếp đến nhà trường.
            Thông tin sẽ được ghi nhận vào hệ thống để bộ phận phụ trách tiếp
            nhận và phản hồi.
          </Text>
        </Container>
        <ContactSection className="pt-8" />
      </PageContent>
    </Page>
  )
}
