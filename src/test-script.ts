import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import fs from "fs";

const configPath = './firebase-applet-config.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(config);
const auth = getAuth(app);

async function testAuth() {
  const email = `test-${Date.now()}@example.com`;
  const pass = "testing123";
  try {
    console.log("Attempting to create user:", email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    console.log("Success! User created:", userCredential.user.uid);
  } catch (error: any) {
    console.error("Test Auth Error:", error.message || error.code);
  }
}

testAuth();

