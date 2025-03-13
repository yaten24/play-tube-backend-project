const asyncHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
    }
}

// const asyncHandler = () => {};
// const asyncHandler = () => {() => {}};
// const asynchandler = () => {async () => {}};
// const asyncHandler = (func) => async (req, res, next) => {
//     try {
//         await func(req, res, next);
//     } catch (error) {
//         res.status( err.code || 400).json({
//             message: err.message,
//             success: false
//         })
//     }
// }