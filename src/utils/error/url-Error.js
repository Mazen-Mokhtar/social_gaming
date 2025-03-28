export const urlError = (req, res, next) => {
    return next(new Error("Invalid Url", { cause: 400 }));
}
