// Redirect /auth/signin → /auth/login
import { redirect } from "next/navigation";

export default function SignInRedirect() {
  redirect("/auth/login");
}
