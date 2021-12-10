/*
Copyright 2021 New Vector Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React, { useCallback, useRef, useState } from "react";
import { useHistory, useLocation, Link } from "react-router-dom";
import { ReactComponent as Logo } from "./icons/LogoLarge.svg";
import { FieldRow, InputField, ErrorMessage } from "./Input";
import { Button } from "./button";
import { useClient } from "./ConferenceCallManagerHooks";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const { login } = useClient();
  const [homeserver, setHomeServer] = useState(
    `${window.location.protocol}//${window.location.host}`
  );
  const usernameRef = useRef();
  const passwordRef = useRef();
  const history = useHistory();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();

  // TODO: Handle hitting login page with authenticated client

  const onSubmitLoginForm = useCallback(
    (e) => {
      e.preventDefault();
      setLoading(true);

      login(homeserver, usernameRef.current.value, passwordRef.current.value)
        .then(() => {
          if (location.state && location.state.from) {
            history.push(location.state.from);
          } else {
            history.push("/");
          }
        })
        .catch((error) => {
          setError(error);
          setLoading(false);
        });
    },
    [login, location, history, homeserver]
  );

  return (
    <>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.formContainer}>
            <Logo width="auto" height="auto" className={styles.logo} />

            <h2>Log In</h2>
            <h4>To continue to Element</h4>
            <form onSubmit={onSubmitLoginForm}>
              <FieldRow>
                <InputField
                  type="text"
                  value={homeserver}
                  onChange={(e) => setHomeServer(e.target.value)}
                  placeholder="Homeserver"
                  label="Homeserver"
                  autoCorrect="off"
                  autoCapitalize="none"
                />
              </FieldRow>
              <FieldRow>
                <InputField
                  type="text"
                  ref={usernameRef}
                  placeholder="Username"
                  label="Username"
                  autoCorrect="off"
                  autoCapitalize="none"
                />
              </FieldRow>
              <FieldRow>
                <InputField
                  type="password"
                  ref={passwordRef}
                  placeholder="Password"
                  label="Password"
                />
              </FieldRow>
              {error && (
                <FieldRow>
                  <ErrorMessage>{error.message}</ErrorMessage>
                </FieldRow>
              )}
              <FieldRow>
                <Button type="submit" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </FieldRow>
            </form>
          </div>
          <div className={styles.authLinks}>
            <p>Not registered yet?</p>
            <p>
              <Link to="/register">Create an account</Link>
              {" Or "}
              <Link to="/">Access as a guest</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
