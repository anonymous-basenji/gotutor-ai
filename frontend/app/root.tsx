import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import UserProvider from "./lib/UserProvider";
import "./styles/index.css";
import "./styles/app.css";

export default function Root() {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <Meta />
        <Links />
      </head>
      <body>
        <div id="root">
          <UserProvider>
            <Outlet />
          </UserProvider>
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
