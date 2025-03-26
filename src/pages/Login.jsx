import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../login.css";

const customerAccounts = [{ email: "customer", password: "000000" }];

const contractorAccounts = [{ email: "contractor", password: "000000" }];

const LoginSignup = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setEmail(""); // Clear email on toggle
    setPassword(""); // Clear password on toggle
  };

  const handleSubmit = () => {
    // Check login credentials in both arrays
    const customerAccount = customerAccounts.find(
      (acc) => acc.email === email && acc.password === password
    );
    const contractorAccount = contractorAccounts.find(
      (acc) => acc.email === email && acc.password === password
    );

    if (customerAccount) {
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("userType", "customer");
      window.dispatchEvent(new Event("storage")); // Trigger storage event manually
      navigate("../");
    } else if (contractorAccount) {
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("userType", "contractor");
      window.dispatchEvent(new Event("storage")); // Trigger storage event manually
      navigate("../contractor-main");
    } else {
      alert("Either Email or Password is incorrect");
    }
  };

  return (
    <div className="login">
      <div className="login-container">
        <div className="wrapper">
          <div
            className="title-text"
            style={{
              transform: isLogin ? "translateX(0)" : "translateX(-50%)",
            }}
          >
            <div className={`title login ${isLogin ? "active" : ""}`}>
              Login Form
            </div>
            <div className={`title signup ${!isLogin ? "active" : ""}`}>
              Signup Form
            </div>
          </div>
          <div className="form-container">
            <div className="slide-controls">
              <input
                type="radio"
                name="slide"
                id="login"
                checked={isLogin}
                onChange={toggleForm}
              />
              <input
                type="radio"
                name="slide"
                id="signup"
                checked={!isLogin}
                onChange={toggleForm}
              />
              <label
                htmlFor="login"
                className="slide login"
                onClick={toggleForm}
              >
                Login
              </label>
              <label
                htmlFor="signup"
                className="slide signup"
                onClick={toggleForm}
              >
                Signup
              </label>
              <div
                className="slider-tab"
                style={{ left: isLogin ? "0%" : "50%" }}
              ></div>
            </div>
            <div
              className="form-inner"
              style={{
                transform: isLogin ? "translateX(0)" : "translateX(-50%)",
              }}
            >
              <form className="login" onSubmit={(e) => e.preventDefault()}>
                <div className="user-box">
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <label className="logE">Email</label>
                </div>
                <div className="user-box">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <label className="logP">Password</label>
                </div>
                <div className="submit-btn" id="logSubmit">
                  <button type="button" onClick={handleSubmit}>
                    SUBMIT
                  </button>
                </div>
                <div className="signup-link">
                  Not a member?{" "}
                  <a href="#" onClick={toggleForm}>
                    Signup now
                  </a>
                </div>
              </form>
              <form className="signup">
                <div className="user-box">
                  <input id="signName" type="text" required />
                  <label className="signN">Name</label>
                </div>
                <div className="user-box">
                  <input id="signEmail" type="text" required />
                  <label className="signE">Email</label>
                </div>
                <div className="user-box">
                  <input id="signPass" type="password" required />
                  <label className="signP">Password</label>
                </div>
                <div className="submit-btn" id="signSubmit">
                  <button type="button">SUBMIT</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;
