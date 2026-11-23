import { apiResponse } from "../utils/api-response.js";

export const healthcheck = (req, res) => {
  try {
    res
      .status(200)
      .json(new apiResponse(200, { message: "server is healthy" }));
  } catch (error) {}
};
