/**
 * Global styles import.
 */
import "./globals.css";

/**
 * Global metadata for SEO and browser tab display.
 */
export const metadata = {
  title: "MyKeeper",
  description: "MyKeeper — Keep your files safe and organised.",
};

/**
 * Root layout serving as the base wrapper for the entire application.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
