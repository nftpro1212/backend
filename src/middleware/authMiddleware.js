module.exports = function(req,res,next){ // simple placeholder
  req.user = {id:1, tg_id:0};
  next();
};
authMiddleware.js