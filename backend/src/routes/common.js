import mongoose from "mongoose";

export const asyncRoute = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const bad = (message, status = 400) =>
  Object.assign(new Error(message), { status });

export const parse = (schema, body) => {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw Object.assign(bad("Please check the submitted information."), {
      details: result.error.flatten(),
    });
  }
  return result.data;
};

export const id = (value) => {
  if (!mongoose.isValidObjectId(value)) throw bad("Invalid record id.");
  return value;
};
