// app/layout.js
import "./globals.css";
import PageTransition from "@/components/PageTransition";

export const metadata = {
  title: "Wesley Ting",
  description: "Wesley Ting Portfolio",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* IMPORTANT: start with 'show-splash' on body so splash is visible on first paint */}
      <body className="show-splash">
        <PageTransition>
          {children}
        </PageTransition>
      </body>
    </html>
  );
}
