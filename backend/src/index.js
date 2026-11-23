import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./db/db.js";

dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 3000;
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
