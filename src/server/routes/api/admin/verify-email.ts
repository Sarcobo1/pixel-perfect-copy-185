import { defineEventHandler, createError } from "h3";

export default defineEventHandler(async (_event) => {
  throw createError({ statusCode: 410, statusMessage: "Deprecated – use Replit Auth" });
});
