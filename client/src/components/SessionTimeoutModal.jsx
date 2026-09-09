import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { logout, setCredentials } from "../store/authSlice";

// How long the user can stay inactive before we warn them.
const IDLE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes
// How long the warning popup stays up before we auto logout.
const WARNING_SECONDS = 30;

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

const SessionTimeoutModal = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);

  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_SECONDS);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const idleTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const showWarningRef = useRef(false);

  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  const clearAllTimers = () => {
    clearTimeout(idleTimerRef.current);
    clearInterval(countdownRef.current);
  };

  const handleAutoLogout = useCallback(() => {
    clearAllTimers();
    showWarningRef.current = false;
    setShowWarning(false);
    dispatch(logout());
    navigate("/login");
  }, [dispatch, navigate]);

  const startCountdown = useCallback(() => {
    setSecondsLeft(WARNING_SECONDS);
    setErrorMsg("");
    showWarningRef.current = true;
    setShowWarning(true);

    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          handleAutoLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleAutoLogout]);

  const armIdleTimer = useCallback(() => {
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(startCountdown, IDLE_LIMIT_MS);
  }, [startCountdown]);

  const resetIdleTimer = useCallback(() => {
    // Once the warning popup is showing, plain mouse/keyboard activity
    // shouldn't silently dismiss it — the user must explicitly hit Continue.
    if (showWarningRef.current) return;
    armIdleTimer();
  }, [armIdleTimer]);

  useEffect(() => {
    if (!token) {
      clearAllTimers();
      showWarningRef.current = false;
      setShowWarning(false);
      return;
    }

    armIdleTimer();
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetIdleTimer));

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, resetIdleTimer));
      clearAllTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleContinue = async () => {
    try {
      setRefreshing(true);
      setErrorMsg("");
      const res = await axiosClient.post("/auth/refresh");
      dispatch(setCredentials({ user: res.data.user, token: res.data.token }));

      clearInterval(countdownRef.current);
      showWarningRef.current = false;
      setShowWarning(false);
      armIdleTimer();
    } catch (error) {
      // Only force a logout when the server actually says the session/token
      // is invalid (401). Any other failure (network blip, server briefly
      // unreachable, etc.) shouldn't kick the user out — let them retry
      // while the countdown keeps running.
      if (error?.response?.status === 401) {
        handleAutoLogout();
      } else {
        setErrorMsg("Could not refresh session. Check your connection and try again.");
      }
    } finally {
      setRefreshing(false);
    }
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-white p-6 shadow-panel">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-marker/10 text-xl text-marker">
          ⏱
        </div>

        <h2 className="mt-4 font-display text-lg font-bold text-ink">
          Your session is about to expire
        </h2>
        <p className="mt-1.5 text-sm text-ink-muted">
          You've been inactive for a while. Click "Continue" to stay signed
          in, or you'll be automatically logged out in{" "}
          <span className="font-semibold text-ink">{secondsLeft}s</span>.
        </p>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-paper">
          <div
            className="h-full rounded-full bg-marker transition-all duration-1000 ease-linear"
            style={{ width: `${(secondsLeft / WARNING_SECONDS) * 100}%` }}
          />
        </div>

        {errorMsg && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
            {errorMsg}
          </p>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={handleAutoLogout}
            className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition hover:bg-paper hover:text-ink"
          >
            Logout now
          </button>
          <button
            onClick={handleContinue}
            disabled={refreshing}
            className="rounded-lg bg-linear-to-r from-blueprint to-blueprint-dark px-4 py-2 text-sm font-semibold text-white shadow-card transition disabled:opacity-60"
          >
            {refreshing ? "Continuing..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutModal;