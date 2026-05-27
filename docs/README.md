# Tài liệu monorepo (hub-parent-template)

Thư mục này tổ chức tài liệu cho agent/AI đọc nhanh và làm việc theo quy trình.

## Mục tiêu chính
- `docs/steps/*.md` là chuỗi bước step-by-step cho agent.
- `docs/hub-parent/` chứa tài liệu kiến trúc, quy trình bắt buộc và UX frontend.
- `docs/pages/` chứa guide implementation chi tiết cho các feature backend.

## Primary agent workflow
Agent nên dùng các file step-by-step này làm lộ trình chính:
- `docs/steps/step1_system_overview.md`
- `docs/steps/step2_clean_code_guidelines.md`
- `docs/steps/step3_hub_parent_docs.md`
- `docs/steps/step4_graphify_reading.md`
- `docs/steps/step5_feature_implementation_guides.md`
- `docs/steps/step6_code_execution_and_change_tracking.md`
- `docs/steps/step7_review_pr_and_system_memory.md`
- `docs/steps/step8_architecture_maintenance.md`
- `docs/steps/step9_follow_up_rollback_legacy_tracking.md`
- `docs/steps/step10_agent_task_automation.md`

## Supporting docs
- `docs/hub-parent/README.md` — giới thiệu nội dung thư mục `hub-parent`.
- `docs/hub-parent/PRE_CODE_PROTOCOL.md` — quy trình bắt buộc trước khi sửa code.
- `docs/hub-parent/MICROSERVICE_SYSTEM_MAP.md` — sơ đồ microservice và ranh giới.
- `docs/hub-parent/AGENTS_GUIDE.md` — hướng dẫn agent vận hành chi tiết.
- `docs/hub-parent/FRONTEND_UX.md` — UX storefront public.
- `docs/pages/README.md` — index các implementation guide.
- `docs/pages/*.md` — hướng dẫn chi tiết theo feature.

## Cách dùng
- Bắt đầu với `docs/steps/step1_system_overview.md` và dọc theo chuỗi step-by-step.
- Khi gặp task cụ thể, dùng `docs/steps/step5_feature_implementation_guides.md` để tìm `docs/pages/<feature>...`.
- Khi cần hiểu kiến trúc hoặc ranh giới service, mở `docs/hub-parent/*`.

## Tham chiếu nhanh
- `AGENTS.md` — entry point cho agent.
- `.graphify/markdown/SUMMARY_FOR_AI.md` — bản đồ monorepo.
- `packages/.graphify/markdown/SUMMARY_FOR_AI.md` — tóm tắt packages.

> Step docs là lộ trình chính. Các file trong `hub-parent/` và `pages/` là tài liệu tham khảo chi tiết bổ trợ.
