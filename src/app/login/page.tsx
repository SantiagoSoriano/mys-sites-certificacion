import { redirect } from "next/navigation";

// /login queda como alias legacy — todo el flujo vive en /
export default function LoginRedirect() {
  redirect("/");
}
