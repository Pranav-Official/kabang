import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  component: LoginPage,
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
})

function LoginPage() {
  return null
}
