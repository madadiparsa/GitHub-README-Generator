import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../utils/auth";


const AuthCallback = () => {

  const [status, setStatus] = useState(
    "Authenticating with GitHub..."
  );

  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();


  useEffect(() => {

    let isMounted = true;

    const authenticate = async () => {
      const searchParams = new URLSearchParams(
        location.search
      );

      const code = searchParams.get("code");

      if (!code) {
        setError(
          "No authorization code found in the URL."
        );
        return;
      }

      try {
        const response = await axios.post(
          `${API_URL}/api/auth/github/`,
          {
            code: code,
          }
        );

        const accessToken =
          response.data.access_token ||
          response.data.access;

        const refreshToken =
          response.data.refresh_token ||
          response.data.refresh;

        if (!accessToken) {
          throw new Error(
            "No access token returned from server."
          );
        }

        localStorage.setItem(
          "access_token",
          accessToken
        );

        if (refreshToken) {
          localStorage.setItem(
            "refresh_token",
            refreshToken
          );
        }

        // Persist the user object returned by dj-rest-auth so the Editor
        // can prefill the form (name, username, email, ...).
        if (response.data.user) {
          localStorage.setItem(
            "user",
            JSON.stringify(response.data.user)
          );
        }

        if (isMounted) {
          setStatus(
            "Authentication successful! Redirecting..."
          );
        }

        setTimeout(() => {
          navigate("/");
          window.location.reload();
        }, 1000);
      } catch (err) {
        console.error(
          "GitHub Login Error:",
          err.response?.data || err
        );

        if (isMounted) {
          setError(
            err.response?.data?.non_field_errors?.[0] ||
            err.response?.data?.detail ||
            "Authentication failed. Please check your backend configuration."
          );
        }
      }
    };

    authenticate();

    return () => {
      isMounted = false;
    };
  }, [location, navigate]);


  if (error) {
    return (
      <div className="spinner-container fade-in-up">
        <i
          className="bi bi-exclamation-triangle text-danger"
          style={{
            fontSize: "3rem"
          }}
        ></i>

        <h3 className="mt-3 text-danger">
          Login Failed
        </h3>

        <p className="text-secondary">
          {error}
        </p>

        <button
          className="btn btn-outline-primary mt-3"
          onClick={() => navigate("/")}

        >

          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="spinner-container fade-in-up">
      <div
        className="spinner-border text-primary"
        role="status"
        style={{
          width: "3rem",
          height: "3rem"
        }}
      >

        <span className="visually-hidden">
          Loading...
        </span>
      </div>

      <h4 className="mt-4 fw-medium">
        {status}
      </h4>
    </div>
  );
};

export default AuthCallback;