require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const compression = require("compression");
const SocketService = require("./services/socket.service");
const app = express();
const cors = require("cors");

// init middlewares
app.use(morgan("dev"));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

// init db mongodb
require("./dbs/init.mongodb");

// init routes
app.use("/v1/api", require("./routes"));

const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

global._io = io;

global._io.on("connection", SocketService.connection);

// handlling error
app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});
app.use((error, req, res, next) => {
  console.log(error.message);
  const statusCode = error.status || 500;
  return res.status(statusCode).json({
    status: "error",
    code: statusCode,
    stack: error.stack,
    message: error.message || "Internal Server Error",
  });
});
module.exports = http;
