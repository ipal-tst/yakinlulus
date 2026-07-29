import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get user role from cookie (frontend uses yakinlulus-* prefixed, but backend sets 'token')
    const role = request.cookies.get("yakinlulus-role")?.value || request.cookies.get("role")?.value || "student";
    const isAuthenticated = Boolean(request.cookies.get("yakinlulus-token")?.value || request.cookies.get("token")?.value);

    // RBAC Guard Rules (case-insensitive role check)
    const roleLower = role.toLowerCase();
    if (pathname.startsWith("/admin") && roleLower !== "admin") {
        return NextResponse.redirect(new URL("/login?reason=unauthorized_admin", request.url));
    }

    if (pathname.startsWith("/staff") && roleLower !== "staff" && roleLower !== "admin") {
        return NextResponse.redirect(new URL("/login?reason=unauthorized_staff", request.url));
    }

    if (pathname.startsWith("/teacher") && roleLower !== "teacher" && roleLower !== "admin" && roleLower !== "staff") {
        return NextResponse.redirect(new URL("/login?reason=unauthorized_teacher", request.url));
    }

    if (pathname.startsWith("/student") && !isAuthenticated) {
        return NextResponse.redirect(new URL("/login?reason=unauthenticated", request.url));
    }

    // Public routes - allow
    if (pathname.startsWith("/api") || pathname.startsWith("/login") || pathname.startsWith("/register") || pathname === "/") {
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/student/:path*", "/teacher/:path*", "/staff/:path*", "/admin/:path*"],
};
