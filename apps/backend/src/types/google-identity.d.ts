export {}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
          }) => void
          renderButton: (
            element: HTMLElement,
            options: {
              type?: string
              shape?: string
              theme?: string
              text?: string
              size?: string
              width?: number
            },
          ) => void
        }
      }
    }
  }
}
