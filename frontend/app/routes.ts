import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("sign-in", "routes/sign-in.tsx"),
  route("terms-of-service", "routes/terms.tsx"),
  route("user-dashboard", "routes/user-dashboard.tsx"),
  route("class/:classId", "routes/class.$classId.tsx"),
  route("conversation/:conversationId", "routes/conversation.$conversationId.tsx"),
] satisfies RouteConfig;
