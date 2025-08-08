import type { Metadata } from "next"
import { Inter, Poppins, Lora, Fira_Code } from "next/font/google"
import "./globals.css"
import { ClerkClientProvider } from "./providers/clerk-provider"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })
const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins'
})
const lora = Lora({ 
  subsets: ["latin"],
  variable: '--font-lora'
})
const firaCode = Fira_Code({ 
  subsets: ["latin"],
  variable: '--font-fira-code'
})

export const metadata: Metadata = {
  title: "Social Bubble Internal Platform",
  description: "Internal agency platform for Social Bubble",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${lora.variable} ${firaCode.variable} font-sans`}>
        <ClerkClientProvider>
          {children}
          <Toaster />
        </ClerkClientProvider>
      </body>
    </html>
  )
}