import * as React from "react";
import { redirect } from "next/navigation";

export default function TryoutResultRedirect(props: { params: Promise<{ id: string }> }) {
  const { id } = React.use(props.params);
  redirect(`/student/exam/${id}/result`);
}