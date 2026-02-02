import { describe, expect, test } from "bun:test";
import { isValidEmail } from "./email-validator";

describe("Email Validator", () => {
  describe("Valid Emails", () => {
    test("standard email", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
    });

    test("plus addressing", () => {
      expect(isValidEmail("user+tag@example.com")).toBe(true);
      expect(isValidEmail("user+newsletter@example.com")).toBe(true);
    });

    test("subdomains", () => {
      expect(isValidEmail("user@mail.example.com")).toBe(true);
      expect(isValidEmail("user@subdomain.mail.example.com")).toBe(true);
    });

    test("numbers in local part", () => {
      expect(isValidEmail("user123@example.com")).toBe(true);
      expect(isValidEmail("123user@example.com")).toBe(true);
    });

    test("dots in local part", () => {
      expect(isValidEmail("first.last@example.com")).toBe(true);
      expect(isValidEmail("first.middle.last@example.com")).toBe(true);
    });

    test("various TLDs", () => {
      expect(isValidEmail("user@example.org")).toBe(true);
      expect(isValidEmail("user@example.io")).toBe(true);
      expect(isValidEmail("user@example.museum")).toBe(true);
      expect(isValidEmail("user@example.co")).toBe(true);
    });

    test("hyphens in domain", () => {
      expect(isValidEmail("user@my-company.com")).toBe(true);
      expect(isValidEmail("user@test-domain.org")).toBe(true);
    });

    test("underscores in local part", () => {
      expect(isValidEmail("user_name@example.com")).toBe(true);
    });

    test("mixed case", () => {
      expect(isValidEmail("User@Example.COM")).toBe(true);
      expect(isValidEmail("USER@EXAMPLE.COM")).toBe(true);
    });
  });

  describe("Invalid Emails", () => {
    test("missing @", () => {
      expect(isValidEmail("userexample.com")).toBe(false);
    });

    test("missing domain", () => {
      expect(isValidEmail("user@")).toBe(false);
    });

    test("missing local part", () => {
      expect(isValidEmail("@example.com")).toBe(false);
    });

    test("double dots", () => {
      expect(isValidEmail("user..name@example.com")).toBe(false);
      expect(isValidEmail("user@example..com")).toBe(false);
    });

    test("spaces", () => {
      expect(isValidEmail("user @example.com")).toBe(false);
      expect(isValidEmail("user@ example.com")).toBe(false);
      expect(isValidEmail(" user@example.com")).toBe(false);
      expect(isValidEmail("user@example.com ")).toBe(false);
    });

    test("invalid characters", () => {
      expect(isValidEmail("user<>@example.com")).toBe(false);
      expect(isValidEmail("user()@example.com")).toBe(false);
      expect(isValidEmail("user,name@example.com")).toBe(false);
    });

    test("missing TLD", () => {
      expect(isValidEmail("user@example")).toBe(false);
    });

    test("single char TLD", () => {
      expect(isValidEmail("user@example.c")).toBe(false);
    });

    test("empty string", () => {
      expect(isValidEmail("")).toBe(false);
    });

    test("null/undefined handling", () => {
      expect(isValidEmail(null as unknown as string)).toBe(false);
      expect(isValidEmail(undefined as unknown as string)).toBe(false);
    });

    test("multiple @ symbols", () => {
      expect(isValidEmail("user@@example.com")).toBe(false);
      expect(isValidEmail("user@name@example.com")).toBe(false);
    });

    test("domain starting with dot", () => {
      expect(isValidEmail("user@.example.com")).toBe(false);
    });

    test("domain ending with dot", () => {
      expect(isValidEmail("user@example.com.")).toBe(false);
    });
  });
});
