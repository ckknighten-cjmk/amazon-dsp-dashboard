import { ShieldOff } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { defaultPathFor } from "../lib/rbac";

export default function Unauthorized() {
  const { user } = useAuth();
  const home = user ? defaultPathFor(user.role) : "/login";
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="card max-w-md p-8 text-center">
        <ShieldOff className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">Access restricted</h1>
        <p className="mt-2 text-sm text-slate-500">
          This workspace is limited by role. Switch accounts or return to your home view.
        </p>
        <Link
          to={home}
          className="mt-6 inline-flex rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-ink-950"
        >
          Go back
        </Link>
      </div>
    </div>
  );
}
