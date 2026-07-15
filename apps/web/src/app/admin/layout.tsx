import { AdminLayoutWithBranch } from "@/components/admin-layout";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminLayoutWithBranch>{children}</AdminLayoutWithBranch>;
}
