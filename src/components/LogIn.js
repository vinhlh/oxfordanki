import React from "react";
import { signInWithGoogle } from "../firebase";

function Login() {
  return (
    <a href="#" onClick={signInWithGoogle}>
      Login with Google
    </a>
  );
}

export default Login;
