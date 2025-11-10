import { useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContextExport";
import axios from "axios";

export default function OAuthCallback() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuth = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get("code");
      const type = params.get("type");

      if (!code || !type) {
        navigate("/login", { state: { error: "Invalid OAuth response" } });
        return;
      }

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/oauth-verify`,
          { token: code, provider: type }
        );

        const { token, user } = res.data;

        if (token && user) {
          login(token, user);
          navigate("/user/countries", {
            state: { username: user.fullName || user.name || "Friend" },
          });
        } else {
          throw new Error("Invalid response from server");
        }
      } catch (err) {
        console.error("OAuth verification failed:", err);
        navigate("/login", {
          state: { error: "Failed to verify Google login" },
        });
      }
    };

    handleAuth();
  }, [location, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center p-8 max-w-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FCA311] mx-auto mb-4"></div>
        <h2 className="text-2xl font-medium mb-4">Signing you in...</h2>
        <p className="text-gray-600">
          Please wait while we complete your authentication.
        </p>
      </div>
    </div>
  );
}
