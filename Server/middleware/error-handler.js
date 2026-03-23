import { StatusCodes } from "http-status-codes";

const errorHandlerMiddleware = (err, req, res, next) => {
  console.log(err);

  let defaultError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || "Something went wrong, please try again later",
  };

  // 🔹 Mongoose Bad ObjectId
  if (err.name === "CastError") {
    defaultError.statusCode = StatusCodes.BAD_REQUEST;
    defaultError.msg = `No item found with id: ${err.value}`;
  }

  // 🔹 Mongoose Duplicate Key
  if (err.code && err.code === 11000) {
    defaultError.statusCode = StatusCodes.BAD_REQUEST;
    defaultError.msg = `Duplicate value entered for ${Object.keys(err.keyValue)} field`;
  }

  // 🔹 Mongoose Validation Error
  if (err.name === "ValidationError") {
    defaultError.statusCode = StatusCodes.BAD_REQUEST;
    defaultError.msg = Object.values(err.errors)
      .map((item) => item.message)
      .join(", ");
  }

  return res.status(defaultError.statusCode).json({
    success: false,
    message: defaultError.msg,
  });
};

export default errorHandlerMiddleware;