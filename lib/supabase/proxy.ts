import { createServerClient } from "@supabase/ssr";
import {
  NextResponse,
  type NextRequest,
} from "next/server";

function getSupabaseConfig() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase URL and publishable key are missing."
    );
  }

  return {
    supabaseUrl,
    supabaseKey,
  };
}

export async function updateSession(
  request: NextRequest
) {
  let supabaseResponse =
    NextResponse.next({
      request,
    });

  const {
    supabaseUrl,
    supabaseKey,
  } = getSupabaseConfig();

  const supabase =
    createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },

          setAll(
            cookiesToSet,
            headers
          ) {
            cookiesToSet.forEach(
              ({ name, value }) => {
                request.cookies.set(
                  name,
                  value
                );
              }
            );

            supabaseResponse =
              NextResponse.next({
                request,
              });

            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                supabaseResponse.cookies.set(
                  name,
                  value,
                  options
                );
              }
            );

            Object.entries(
              headers
            ).forEach(
              ([key, value]) => {
                supabaseResponse.headers.set(
                  key,
                  value
                );
              }
            );
          },
        },
      }
    );

  /*
   * Verify the authenticated user's token
   * and refresh the session when necessary.
   */
  const { data } =
    await supabase.auth.getClaims();

  const user =
    data?.claims;

  /*
   * Public routes
   */
  const pathname =
    request.nextUrl.pathname;

  const isLoginPage =
    pathname.startsWith(
      "/login"
    );

  const isAuthRoute =
    pathname.startsWith(
      "/auth"
    );

  const isCustomerGallery =
    pathname.startsWith(
      "/gallery"
    );

  /*
   * Protect internal routes.
   */
  if (
    !user &&
    !isLoginPage &&
    !isAuthRoute &&
    !isCustomerGallery
  ) {
    const url =
      request.nextUrl.clone();

    url.pathname =
      "/login";

    return NextResponse.redirect(
      url
    );
  }

  /*
   * If already logged in and
   * trying to visit /login,
   * send them to the admin dashboard.
   */
  if (
    user &&
    isLoginPage
  ) {
    const url =
      request.nextUrl.clone();

    url.pathname =
      "/admin";

    return NextResponse.redirect(
      url
    );
  }

  return supabaseResponse;
}