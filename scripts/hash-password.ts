import { hashPassword } from "@/lib/password";

const password = process.argv[2];

if (!password) {
  console.error("Usage: npm run hash:password <password>");
  process.exit(1);
}

const hash = hashPassword(password);
console.log("\nADMIN_PASSWORD_HASH=" + hash + "\n");
console.log("Copy the line above into your .env.local (or your prod secret store).");
