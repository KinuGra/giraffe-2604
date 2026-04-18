import { MarketingPanel } from "@/features/auth/marketing-panel";
import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_460px]">
      {/* Left: Marketing panel (hidden on mobile) */}
      <div className="hidden lg:block">
        <MarketingPanel />
      </div>

      {/* Right: Login form */}
      <LoginForm />
    </div>
  );
}
