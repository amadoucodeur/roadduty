import { LoginForm } from "@/components/login-form"
import { Truck } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 flex-col justify-between text-primary-foreground">
        <div className="flex items-center gap-3">
          <Truck className="h-8 w-8" />
          <span className="text-2xl font-bold">RoadDuty</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-5xl font-bold leading-tight text-balance">
            Manage Your Driving Hours in Full Compliance
          </h1>
          <p className="text-xl text-primary-foreground/90 leading-relaxed">
            Track your daily logs in compliance with DOT regulations. Simple, fast, and secure.
          </p>
        </div>

        <div className="space-y-4 text-sm text-primary-foreground/80">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span>DOT Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span>Real-time Tracking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span>Automated Reports</span>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center justify-center gap-3">
            <Truck className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">RoadDuty</span>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
