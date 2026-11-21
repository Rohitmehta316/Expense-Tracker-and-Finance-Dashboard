import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "fintrack-test-secret-with-enough-entropy";

const { app } = await import("../server.js");
const { Category, User, Wallet } = await import("../src/models/index.js");
const originalMethods = {
  categoryCreate: Category.create,
  userCreate: User.create,
  userExists: User.exists,
  userFindOne: User.findOne,
  walletCreate: Wallet.create,
};

function assertJwtCookie(response) {
  const cookie = response.headers["set-cookie"]?.find((value) =>
    value.startsWith("fintrack_token="),
  );
  assert.ok(cookie, "expected an auth cookie");
  assert.match(cookie, /HttpOnly/i);
  const token = decodeURIComponent(cookie.split(";")[0].slice("fintrack_token=".length));
  assert.equal(jwt.verify(token, process.env.JWT_SECRET).sub, "65a100000000000000000001");
}

beforeEach(() => {
  User.exists = async () => false;
  User.create = async (user) => ({
    ...user,
    id: "65a100000000000000000001",
    currency: "INR",
    theme: "light",
  });
  Category.create = async () => ({});
  Wallet.create = async () => ({});
});

afterEach(() => {
  User.exists = originalMethods.userExists;
  User.create = originalMethods.userCreate;
  User.findOne = originalMethods.userFindOne;
  Category.create = originalMethods.categoryCreate;
  Wallet.create = originalMethods.walletCreate;
});

test("registration creates the account and issues an HttpOnly JWT cookie", async () => {
  let savedUser;
  User.create = async (user) => {
    savedUser = user;
    return {
      ...user,
      id: "65a100000000000000000001",
      currency: "INR",
      theme: "light",
    };
  };

  const response = await request(app).post("/api/auth/register").send({
    name: "FinTrack Tester",
    email: "  tester@example.com  ",
    password: "StrongPass123!",
    remember: true,
  });

  assert.equal(response.status, 201);
  assert.equal(savedUser.email, "tester@example.com");
  assert.ok(await bcrypt.compare("StrongPass123!", savedUser.password));
  assert.equal(response.body.user.email, "tester@example.com");
  assertJwtCookie(response);
});

test("login accepts only login fields and issues an HttpOnly JWT cookie", async () => {
  const password = await bcrypt.hash("StrongPass123!", 4);
  User.findOne = () => ({
    select: async () => ({
      id: "65a100000000000000000001",
      name: "FinTrack Tester",
      email: "tester@example.com",
      password,
      currency: "INR",
      theme: "light",
    }),
  });

  const response = await request(app).post("/api/auth/login").send({
    email: " tester@example.com ",
    password: "StrongPass123!",
    remember: true,
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.user.email, "tester@example.com");
  assertJwtCookie(response);
});

test("login rejects the empty name field that previously caused a 400", async () => {
  const response = await request(app).post("/api/auth/login").send({
    name: "",
    email: "tester@example.com",
    password: "StrongPass123!",
  });

  assert.equal(response.status, 400);
});

test("register reports a database outage as 503 instead of a generic 500", async () => {
  User.exists = async () => {
    throw new mongoose.Error("User.exists() buffering timed out after 10s");
  };

  const response = await request(app).post("/api/auth/register").send({
    name: "FinTrack Tester",
    email: "tester@example.com",
    password: "StrongPass123!",
  });

  assert.equal(response.status, 503);
  assert.match(response.body.message, /Database is temporarily unavailable/);
});
