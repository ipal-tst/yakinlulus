import { redirect } from "next/navigation";

export default function TryoutRedirect() {
  redirect("/student/exam");
}