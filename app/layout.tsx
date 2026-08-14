import "./styles.css";

export const metadata = {
  title: "Chelsi's Little Corner",
  description: "A private little digital world made by Raj for Chelsi.",
  robots: { index: false, follow: false }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
