import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await axiosClient.get(`/auth/verify-email/${token}`);
        setStatus("success");
        setMessage(res.data.message || "Email verified successfully.");
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification link is invalid or has expired.");
      }
    };
    verify();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blueprint text-xl font-bold text-white shadow-lg shadow-blueprint/30">
          V
        </div>

        {status === "loading" && (
          <p className="text-sm text-slate-500">Verifying your email…</p>
        )}

        {status === "success" && (
          <>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Email verified
            </h2>
            <div className="mt-4 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Verification failed
            </h2>
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {message}
            </div>
          </>
        )}

        <Link
          to="/login"
          className="mt-8 inline-block rounded-xl bg-blueprint px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blueprint/20 transition hover:bg-blueprint-dark hover:shadow-xl"
        >
          Go to sign in
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmail;