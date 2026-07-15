import { auth } from "./src/lib/auth";

async function test() {
  try {
    const res = await auth.api.signUpEmail({
      body: {
        email: "test_new2@evaluna.com",
        password: "password123",
        name: "Test User",
      },
      headers: new Headers(),
    });
    console.log("Success:", res);
  } catch (e: any) {
    console.error("Signup Error:");
    console.error(e);
  }
}

test();
