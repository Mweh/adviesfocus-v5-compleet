import "@/app/globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "AdviesFocus v5 — Demo",
  description: "AdviesFocus pensioenadvies platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div style={{ display: "flex", height: "100vh" }}>
          <Sidebar />
          <main style={{ flex: 1, overflow: "auto", background: "#f7f6f3" }}>{children}</main>
        </div>
      </body>
    </html>
  );
}
