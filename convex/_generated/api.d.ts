/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as companies from "../companies.js";
import type * as http from "../http.js";
import type * as invitations from "../invitations.js";
import type * as magicLinks from "../magicLinks.js";
import type * as notifications from "../notifications.js";
import type * as notificationsQueries from "../notificationsQueries.js";
import type * as reports from "../reports.js";
import type * as router from "../router.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  companies: typeof companies;
  http: typeof http;
  invitations: typeof invitations;
  magicLinks: typeof magicLinks;
  notifications: typeof notifications;
  notificationsQueries: typeof notificationsQueries;
  reports: typeof reports;
  router: typeof router;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
