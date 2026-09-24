import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  // Buat response awal yang meneruskan request headers
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Hanya proses rute /admin (dan sub-rutenya)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Pengecualian: /admin/login selalu bisa diakses tanpa authentication
    if (request.nextUrl.pathname.startsWith('/admin/login')) {
      return response;
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http')
        ? process.env.NEXT_PUBLIC_SUPABASE_URL
        : 'https://placeholder.supabase.co';
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

    // createServerClient langsung di Proxy context:
    // - Source cookie: request.cookies (dari HTTP request header)
    // - Destination cookie: response.cookies (diteruskan ke browser)
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Tulis cookie ke request agar tersedia di server chain
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Buat ulang response dengan request yang sudah diperbarui
          response = NextResponse.next({
            request,
          });
          // Tulis cookie ke response agar browser menerima token terbaru
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    // Verifikasi user melalui Supabase Auth server (validasi token ke server)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // LAYER 1: Application-level Authorization
    // Verify that the user is actually an administrator
    const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin', {
      target_user_id: user.id,
    });

    if (rpcError || !isAdmin) {
      // User is authenticated but not an admin. Kick them back with an error.
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
