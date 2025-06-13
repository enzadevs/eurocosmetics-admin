import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/routes.js";

dotenv.config();

const app = express();

const corsOptions = {
  origin: ["http://localhost:8124", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "400mb", extended: true }));
app.use(
  express.urlencoded({ limit: "400mb", extended: true, parameterLimit: 500000 })
);

app.use("/", routes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const port = process.env.PORT || 8123;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
