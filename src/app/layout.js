import "./globals.css";
import Nav from "@/components/Nav";
import PageTransition from "@/components/PageTransition";

export const metadata = {
  title: "NextJS x GSAP Page Transitions | Codegrid",
  description: "NextJS x GSAP Page Transitions | Codegrid",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PageTransition>
          <Nav />
          {children}
        </PageTransition>
      </body>
    </html>
  );
}
