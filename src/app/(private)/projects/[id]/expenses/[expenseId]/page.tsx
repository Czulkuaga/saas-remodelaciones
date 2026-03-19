import { getProjectExpenseDetailAction } from "@/action/projects/get-project-expense-detail.action";
import { ProjectExpenseDetailClient } from "@/components/private/projects/expenses/detail/ProjectExpenseDetailClient";
import { notFound } from "next/navigation";

export default async function ProjectExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string; expenseId: string }>;
}) {
  const { id, expenseId} = await params;

  const res = await getProjectExpenseDetailAction(id, expenseId);

  if (!res.ok) {
    notFound();
  }

  return (
    <ProjectExpenseDetailClient
      projectId={id}
      expenseId={expenseId}
      data={res}
    />
  );
}