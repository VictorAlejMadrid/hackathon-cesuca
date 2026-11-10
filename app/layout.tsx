import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Radar do Gestor | Hackathon CESUCA",
  description: "Dashboard de atendimento, uso e saúde da carteira com assistente analítico.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
