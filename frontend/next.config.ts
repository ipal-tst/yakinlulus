import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    images: {
        formats: ["image/avif", "image/webp"],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
        ],
    },
    experimental: {
        optimizePackageImports: ["lucide-react", "@phosphor-icons/react", "katex"],
    },
    transpilePackages: ["pdfjs-dist"],
    async rewrites() {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        return [
            {
                source: "/api/v1/:path*",
                destination: `${backendUrl.endsWith("/api/v1") ? backendUrl : `${backendUrl}/api/v1`}/:path*`,
            },
        ];
    },
};

export default nextConfig;
