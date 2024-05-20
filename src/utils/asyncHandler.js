const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };


//here we did not return as we didnt use {}
// const asyncHandler5 = (fn) => (req, res, next) => {
//   Promise.resolve(fn(req, res, next)).catch(next);
// };


// this is higher order that accepts function as parameter or returns a function or both
// taking func as parameter for async handler, taking another function that takes parameters for func
// the asyncHandler takes a function normal func and returns an asynchronous func.

//using try catch
// const asyncHandler = (func) => {
//   async (req, res, next) => {
//     try {
//       await func(req, res, next);
//     } catch (error) {
//       res.status(err.code || 500).json({
//         success: false,
//         message: err.message,
//       });
//     }
//   };
// };
