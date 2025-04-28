import { apiUrl } from "./utils";

export const newAction = async (
  role,
  username,
  actionDescription,
  actionType
) => {
  try {
    const response = await fetch(`${apiUrl}/actions/logs/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role,
        username,
        actionDescription,
        actionType,
      }),
    });

    if (response.ok) {
      console.log("Action was logged.");
    } else {
      const error = await response.text();
      console.log("Action was not logged:", error);
    }
  } catch (err) {
    console.log(err);
  }
};
