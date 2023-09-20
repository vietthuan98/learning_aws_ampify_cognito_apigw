"use client";
import { useState } from "react";
import { API, Amplify, Auth } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure({
  aws_project_region: process.env.NEXT_PUBLIC_AWS_PROJECT_REGION,
  aws_cognito_region: process.env.NEXT_PUBLIC_AWS_COGNITO_REGION,
  aws_user_pools_id: process.env.NEXT_PUBLIC_AWS_USER_POOLS_ID,
  aws_user_pools_web_client_id:
    process.env.NEXT_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID,
  aws_mandatory_sign_in: process.env.NEXT_PUBLIC_AWS_MANDATORY_SIGN_IN,

  aws_cloud_logic_custom: [
    {
      name: process.env.NEXT_PUBLIC_AWS_API_GATEWAY_NAME,
      endpoint: process.env.NEXT_PUBLIC_AWS_API_GATEWAY_ENDPOINT,
      region: process.env.NEXT_PUBLIC_AWS_API_GATEWAY_REGION,
    },
  ],
});

export default function Home() {
  const [cognitoUser, setCognitoUser] = useState({});

  /**
   * GET Token Id from Cognito user
   * Using the token to call protected API Gateway
   */

  const idToken = cognitoUser?.signInUserSession?.idToken?.jwtToken || "";

  const buildExtraRequestParams = () => {
    return {
      headers: {
        Authorization: idToken,
      },
    };
  };

  const getUserData = async () => {
    const user = await Auth.currentAuthenticatedUser();
    setCognitoUser(user);
    console.log("userData: ", user);
  };

  const getRestAPI = async () => {
    const requestParams = buildExtraRequestParams();
    const data = await API.get(
      process.env.NEXT_PUBLIC_AWS_API_GATEWAY_NAME,
      "/hello",
      requestParams
    );
    console.log("Get Rest API response: ", data);
  };

  const postRestAPI = async () => {
    const requestParams = buildExtraRequestParams();
    const data = await API.post(
      process.env.NEXT_PUBLIC_AWS_API_GATEWAY_NAME,
      "/hello",
      {
        ...requestParams,
        body: {
          email: cognitoUser?.attributes?.email || "",
          name: cognitoUser?.attributes?.name || "",
          age: 20,
        },
      }
    );
    console.log("Post Rest API response: ", data);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Serverless | Amplify-app</h1>
      <p>Auth: AWS Cognito</p>
      <p>API: AWS Gateway - Rest API</p>

      <Authenticator
        loginMechanisms={["email"]}
        signUpAttributes={["name"]}
        socialProviders={["amazon", "apple", "facebook", "google"]}
      >
        {({ signOut, user }) => (
          <div>
            <h1>
              Hello {user.attributes.name} - {user.attributes.email}
            </h1>
            <p>Secret message. Should be hidden.</p>
            <div className="py-5">
              <p>{'*Note: Must run "Get user data" before using Rest API'}</p>
              <button onClick={getUserData}> - Get user data</button>
              <br></br>
              <button disabled={!idToken} onClick={getRestAPI}>
                - Get Rest API
              </button>
              <br></br>
              <button disabled={!idToken} onClick={postRestAPI}>
                - Post Rest API
              </button>
              <br></br>
              <button onClick={signOut}> - Sign out</button>
            </div>
          </div>
        )}
      </Authenticator>
    </main>
  );
}
