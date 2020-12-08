import { Router } from "express";
import mongoose from "mongoose";
import Joi from "joi";
import { authorize } from "../../auth/auth.controller";
import tryCatchWrapper from "../../helpers/function-helpers/try-catch-wrapper";
import validate from "../../helpers/function-helpers/validate";
import {
  postCall,
  addToFavourites,
  removeFromFavourites,
  deleteCall,
  editCall,
  loadPages,
  getFavourites,
  getCalls,
} from "./call.controller";
import { multerMid } from "../../helpers/function-helpers/multer-config";
import { Categories } from "../../helpers/typescript-helpers/enums";

const postCallSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  category: Joi.string()
    .required()
    .valid(
      Categories.BUSINESS_AND_SERVICES,
      Categories.ELECTRONICS,
      Categories.FREE,
      Categories.PROPERTY,
      Categories.RECREATION_AND_SPORT,
      Categories.TRADE,
      Categories.TRANSPORT,
      Categories.WORK
    ),
  price: Joi.number().required().min(0),
  phone: Joi.custom((value, helpers) => {
    const uaPhoneRegex = /^\+?3?8?(0\d{9})$/;
    const isValidPhone = uaPhoneRegex.test(value);
    if (!isValidPhone) {
      return helpers.message({
        custom: "Invalid 'phone'. Please, use +380000000000 format",
      });
    }
    return value;
  }).required(),
});

const callIdSchema = Joi.object({
  callId: Joi.string()
    .custom((value, helpers) => {
      const isValidObjectId = mongoose.Types.ObjectId.isValid(value);
      if (!isValidObjectId) {
        return helpers.message({
          custom: "Invalid 'callId'. Must be a MongoDB ObjectId",
        });
      }
      return value;
    })
    .required(),
});

const editCallSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  category: Joi.string().valid(
    Categories.BUSINESS_AND_SERVICES,
    Categories.ELECTRONICS,
    Categories.FREE,
    Categories.PROPERTY,
    Categories.RECREATION_AND_SPORT,
    Categories.TRADE,
    Categories.TRANSPORT,
    Categories.WORK
  ),
  price: Joi.number().min(0),
  phone: Joi.custom((value, helpers) => {
    const uaPhoneRegex = /^\+?3?8?(0\d{9})$/;
    const isValidPhone = uaPhoneRegex.test(value);
    if (!isValidPhone) {
      return helpers.message({
        custom: "Invalid 'phone'. Please, use +380000000000 format",
      });
    }
    return value;
  }),
}).min(1);

const getCallsSchema = Joi.object({
  page: Joi.number().required().min(1).max(3),
});

const router = Router();

router.post(
  "/",
  authorize,
  multerMid.array("file"),
  validate(postCallSchema),
  tryCatchWrapper(postCall)
);
router.post(
  "/favourite/:callId",
  authorize,
  validate(callIdSchema, "params"),
  tryCatchWrapper(addToFavourites)
);
router.delete(
  "/favourite/:callId",
  authorize,
  validate(callIdSchema, "params"),
  tryCatchWrapper(removeFromFavourites)
);
router.delete(
  "/:callId",
  authorize,
  validate(callIdSchema, "params"),
  tryCatchWrapper(deleteCall)
);
router.patch(
  "/:callId",
  authorize,
  multerMid.array("file"),
  validate(callIdSchema, "params"),
  validate(editCallSchema),
  tryCatchWrapper(editCall)
);
router.get(
  "/",
  authorize,
  validate(getCallsSchema, "query"),
  tryCatchWrapper(loadPages)
);
router.get("/own", authorize, tryCatchWrapper(getCalls));
router.get("/favourites", authorize, tryCatchWrapper(getFavourites));

export default router;
